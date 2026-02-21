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
import { ReviewsService } from './reviews.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createReviewSchema,
  paginationSchema,
  type CreateReviewInput,
} from '@gigs/shared';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('provider/:providerId')
  findForProvider(
    @Param('providerId') providerId: string,
    @Query(new ZodValidationPipe(paginationSchema))
    query: { page: number; perPage: number },
  ) {
    return this.reviewsService.findForProvider(
      providerId,
      query.page,
      query.perPage,
    );
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput,
  ) {
    return this.reviewsService.create(userId, body);
  }

  @Patch(':id/reply')
  @UseGuards(AuthGuard('jwt'))
  reply(
    @Param('id') reviewId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reply: string },
  ) {
    return this.reviewsService.reply(reviewId, userId, body.reply);
  }
}
