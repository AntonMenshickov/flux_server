import Redis from 'ioredis';
import { EventsRepository } from '../clickhouse/eventsRepository';
import { EventMessage } from '../model/eventMessage';

export class ReliableBatchQueue {
  private static _instance: ReliableBatchQueue;
  private flushing = false;
  private redis: Redis;
  private queueLen: number = 0;
  private flushTimer?: NodeJS.Timeout;

  private constructor(
    private eventsRepo: EventsRepository,
    private queueName = 'queue',
    private processingName = 'processing',
    private batchSize = 5,
    private flushIntervalMs = 10000,
  ) {
    const redisUrl = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    this.redis = new Redis(redisUrl);

  }

  static get instance(): ReliableBatchQueue {
    if (!ReliableBatchQueue._instance) {
      ReliableBatchQueue._instance = new ReliableBatchQueue(new EventsRepository());
    }
    return ReliableBatchQueue._instance;
  }

  async init() {
    // await this.clearQueue();
    await this.restoreProcessing();
    await this.processQueue();
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
    console.log('[ReliableBatchQueue] Restoring unprocessed messages');
    // this.listQueue(this.queueName);
    // this.listQueue(this.processingName);
    let msgStr: string | null;
    while ((msgStr = await this.redis.lpop(this.processingName))) {
      await this.redis.rpush(this.queueName, msgStr);
    }
    this.queueLen = await this.redis.llen(this.queueName);
    console.log(`[ReliableBatchQueue] ${this.queueLen} messages in queue`);
    // this.listQueue(this.queueName);
    // this.listQueue(this.processingName);
  }


  async enqueue(event: EventMessage) {
    const serialized = JSON.stringify(event);
    await this.redis.lpush(this.queueName, serialized);
    this.queueLen++;
    this.processQueue();
  }


  private async prepareBatch(): Promise<EventMessage[]> {
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
    const processingLen = await this.redis.llen(this.processingName);
    if (processingLen > 0) {
      await this.redis.lrange(this.processingName, -this.batchSize, -1)
    } else {
      events.push(...(await this.redis.eval(script, 2, this.queueName, this.processingName, this.batchSize)) as string[]);
      this.queueLen -= events.length;
    }
    // this.listQueue(this.queueName);
    // this.listQueue(this.processingName);
    return events.map(e => JSON.parse(e)) as EventMessage[];
  }

  private async processQueue() {
    if (this.queueLen >= this.batchSize) {
      await this.flush().catch(console.error);
    }
  }


  private async flush() {
    if (this.queueLen === 0 || this.flushing) return;
    this.flushing = true;

    const batch = await this.prepareBatch();

    try {
      await this.eventsRepo.insert(batch);
      console.log(`Вставлено ${batch.length} сообщений в БД`);
      await this.redis.del(this.processingName);
      // this.listQueue(this.queueName);
      // this.listQueue(this.processingName);
      console.log(`[ReliableBatchQueue] Flushed ${batch.length} messages`);
    } catch (err) {
      console.error('[ReliableBatchQueue] error while flushing messages to database', err);
    } finally {
      this.flushing = false;
    }
  }
}