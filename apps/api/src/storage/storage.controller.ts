import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

@Controller('uploads')
@UseGuards(AuthGuard('jwt'))
export class StorageController {
  constructor(private storage: StorageService) {}

  @Post('file')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException('Only JPEG, PNG, WebP and GIF images are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'general',
  ) {
    if (!file) throw new BadRequestException('No file provided');
    return this.storage.upload(file, folder);
  }

  @Post('files')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException('Only JPEG, PNG, WebP and GIF images are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') folder: string = 'general',
  ) {
    if (!files?.length) throw new BadRequestException('No files provided');
    return this.storage.uploadMultiple(files, folder);
  }

  @Post('presigned')
  async getPresignedUrl(
    @Body() body: { folder: string; filename: string; contentType: string },
  ) {
    if (!body.filename || !body.contentType) {
      throw new BadRequestException('filename and contentType are required');
    }
    return this.storage.getPresignedUploadUrl(
      body.folder || 'general',
      body.filename,
      body.contentType,
    );
  }
}
