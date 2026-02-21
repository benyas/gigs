import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DisputesService } from './disputes.service';

@Controller()
export class DisputesController {
  constructor(private disputes: DisputesService) {}

  @Post('disputes')
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() body: { bookingId: string; reason: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.disputes.create(user.id, body.bookingId, body.reason);
  }

  @Get('disputes')
  @UseGuards(AuthGuard('jwt'))
  async myDisputes(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
  ) {
    return this.disputes.listForUser(user.id, parseInt(page || '1', 10), 20);
  }

  @Get('disputes/:id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.disputes.findById(id, user.id);
  }

  @Post('disputes/:id/messages')
  @UseGuards(AuthGuard('jwt'))
  async addMessage(
    @Param('id') id: string,
    @Body() body: { content: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.disputes.addMessage(id, user.id, body.content);
  }

  @Get('admin/disputes')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async listAll(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.disputes.listAll(parseInt(page || '1', 10), 20, status);
  }

  @Patch('admin/disputes/:id/resolve')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async resolve(
    @Param('id') id: string,
    @Body() body: { resolution: string; resolveInFavorOf: 'client' | 'provider' },
    @CurrentUser() user: { id: string },
  ) {
    return this.disputes.resolve(id, user.id, body.resolution, body.resolveInFavorOf);
  }
}
