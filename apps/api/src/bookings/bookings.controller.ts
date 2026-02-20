import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
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
  constructor(private bookingsService: BookingsService) {}

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
}
