import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { BookingsService } from './bookings.service';
import { InvoiceService } from './invoice.service';
import { CalendarService } from './calendar.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createBookingSchema,
  updateBookingStatusSchema,
  paginationSchema,
  type CreateBookingInput,
  type UpdateBookingStatusInput,
} from '@gigs/shared';

@Controller('bookings')
@UseGuards(AuthGuard('jwt'))
export class BookingsController {
  constructor(
    private bookingsService: BookingsService,
    private invoiceService: InvoiceService,
    private calendarService: CalendarService,
  ) {}

  @Get()
  findMine(
    @CurrentUser('id') userId: string,
    @Query(new ZodValidationPipe(paginationSchema))
    query: { page: number; perPage: number },
  ) {
    return this.bookingsService.findForUser(userId, query.page, query.perPage);
  }

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createBookingSchema)) body: CreateBookingInput,
  ) {
    return this.bookingsService.create(userId, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateBookingStatusSchema))
    body: UpdateBookingStatusInput,
  ) {
    return this.bookingsService.updateStatus(id, userId, body.status);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.bookingsService.cancel(id, userId, body.reason);
  }

  @Get(':id/invoice')
  async invoice(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const pdf = await this.invoiceService.generateInvoice(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Get(':id/calendar')
  async calendar(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const ics = await this.calendarService.getBookingIcs(id);
    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="booking-${id}.ics"`,
    });
    res.send(ics);
  }
}
