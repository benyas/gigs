import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isActive: true },
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isActive: true },
  { dayOfWeek: 0, startTime: '09:00', endTime: '13:00', isActive: false },
];

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getSchedule(providerId: string) {
    const existing = await this.prisma.availability.findMany({
      where: { providerId },
      orderBy: { dayOfWeek: 'asc' },
    });

    if (existing.length === 0) {
      // Seed default schedule
      await this.prisma.availability.createMany({
        data: DEFAULT_SCHEDULE.map((s) => ({ ...s, providerId })),
      });
      return this.prisma.availability.findMany({
        where: { providerId },
        orderBy: { dayOfWeek: 'asc' },
      });
    }

    return existing;
  }

  async updateSchedule(
    providerId: string,
    slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>,
  ) {
    for (const slot of slots) {
      await this.prisma.availability.upsert({
        where: { providerId_dayOfWeek: { providerId, dayOfWeek: slot.dayOfWeek } },
        update: { startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive },
        create: { providerId, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive },
      });
    }

    return this.getSchedule(providerId);
  }

  async getPublicSchedule(providerId: string) {
    return this.prisma.availability.findMany({
      where: { providerId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
      select: { dayOfWeek: true, startTime: true, endTime: true },
    });
  }
}
