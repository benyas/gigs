import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  // --- Client endpoints ---

  @Post('payments/initiate')
  @UseGuards(AuthGuard('jwt'))
  async initiatePayment(
    @Body() body: { bookingId: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.payments.initiatePayment(body.bookingId, user.id);
  }

  @Post('payments/callback')
  async handleCallback(@Body() body: Record<string, string>) {
    // CMI server-to-server callback — no auth required
    return this.payments.handleCallback(body);
  }

  // --- Provider endpoints ---

  @Get('wallet')
  @UseGuards(AuthGuard('jwt'))
  async getWallet(@CurrentUser() user: { id: string }) {
    return this.payments.getWallet(user.id);
  }

  @Get('wallet/transactions')
  @UseGuards(AuthGuard('jwt'))
  async getTransactions(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
  ) {
    return this.payments.getTransactions(user.id, parseInt(page || '1', 10), 20);
  }

  // --- Admin endpoints ---

  @Get('admin/payouts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async listPayouts(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.payments.listPayouts(parseInt(page || '1', 10), 20, status);
  }

  @Get('admin/payouts/stats')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async payoutStats() {
    return this.payments.getPayoutStats();
  }

  @Post('admin/payouts')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async createPayout(
    @Body() body: { providerId: string; amount: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.payments.createPayout(body.providerId, body.amount, user.id);
  }

  @Patch('admin/payouts/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async completePayout(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.payments.completePayout(id, user.id);
  }

  @Post('payments/refund/:bookingId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async refund(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.payments.refund(bookingId, user.id);
  }
}
