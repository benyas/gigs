import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
export class PortfolioController {
  constructor(private portfolio: PortfolioService) {}

  @Get(':providerId')
  async list(@Param('providerId') providerId: string) {
    return this.portfolio.list(providerId);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.portfolio.create(user.id, title, description, file);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; description?: string; sortOrder?: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.portfolio.update(id, user.id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.portfolio.remove(id, user.id);
  }
}
