import { singleton } from 'tsyringe';
import { WebWsClient } from '../websocket/webClient/webWsClient';

@singleton()
export class WebWsClientService {
  #clients: Array<WebWsClient> = [];
  #subscriptions: Map<string, Set<WebWsClient>> = new Map(); // uuid -> set of web clients

  get clients(): Array<WebWsClient> { return [...this.#clients]; }

  #addClient(client: WebWsClient) {
    this.#clients.push(client);
  }

  #deleteClient(client: WebWsClient) {
    const info = client.getClientInfo();
    if (info) {
      this.#unsubscribeFromAll(info.userId);
    }
    this.#clients = this.#clients.filter(e => e != client);
  }

  createWebClientAPI(client: WebWsClient) {
    const registerClient = this.#addClient.bind(this);
    const deleteClient = this.#deleteClient.bind(this);
    return Object.freeze({
      connect: () => registerClient(client),
      disconnect: () => deleteClient(client),
    });
  }

  findClientByUserId(userId: string): WebWsClient | undefined {
    return this.#clients.find(c => c.getClientInfo()?.userId === userId);
  }

  #unsubscribeFromAll(userId: string): boolean {
    const client = this.findClientByUserId(userId);
    for (let uuid in this.#clients) {
      this.unsubscribe(userId, uuid);
    }
    return true;
  }

  subscribe(userId: string, uuid: string): boolean {
    const client = this.findClientByUserId(userId);
    if (!client) return false;
    let set = this.#subscriptions.get(uuid);
    if (!set) {
      set = new Set();
      this.#subscriptions.set(uuid, set);
    }
    set.add(client);
    console.log(`WebWsClientService: subscribed user ${userId} to device ${uuid}`);
    return true;
  }

  unsubscribe(userId: string, uuid: string): boolean {
    const client = this.findClientByUserId(userId);
    if (!client) return false;
    const set = this.#subscriptions.get(uuid);
    if (!set) return false;
    set.delete(client);
    if (set.size === 0) this.#subscriptions.delete(uuid);
    console.log(`WebWsClientService: unsubscribed user ${userId} from device ${uuid}`);
    return true;
  }

  getSubscribers(uuid: string): WebWsClient[] {
    const set = this.#subscriptions.get(uuid);
    return set ? Array.from(set) : [];
  }
}
