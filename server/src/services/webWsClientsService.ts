import { container, singleton } from 'tsyringe';
import { WebWsClient } from '../websocket/webClient/webWsClient';
import { DeviceWsClientService } from './deviceWsClientsService';
import { WsServerMessageType } from '../websocket/model/wsServerMessage';

@singleton()
export class WebWsClientService {
  #clients: Array<WebWsClient> = [];
  // deviceUuid -> set of web clients
  private subscribers: Map<string, Set<WebWsClient>> = new Map();
  private keepEventsStreamInterval: NodeJS.Timeout | null = null;

  get clients(): Array<WebWsClient> { return [...this.#clients]; }

  #addClient(client: WebWsClient) {
    this.#clients.push(client);
    const clientInfo = client.getClientInfo();
    if (clientInfo) {
      console.log(`WebWsClientService: client connected ${clientInfo.userId} ${clientInfo.uuid}`);
    }
  }

  #deleteClient(client: WebWsClient) {
    const info = client.getClientInfo();
    if (info) {
      this.unsubscribeFromAll(info.uuid);
      console.log(`WebWsClientService: client disconnected ${info.userId} ${info.uuid}`);
    }
    this.#clients = this.#clients.filter(e => e != client);
  }

  public createWebClientAPI(client: WebWsClient) {
    const registerClient = this.#addClient.bind(this);
    const deleteClient = this.#deleteClient.bind(this);
    return Object.freeze({
      connect: () => registerClient(client),
      disconnect: () => deleteClient(client),
    });
  }

  private findClientByUuid(uuid: string): WebWsClient | undefined {
    return this.#clients.find(c => c.getClientInfo()?.uuid == uuid);
  }

  private unsubscribeFromAll(webUuid: string): boolean {
    for (let r of this.subscribers) {
      this.unsubscribe(webUuid, r[0]);
    }
    return true;
  }

  private updateKeepEventsStreamTimer() {
    if (!this.subscribers.size) {
      if (this.keepEventsStreamInterval) {
        clearInterval(this.keepEventsStreamInterval);
        this.keepEventsStreamInterval = null;
      }
    } else {
      if (!this.keepEventsStreamInterval) {
        this.keepEventsStreamInterval = setInterval(() => this.sendKeepEventsStreamEventToClients(), 1000 * 5);
      }
    }
  }

  private sendKeepEventsStreamEventToClients() {
    for (let r of this.subscribers) {
      container.resolve(DeviceWsClientService).sendToDevice(r[0], { type: WsServerMessageType.keepEventsStream, payload: {} });
    }
  }

  public subscribe(webUuid: string, deviceUuid: string): boolean {
    const client = this.findClientByUuid(webUuid);
    if (!client) return false;
    let set = this.subscribers.get(deviceUuid);
    if (!set) {
      set = new Set();
      this.subscribers.set(deviceUuid, set);
    }
    set.add(client);
    this.updateKeepEventsStreamTimer();
    console.log(`WebWsClientService: subscribed web client ${webUuid} to device ${deviceUuid}`);
    return true;
  }

  public unsubscribe(webUuid: string, deviceUuid: string): boolean {
    const client = this.findClientByUuid(webUuid);
    if (!client) return false;
    const set = this.subscribers.get(deviceUuid);
    if (!set) return false;
    set.delete(client);
    if (set.size === 0) {
      this.subscribers.delete(deviceUuid);
      container.resolve(DeviceWsClientService).sendToDevice(deviceUuid, { type: WsServerMessageType.stopEventsStream, payload: {} });
    }
    this.updateKeepEventsStreamTimer();
    console.log(`WebWsClientService: unsubscribed web client ${webUuid} from device ${deviceUuid}`);
    return true;
  }

  public removeSubscribersForDevice(deviceUuid: string) {
    this.subscribers.delete(deviceUuid);
  }

  public getSubscribers(deviceUuid: string): WebWsClient[] {
    const set = this.subscribers.get(deviceUuid);
    return set ? Array.from(set) : [];
  }
}
