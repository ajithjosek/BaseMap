import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  path: '/ws/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('NotificationsGateway');
  private clients: Map<string, WebSocket> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: WebSocket, request: any) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      client.close(1008, 'Missing token');
      return;
    }

    try {
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      this.clients.set(userId, client);
      this.logger.log(`Client connected: ${userId}`);
    } catch (error) {
      client.close(1008, 'Invalid token');
    }
  }

  handleDisconnect(client: WebSocket) {
    for (const [userId, ws] of this.clients.entries()) {
      if (ws === client) {
        this.clients.delete(userId);
        this.logger.log(`Client disconnected: ${userId}`);
        break;
      }
    }
  }

  @SubscribeMessage('mark-read')
  handleMarkRead(
    @ConnectedSocket() client: WebSocket,
    @MessageBody() data: { notificationId: string },
  ) {
    return { event: 'mark-read-ack', data: { notificationId: data.notificationId } };
  }

  sendNotificationToUser(userId: string, notification: any) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        event: 'new-notification',
        data: notification,
      }));
    }
  }

  sendUnreadCountUpdate(userId: string, count: number) {
    const client = this.clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        event: 'unread-count-update',
        data: { count },
      }));
    }
  }
}
