import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { BookingsService } from '../bookings/bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: Record<string, any>;
  let notifQueue: Record<string, any>;

  const mockGig = {
    id: 'gig-1',
    providerId: 'provider-1',
    status: 'active',
    basePrice: 200,
  };

  const mockBooking = {
    id: 'booking-1',
    gigId: 'gig-1',
    clientId: 'client-1',
    status: 'pending',
    totalPrice: 200,
    gig: { ...mockGig, provider: { profile: { name: 'Provider' } } },
    client: { profile: { name: 'Client' } },
  };

  beforeEach(async () => {
    prisma = {
      gig: { findUnique: jest.fn() },
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };

    notifQueue = { add: jest.fn().mockResolvedValue({}) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaymentsService, useValue: { releaseEscrow: jest.fn().mockResolvedValue({}) } },
        { provide: getQueueToken('notifications'), useValue: notifQueue },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('create', () => {
    const createData = {
      gigId: 'gig-1',
      scheduledAt: '2026-03-01T10:00:00Z',
      address: '123 Rue Mohammed V, Casablanca',
      notes: 'Please come on time',
    };

    it('should create a booking and queue notification', async () => {
      prisma.gig.findUnique.mockResolvedValue(mockGig);
      prisma.booking.create.mockResolvedValue(mockBooking);

      const result = await service.create('client-1', createData);

      expect(result.id).toBe('booking-1');
      expect(result.totalPrice).toBe(200);
      expect(notifQueue.add).toHaveBeenCalledWith('booking-created', expect.objectContaining({
        bookingId: 'booking-1',
        providerId: 'provider-1',
      }));
    });

    it('should throw NotFoundException if gig does not exist', async () => {
      prisma.gig.findUnique.mockResolvedValue(null);

      await expect(service.create('client-1', createData)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if gig is not active', async () => {
      prisma.gig.findUnique.mockResolvedValue({ ...mockGig, status: 'paused' });

      await expect(service.create('client-1', createData)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if booking own gig', async () => {
      prisma.gig.findUnique.mockResolvedValue(mockGig);

      await expect(service.create('provider-1', createData)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should allow provider to accept a pending booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
        gig: mockGig,
      });
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'accepted',
      });

      const result = await service.updateStatus('booking-1', 'provider-1', 'accepted');

      expect(result.status).toBe('accepted');
      expect(notifQueue.add).toHaveBeenCalledWith('booking-status-changed', expect.objectContaining({
        status: 'accepted',
      }));
    });

    it('should reject invalid status transitions', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'completed',
        gig: mockGig,
      });

      await expect(
        service.updateStatus('booking-1', 'provider-1', 'accepted'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if neither provider nor client', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
        gig: mockGig,
      });

      await expect(
        service.updateStatus('booking-1', 'stranger-1', 'accepted'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if client tries to accept', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
        gig: mockGig,
      });

      await expect(
        service.updateStatus('booking-1', 'client-1', 'accepted'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('fake-id', 'provider-1', 'accepted'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('should allow client to cancel a pending booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
        gig: mockGig,
      });
      prisma.booking.update.mockResolvedValue({
        ...mockBooking,
        status: 'cancelled',
        cancelReason: 'Changed my mind',
        cancelledBy: 'client-1',
      });

      const result = await service.cancel('booking-1', 'client-1', 'Changed my mind');

      expect(result.status).toBe('cancelled');
      expect(prisma.booking.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          cancelReason: 'Changed my mind',
          cancelledBy: 'client-1',
        }),
      }));
    });

    it('should reject cancellation of in_progress booking', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'in_progress',
        gig: mockGig,
      });

      await expect(
        service.cancel('booking-1', 'client-1', 'Too late'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if unrelated user cancels', async () => {
      prisma.booking.findUnique.mockResolvedValue({
        ...mockBooking,
        status: 'pending',
        gig: mockGig,
      });

      await expect(
        service.cancel('booking-1', 'stranger-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findForUser', () => {
    it('should return paginated bookings for a user', async () => {
      prisma.booking.findMany.mockResolvedValue([mockBooking]);
      prisma.booking.count.mockResolvedValue(1);

      const result = await service.findForUser('client-1', 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.perPage).toBe(10);
    });
  });
});
