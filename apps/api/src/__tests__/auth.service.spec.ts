import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: Record<string, any>;
  let jwt: JwtService;

  beforeEach(async () => {
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
        {
          provide: CacheService,
          useValue: {
            get: jest.fn().mockResolvedValue(null),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwt = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    const registerData = {
      email: 'test@gigs.ma',
      password: 'Password123!',
      name: 'Test User',
      phone: '+212600000000',
      role: 'client' as const,
    };

    it('should register a new user and return token', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: registerData.email,
        phone: registerData.phone,
        role: 'client',
        profile: { name: registerData.name },
      });

      const result = await service.register(registerData);

      expect(result.user.email).toBe(registerData.email);
      expect(result.user.phone).toBe(registerData.phone);
      expect(result.user.role).toBe('client');
      expect(result.token).toBe('mock-jwt-token');
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: registerData.email,
            phone: registerData.phone,
          }),
        }),
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should hash the password before storing', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'uuid-1',
        email: registerData.email,
        phone: registerData.phone,
        role: 'client',
        profile: { name: registerData.name },
      });

      await service.register(registerData);

      const createCall = prisma.user.create.mock.calls[0][0];
      const storedHash = createCall.data.passwordHash;
      expect(storedHash).not.toBe(registerData.password);
      expect(await bcrypt.compare(registerData.password, storedHash)).toBe(true);
    });
  });

  describe('login', () => {
    it('should return user and token for valid credentials', async () => {
      const hash = await bcrypt.hash('Password123!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@gigs.ma',
        phone: '+212600000000',
        role: 'client',
        passwordHash: hash,
        profile: { name: 'Test' },
      });

      const result = await service.login('test@gigs.ma', 'Password123!');

      expect(result.user.email).toBe('test@gigs.ma');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('Password123!', 12);
      prisma.user.findUnique.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@gigs.ma',
        passwordHash: hash,
      });

      await expect(service.login('test@gigs.ma', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nobody@gigs.ma', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signAccessToken / signRefreshToken', () => {
    it('should call jwt.sign with 15m expiry for access tokens', () => {
      service.signAccessToken('user-1', 'client');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user-1', role: 'client' },
        { expiresIn: '15m' },
      );
    });

    it('should call jwt.sign with 30d expiry for refresh tokens', () => {
      service.signRefreshToken('user-1');
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: 'user-1', type: 'refresh' },
        { expiresIn: '30d' },
      );
    });
  });
});
