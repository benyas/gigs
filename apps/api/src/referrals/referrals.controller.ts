import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReferralsService } from './referrals.service';

@Controller('referrals')
export class ReferralsController {
  constructor(private referrals: ReferralsService) {}

  @Get('code')
  @UseGuards(AuthGuard('jwt'))
  async getCode(@CurrentUser() user: { id: string }) {
    return this.referrals.getOrCreateCode(user.id);
  }

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  async apply(
    @Body() body: { code: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.referrals.applyCode(body.code, user.id);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async myReferrals(@CurrentUser() user: { id: string }) {
    return this.referrals.getMyReferrals(user.id);
  }
}
