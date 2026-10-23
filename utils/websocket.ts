import { Client, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { WsNotification } from '@/types';

let client: Client | null = null;
let messageHandler: ((notification: WsNotification) => void) | null = null;

/**
 * 后端使用 Spring SockJS（端点 /api/ws），原始 WebSocket 路径会被 SockJS 处理器拒绝（HTTP 400），
 * 因此必须通过 SockJS 客户端建立连接。SockJS 内部会选择 websocket / xhr-streaming 等可用传输。
 * token 经查询参数传递（后端 HandshakeInterceptor 读取），同时 STOMP CONNECT 帧也携带 Authorization。
 */
const buildSockJsUrl = (token: string): string => {
  const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
  return `${protocol}://${window.location.host}/api/ws?token=${encodeURIComponent(token)}`;
};

/**
 * 建立全局 WebSocket（STOMP over SockJS）连接并订阅 /topic/notification
 * 重复调用时若连接已激活则仅更新消息处理器
 */
export const connectWebSocket = (
  token: string,
  onMessage: (notification: WsNotification) => void
): void => {
  messageHandler = onMessage;
  if (client && client.active) {
    return;
  }

  client = new Client({
    webSocketFactory: () => new SockJS(buildSockJsUrl(token)),
    // STOMP 层同时携带 Authorization，兼容后端在 CONNECT 帧校验 token 的实现
    connectHeaders: {
      Authorization: `Bearer ${token}`
    },
    reconnectDelay: 5000,
    onConnect: () => {
      client?.subscribe('/topic/notification', (msg: IMessage) => {
        try {
          const notification = JSON.parse(msg.body) as WsNotification;
          messageHandler?.(notification);
        } catch {
          // 忽略无法解析的消息体
        }
      });
    },
    onStompError: (frame) => {
      console.error('[WebSocket] STOMP error:', frame.headers['message'], frame.body);
    },
    onWebSocketError: (evt) => {
      console.error('[WebSocket] transport error:', evt);
    }
  });
  client.activate();
};

/** 断开连接并清理处理器（登出或布局卸载时调用） */
export const disconnectWebSocket = (): void => {
  if (client) {
    void client.deactivate();
    client = null;
  }
  messageHandler = null;
};
