import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VerificationService } from './verification.service';

@Controller()
export class VerificationController {
  constructor(private verification: VerificationService) {}

  @Post('verification/upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.verification.upload(user.id, type, file);
  }

  @Get('verification/mine')
  @UseGuards(AuthGuard('jwt'))
  async myDocuments(@CurrentUser() user: { id: string }) {
    return this.verification.getMyDocuments(user.id);
  }

  @Get('admin/verifications')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async listVerifications(
    @Query('page') page?: string,
    @Query('status') status?: string,
  ) {
    return this.verification.listPending(parseInt(page || '1', 10), 20, status);
  }

  @Patch('admin/verifications/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async review(
    @Param('id') id: string,
    @Body() body: { approved: boolean; rejectReason?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.verification.review(id, user.id, body.approved, body.rejectReason);
  }
}
