import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AvailabilityService } from './availability.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getMySchedule(@CurrentUser('id') userId: string) {
    return this.availabilityService.getSchedule(userId);
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  updateSchedule(
    @CurrentUser('id') userId: string,
    @Body() body: { slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }> },
  ) {
    return this.availabilityService.updateSchedule(userId, body.slots);
  }

  @Get('provider/:id')
  getProviderSchedule(@Param('id') providerId: string) {
    return this.availabilityService.getPublicSchedule(providerId);
  }
}
