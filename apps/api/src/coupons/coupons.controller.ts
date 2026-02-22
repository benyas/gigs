import { Controller, Post, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { CouponsService } from './coupons.service';

@Controller()
export class CouponsController {
  constructor(private coupons: CouponsService) {}

  @Post('coupons/validate')
  @UseGuards(AuthGuard('jwt'))
  async validate(@Body() body: { code: string; orderValue: number }) {
    return this.coupons.validate(body.code, body.orderValue);
  }

  @Post('admin/coupons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async create(@Body() body: any) {
    return this.coupons.create(body);
  }

  @Get('admin/coupons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async list(@Query('page') page?: string) {
    return this.coupons.list(parseInt(page || '1', 10), 20);
  }

  @Patch('admin/coupons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.coupons.update(id, body);
  }

  @Delete('admin/coupons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.coupons.remove(id);
  }
}
