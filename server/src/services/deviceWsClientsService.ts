import { container, singleton } from 'tsyringe';
import { DeviceWsClient } from '../websocket/deviceClient/deviceWsClient';
import { WebWsClientService } from './webWsClientsService';
import { WsServerMessageType } from '../websocket/model/wsServerMessage';

@singleton()
export class DeviceWsClientService {
  #clients: Array<DeviceWsClient> = [];

  get clients(): Array<DeviceWsClient> { return [...this.#clients]; }

  #addClient(client: DeviceWsClient) {
    this.#clients.push(client);
    const clientInfo = client.getClientInfo();
    if (clientInfo) {
      console.log(`DeviceWsClientService: client connected ${clientInfo.deviceName} ${clientInfo.uuid}:${clientInfo.deviceId}`);
    }
  }

  #deleteClient(client: DeviceWsClient) {
    this.#clients = this.#clients.filter(e => e != client);
    const clientInfo = client.getClientInfo();
    if (clientInfo) {
      const webClientService = container.resolve(WebWsClientService);
      const subscribers = webClientService.getSubscribers(clientInfo.uuid);
      for (let subscriber of subscribers) {
        subscriber.sendServerMessage({ type: WsServerMessageType.deviceDisconnected, payload: {} });
      }
      webClientService.removeSubscribersForDevice(clientInfo.uuid);
      console.log(`DeviceWsClientService: client disconnected ${clientInfo.deviceName} ${clientInfo.uuid}:${clientInfo.deviceId}`);
    }
  }

  createDeviceClientAPI(client: DeviceWsClient) {
    const registerClient = this.#addClient.bind(this);
    const deleteClient = this.#deleteClient.bind(this);
    return Object.freeze({
      connect: () => registerClient(client),
      disconnect: () => deleteClient(client),
    });
  }

  // Send a server message to a device client by deviceId. Returns true if sent.
  sendToDevice(uuid: string, message: any): boolean {
    const client = this.#clients.find(c => c.getClientInfo()?.uuid === uuid);
    if (!client) return false;
    // DeviceWsClient exposes sendServerMessage
    client.sendServerMessage(message);
    return true;
  }
}