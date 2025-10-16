import { singleton } from 'tsyringe';
import { WebWsClient } from '../websocket/webClient/webWsClient';

@singleton()
export class WebWsClientService {
  #clients: Array<WebWsClient> = [];

  get clients(): Array<WebWsClient> { return [...this.#clients]; }

  #addClient(client: WebWsClient) {
    this.#clients.push(client);
  }

  #deleteClient(client: WebWsClient) {
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
}
