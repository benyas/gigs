import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { updateProfileSchema, type UpdateProfileInput } from '@gigs/shared';

@Controller('profile')
@UseGuards(AuthGuard('jwt'))
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser('id') userId: string) {
    return this.profileService.getProfile(userId);
  }

  @Patch()
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profileService.updateProfile(userId, body);
  }
}
