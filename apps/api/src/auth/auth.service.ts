import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import type { UserRole } from '@prisma/client';

const OTP_TTL = 300; // 5 minutes
const OTP_COOLDOWN = 60; // 1 minute between requests
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private cache: CacheService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'client' | 'provider';
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existing) {
      throw new ConflictException('User with this email or phone already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role as UserRole,
        profile: {
          create: {
            name: data.name,
          },
        },
      },
      include: { profile: true },
    });

    const token = this.signToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.signToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  async requestOtp(phone: string) {
    // Check cooldown
    const cooldownKey = `otp:cooldown:${phone}`;
    const cooldown = await this.cache.get<boolean>(cooldownKey);
    if (cooldown) {
      throw new BadRequestException('Please wait before requesting another OTP');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with TTL
    const otpKey = `otp:${phone}`;
    await this.cache.set(otpKey, { code, attempts: 0 }, OTP_TTL);

    // Set cooldown
    await this.cache.set(cooldownKey, true, OTP_COOLDOWN);

    // In development, log the code for testing
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] OTP for ${phone}: ${code}`);
    }

    // TODO: Send SMS via provider (Twilio, Morocco SMS gateway, etc.)
    // await this.smsService.send(phone, `Votre code Gigs.ma: ${code}`);

    return { message: 'Code de vérification envoyé' };
  }

  async verifyOtp(phone: string, code: string) {
    const otpKey = `otp:${phone}`;
    const stored = await this.cache.get<{ code: string; attempts: number }>(otpKey);

    if (!stored) {
      throw new UnauthorizedException('Code expiré ou invalide');
    }

    if (stored.attempts >= OTP_MAX_ATTEMPTS) {
      await this.cache.del(otpKey);
      throw new UnauthorizedException('Trop de tentatives. Veuillez demander un nouveau code');
    }

    if (stored.code !== code) {
      // Increment attempts
      await this.cache.set(otpKey, { code: stored.code, attempts: stored.attempts + 1 }, OTP_TTL);
      throw new UnauthorizedException('Code invalide');
    }

    // Code is valid — delete from Redis
    await this.cache.del(otpKey);

    let user = await this.prisma.user.findUnique({
      where: { phone },
      include: { profile: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone,
          role: 'client',
          profile: { create: { name: phone } },
        },
        include: { profile: true },
      });
    }

    const token = this.signToken(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: user.profile,
      },
      token,
    };
  }

  private signToken(userId: string, role: string): string {
    return this.jwt.sign({ sub: userId, role });
  }
}
