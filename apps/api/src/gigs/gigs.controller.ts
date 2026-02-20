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
import { GigsService } from './gigs.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createGigSchema,
  updateGigSchema,
  gigFiltersSchema,
  type CreateGigInput,
  type UpdateGigInput,
  type GigFiltersInput,
} from '@gigs/shared';

@Controller('gigs')
export class GigsController {
  constructor(private gigsService: GigsService) {}

  @Get()
  findAll(
    @Query(new ZodValidationPipe(gigFiltersSchema))
    filters: GigFiltersInput,
  ) {
    return this.gigsService.findAll(filters);
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.gigsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('provider', 'admin')
  create(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(createGigSchema)) body: CreateGigInput,
  ) {
    return this.gigsService.create(userId, body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('provider', 'admin')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateGigSchema)) body: UpdateGigInput,
  ) {
    return this.gigsService.update(id, userId, body);
  }
}
