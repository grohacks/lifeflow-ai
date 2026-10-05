import { Client } from '@stomp/stompjs';

type MessageHandler = (message: any) => void;

class WebSocketClientService {
  private client: Client | null = null;
  private subscribers: Map<string, Set<MessageHandler>> = new Map();
  private stompSubscriptions: Map<string, any> = new Map();
  private connected: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.host}/ws`;

    this.client = new Client({
      brokerURL: brokerURL,
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {},
      onConnect: () => {
        this.connected = true;
        this.stompSubscriptions.clear();
        this.subscribers.forEach((handlers, topic) => {
          if (handlers.size > 0) {
            this.subscribeToTopic(topic);
          }
        });
      },
      onDisconnect: () => {
        this.connected = false;
        this.stompSubscriptions.clear();
      },
      onStompError: (frame) => {
        console.warn('STOMP Error:', frame.headers['message']);
      }
    });

    try {
      this.client.activate();
    } catch (e) {
      console.warn('WebSocket activate error:', e);
    }
  }

  public subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);

    if (this.connected && !this.stompSubscriptions.has(topic)) {
      this.subscribeToTopic(topic);
    }

    return () => {
      const handlers = this.subscribers.get(topic);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.subscribers.delete(topic);
          const stompSub = this.stompSubscriptions.get(topic);
          if (stompSub) {
            try {
              stompSub.unsubscribe();
            } catch (err) {
              console.warn('Error unsubscribing STOMP topic:', topic, err);
            }
            this.stompSubscriptions.delete(topic);
          }
        }
      }
    };
  }

  private subscribeToTopic(topic: string) {
    if (!this.client || !this.connected) return;
    if (this.stompSubscriptions.has(topic)) return;

    try {
      const sub = this.client.subscribe(topic, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          const handlers = this.subscribers.get(topic);
          if (handlers) {
            handlers.forEach((fn) => fn(data));
          }
        } catch (e) {
          console.error(`Error parsing message on ${topic}:`, e);
        }
      });
      this.stompSubscriptions.set(topic, sub);
    } catch (e) {
      console.warn(`Error subscribing to ${topic}:`, e);
    }
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public publish(destination: string, body: any): void {
    if (!this.client || !this.connected) {
      // If not yet connected, activate or queue
      return;
    }
    try {
      this.client.publish({
        destination,
        body: typeof body === 'string' ? body : JSON.stringify(body)
      });
    } catch (e) {
      console.warn(`Error publishing to ${destination}:`, e);
    }
  }
}

export const wsService = new WebSocketClientService();
