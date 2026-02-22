import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

describe('AuthService — OTP flow', () => {
  let service: AuthService;
  let cache: Record<string, jest.Mock>;
  let prisma: Record<string, any>;

  const mockUser = {
    id: 'user-1',
    phone: '+212600000000',
    role: 'client',
    email: null,
    profile: { name: '+212600000000' },
  };

  beforeEach(async () => {
    cache = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    prisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheService, useValue: cache },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestOtp', () => {
    it('should store OTP in cache and return success message', async () => {
      const result = await service.requestOtp('+212600000000');

      expect(result.message).toBeDefined();
      expect(cache.set).toHaveBeenCalledTimes(2); // OTP + cooldown
      // First call: otp key with code and attempts
      expect(cache.set).toHaveBeenCalledWith(
        'otp:+212600000000',
        expect.objectContaining({ code: expect.any(String), attempts: 0 }),
        300,
      );
      // Second call: cooldown key
      expect(cache.set).toHaveBeenCalledWith(
        'otp:cooldown:+212600000000',
        true,
        60,
      );
    });

    it('should generate a 6-digit code', async () => {
      await service.requestOtp('+212600000000');

      const otpCall = cache.set.mock.calls[0];
      const code = otpCall[1].code;
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should reject if cooldown is active', async () => {
      cache.get.mockResolvedValueOnce(true); // cooldown active

      await expect(service.requestOtp('+212600000000')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyOtp', () => {
    it('should accept a valid code and return user + token', async () => {
      cache.get.mockResolvedValueOnce({ code: '456789', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.verifyOtp('+212600000000', '456789');

      expect(result.token).toBe('mock-token');
      expect(result.user.phone).toBe('+212600000000');
      expect(cache.del).toHaveBeenCalledWith('otp:+212600000000');
    });

    it('should reject an expired/missing code', async () => {
      cache.get.mockResolvedValueOnce(null); // no OTP stored

      await expect(
        service.verifyOtp('+212600000000', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject an invalid code and increment attempts', async () => {
      cache.get.mockResolvedValueOnce({ code: '456789', attempts: 0 });

      await expect(
        service.verifyOtp('+212600000000', '000000'),
      ).rejects.toThrow(UnauthorizedException);

      // Should increment attempts
      expect(cache.set).toHaveBeenCalledWith(
        'otp:+212600000000',
        { code: '456789', attempts: 1 },
        300,
      );
    });

    it('should reject after max attempts and delete the OTP', async () => {
      cache.get.mockResolvedValueOnce({ code: '456789', attempts: 5 });

      await expect(
        service.verifyOtp('+212600000000', '456789'),
      ).rejects.toThrow(UnauthorizedException);

      expect(cache.del).toHaveBeenCalledWith('otp:+212600000000');
    });

    it('should create a new user if phone not found', async () => {
      cache.get.mockResolvedValueOnce({ code: '456789', attempts: 0 });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.verifyOtp('+212600000000', '456789');

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.token).toBe('mock-token');
    });

    it('should no longer accept hardcoded 123456', async () => {
      // With no OTP stored, even 123456 should fail
      cache.get.mockResolvedValueOnce(null);

      await expect(
        service.verifyOtp('+212600000000', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
