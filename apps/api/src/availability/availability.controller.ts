import { Controller, Get, Put, Param, Body, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AvailabilityService } from './availability.service';
import { CalendarService } from '../bookings/calendar.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private availabilityService: AvailabilityService,
    private calendarService: CalendarService,
  ) {}

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

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  async exportSchedule(
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const ics = await this.calendarService.getProviderScheduleIcs(userId);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="gigs-schedule.ics"',
    });
    res.send(ics);
  }
}
