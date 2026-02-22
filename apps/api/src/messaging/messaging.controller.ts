import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MessagingService } from './messaging.service';

@Controller('messaging')
@UseGuards(AuthGuard('jwt'))
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.messagingService.getConversations(userId);
  }

  @Get('conversations/:id/messages')
  getMessages(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
  ) {
    return this.messagingService.getMessages(conversationId, userId, page ? parseInt(page) : 1);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') conversationId: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.messagingService.sendMessage(conversationId, userId, content);
  }

  @Post('conversations')
  startConversation(
    @CurrentUser('id') userId: string,
    @Body() body: { providerId: string; message: string; bookingId?: string },
  ) {
    return this.messagingService.startConversation(userId, body.providerId, body.message, body.bookingId);
  }

  @Get('unread')
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.messagingService.getUnreadCount(userId);
  }
}
