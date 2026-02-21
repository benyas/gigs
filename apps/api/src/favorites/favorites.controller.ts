import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
export class FavoritesController {
  constructor(private favorites: FavoritesService) {}

  @Post(':gigId')
  @UseGuards(AuthGuard('jwt'))
  async toggle(
    @Param('gigId') gigId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.favorites.toggle(user.id, gigId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async list(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
  ) {
    return this.favorites.list(user.id, parseInt(page || '1', 10), 20);
  }

  @Get(':gigId/check')
  @UseGuards(AuthGuard('jwt'))
  async check(
    @Param('gigId') gigId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.favorites.isFavorited(user.id, gigId);
  }
}
