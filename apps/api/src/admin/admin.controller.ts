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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // --- Stats ---
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // --- Users ---
  @Get('users')
  listUsers(
    @Query('page') page = '1',
    @Query('perPage') perPage = '20',
    @Query('role') role?: string,
    @Query('q') q?: string,
  ) {
    return this.adminService.listUsers(+page, +perPage, role, q);
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: string) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/verify')
  verifyUser(@Param('id') id: string, @Body('verified') verified: boolean) {
    return this.adminService.verifyUser(id, verified);
  }

  // --- Gigs ---
  @Get('gigs')
  listGigs(
    @Query('page') page = '1',
    @Query('perPage') perPage = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.listAllGigs(+page, +perPage, status);
  }

  @Patch('gigs/:id/status')
  updateGigStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.adminService.updateGigStatus(id, status);
  }

  // --- Bookings ---
  @Get('bookings')
  listBookings(
    @Query('page') page = '1',
    @Query('perPage') perPage = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.listAllBookings(+page, +perPage, status);
  }

  // --- Categories ---
  @Post('categories')
  createCategory(@Body() body: { name: string; slug: string; icon: string }) {
    return this.adminService.createCategory(body);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() body: { name?: string; slug?: string; icon?: string }) {
    return this.adminService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // --- Cities ---
  @Post('cities')
  createCity(@Body() body: { name: string; region: string }) {
    return this.adminService.createCity(body);
  }

  @Patch('cities/:id')
  updateCity(@Param('id') id: string, @Body() body: { name?: string; region?: string }) {
    return this.adminService.updateCity(id, body);
  }

  @Delete('cities/:id')
  deleteCity(@Param('id') id: string) {
    return this.adminService.deleteCity(id);
  }
}
