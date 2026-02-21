import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateProfileSchema, type UpdateProfileInput } from '@gigs/shared';

@Controller('profile')
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'))
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profileService.updateProfile(userId, body);
  }

  @Get('provider/:id')
  getProviderProfile(@Param('id') providerId: string) {
    return this.profileService.getProviderPublicProfile(providerId);
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  getProviderStats(@CurrentUser('id') userId: string) {
    return this.profileService.getProviderStats(userId);
  }
}
