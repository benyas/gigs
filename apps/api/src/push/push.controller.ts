import { Controller, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PushService } from '../common/push.service';

@Controller('push')
export class PushController {
  constructor(private push: PushService) {}

  @Post('subscribe')
  @UseGuards(AuthGuard('jwt'))
  async subscribe(
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
    @CurrentUser() user: { id: string },
  ) {
    return this.push.subscribe(user.id, body);
  }

  @Delete('unsubscribe')
  @UseGuards(AuthGuard('jwt'))
  async unsubscribe(
    @Body() body: { endpoint: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.push.unsubscribe(user.id, body.endpoint);
  }
}
