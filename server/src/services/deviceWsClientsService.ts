import { singleton } from 'tsyringe';
import { DeviceWsClient } from '../websocket/deviceClient/deviceWsClient';

@singleton()
export class DeviceWsClientService {
  #clients: Array<DeviceWsClient> = [];

  get clients(): Array<DeviceWsClient> { return [...this.#clients]; }

  #addClient(client: DeviceWsClient) {
    this.#clients.push(client);
  }

  #deleteClient(client: DeviceWsClient) {
    this.#clients = this.#clients.filter(e => e != client);
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
    try {
      // DeviceWsClient exposes sendServerMessage
      (client as any).sendServerMessage(message);
      return true;
    } catch (err) {
      console.error('Failed to send message to device', err);
      return false;
    }
  }
}