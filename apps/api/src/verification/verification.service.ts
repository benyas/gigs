import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(userId: string, type: string, file: Express.Multer.File) {
    const validTypes = ['cin', 'business_license', 'diploma'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException(`Invalid document type. Must be one of: ${validTypes.join(', ')}`);
    }

    const uploaded = await this.storage.uploadMultiple([file], `verification/${userId}`);

    return this.prisma.verificationDocument.create({
      data: {
        userId,
        type,
        fileUrl: uploaded[0].url,
      },
    });
  }

  async getMyDocuments(userId: string) {
    return this.prisma.verificationDocument.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPending(page: number, perPage: number, status?: string) {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.verificationDocument.findMany({
        where,
        include: { user: { include: { profile: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.verificationDocument.count({ where }),
    ]);

    return {
      data,
      meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
    };
  }

  async review(docId: string, adminId: string, approved: boolean, rejectReason?: string) {
    const doc = await this.prisma.verificationDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) throw new NotFoundException('Document not found');
    if (doc.status !== 'pending') {
      throw new BadRequestException('Document already reviewed');
    }

    const updated = await this.prisma.verificationDocument.update({
      where: { id: docId },
      data: {
        status: approved ? 'approved' : 'rejected',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectReason: approved ? null : (rejectReason || 'Rejected'),
      },
    });

    // If approved, check if all docs are approved and verify the profile
    if (approved) {
      const pendingDocs = await this.prisma.verificationDocument.count({
        where: { userId: doc.userId, status: 'pending' },
      });
      const rejectedDocs = await this.prisma.verificationDocument.count({
        where: { userId: doc.userId, status: 'rejected' },
      });

      if (pendingDocs === 0 && rejectedDocs === 0) {
        await this.prisma.profile.updateMany({
          where: { userId: doc.userId },
          data: { isVerified: true },
        });
      }
    }

    return updated;
  }
}
