import Redis from 'ioredis';
import { EventMessageView } from '../model/eventMessageView';
import { PostgresEventsRepository } from '../database/repository/postgresEventRepository';
import { EventsStatsService } from '../services/eventsStatsService';
import { container, singleton } from 'tsyringe';

@singleton()
export class ReliableBatchQueue {
  private flushing = false;
  private redis: Redis;
  private queueLen: number = 0;
  private processingLen: number = 0;
  private flushTimer?: NodeJS.Timeout;
  private queueName: string;
  private processingName: string;
  private batchSize: number;
  private flushIntervalMs: number;

  constructor(
    private eventsRepo: PostgresEventsRepository,
  ) {
    this.queueName = 'queue';
    this.processingName = 'processing';
    this.batchSize = 5;
    this.flushIntervalMs = 10000;
    this.redis = new Redis({
      host: process.env.REDIS_HOST as string,
      port: Number(process.env.REDIS_PORT),
      connectTimeout: 10000,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 2000);
        console.log(`Redis reconnect attempt #${times}, next try in ${delay}ms`);
        return delay;
      },
    });
    this.redis.on('error', async (err) => {
      console.error('Redis error:', err);
    });
  }



  async init() {
    await this.restoreProcessing();
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => this.flush().catch(console.error), this.flushIntervalMs);
    }
  }

  //dev
  private async clearQueue() {
    await this.redis.del(this.queueName);
    await this.redis.del(this.processingName);
    console.log('Очередь полностью очищена');
  }

  //dev
  private async listQueue(name: string) {
    const messages: string[] = await this.redis.lrange(name, 0, -1);
    console.log(`${name}: `, messages.map(e => JSON.parse(e).id));
  }


  private async restoreProcessing() {
    this.processingLen = await this.redis.llen(this.processingName);
    this.queueLen = await this.redis.llen(this.queueName);
    if (this.processingLen > 0 || this.queueLen > 0) {
      await this.flush();
    }
  }


  async enqueue(event: EventMessageView) {
    const serialized = JSON.stringify(event);
    await this.redis.lpush(this.queueName, serialized);
    this.queueLen++;
    this.processQueue();
  }


  private async prepareBatch(): Promise<EventMessageView[]> {
    const script = `
      local src = KEYS[1]
      local dest = KEYS[2]
      local n = tonumber(ARGV[1])
      local moved = {}
      for i = 1, n do
        local val = redis.call('RPOP', src)
        if not val then
          break
        end
        table.insert(moved, val)
        redis.call('LPUSH', dest, val)
      end
      return moved
    `;
    const events: string[] = [];
    if (this.processingLen > 0) {
      events.push(...(await this.redis.lrange(this.processingName, 0, -1)) as string[]);
    } else {
      events.push(...(await this.redis.eval(script, 2, this.queueName, this.processingName, this.batchSize)) as string[]);
      this.queueLen -= events.length;
      this.processingLen += events.length;
    }
    // this.listQueue(this.queueName);
    // this.listQueue(this.processingName);
    return events.map(e => JSON.parse(e)) as EventMessageView[];
  }

  private async processQueue() {
    if (this.queueLen >= this.batchSize) {
      await this.flush().catch(console.error);
    }
  }


  private async flush() {
    if (this.flushing) return;
    this.flushing = true;

    const batch = await this.prepareBatch();

    if (batch.length == 0) {
      this.flushing = false;
      return;
    }
    console.log(`[ReliableBatchQueue] Flushing ${batch.length} messages`);

    try {
      await this.eventsRepo.insert(batch);
      await this.redis.del(this.processingName);
      this.processingLen = 0;
      await container.resolve(EventsStatsService).onEventsAdded(batch);

    } catch (err) {
      console.error('[ReliableBatchQueue] error while flushing messages to database', err);
    } finally {
      console.log(`[ReliableBatchQueue] Flushed ${batch.length} messages`);
      this.flushing = false;
    }
  }
}