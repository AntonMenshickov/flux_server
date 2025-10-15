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
}