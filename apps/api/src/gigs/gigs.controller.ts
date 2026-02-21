import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
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

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  findMine(@CurrentUser('id') userId: string) {
    return this.gigsService.findByProvider(userId);
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

  @Post(':id/media')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('provider', 'admin')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
          cb(new BadRequestException('Only JPEG, PNG and WebP allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async addMedia(
    @Param('id') gigId: string,
    @CurrentUser('id') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.gigsService.addMedia(gigId, userId, files);
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('provider', 'admin')
  removeMedia(
    @Param('id') gigId: string,
    @Param('mediaId') mediaId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.gigsService.removeMedia(gigId, mediaId, userId);
  }
}
