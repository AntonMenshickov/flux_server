import { CONFIG } from '@/config';
import { useUserStore } from '@/stores/userStore';

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error';

export class WebsocketClient {
  private ws: WebSocket | null = null;
  private forceDisconnect: boolean = false;
  private reconnectTimer: number | null = null;

  constructor(
    private onMessage: (message: string) => unknown,
    private onStatusUpdate: (message: ConnectionStatus) => unknown,
  ) {

  }

  public connect() {
    const userStore = useUserStore();
    const tokenStr = userStore.token?.accessToken ?? '';
    if (this.ws) return;
    const wsUrl = CONFIG.API_URL.replace(/^http/, 'ws') + '/ws?client=web&token=' + encodeURIComponent(tokenStr);
    this.onStatusUpdate('connecting');
    this.ws = new WebSocket(wsUrl);
    this.ws.onopen = () => {
      console.log('Ws open');
      this.onStatusUpdate('open');
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    };
    this.ws.onmessage = async (ev: MessageEvent) => {
      this.onMessage(String(ev.data));
    };
    this.ws.onclose = () => {
      console.log('Ws closed');
      this.onStatusUpdate('closed');
      this.ws = null;
      this.scheduleReconnect();
    };
    this.ws.onerror = (e) => {
      console.log('Ws error');
      this.onStatusUpdate('error');
      this.ws?.close();
      this.scheduleReconnect();
      console.error('Logs websocket error', e);
    };
  }

  public disconnect() {
    this.forceDisconnect = true;
    this.ws?.close();
  }


  private scheduleReconnect() {
    if (this.forceDisconnect) {
      if (this.reconnectTimer)
        clearTimeout(this.reconnectTimer)
      return;
    }
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

}