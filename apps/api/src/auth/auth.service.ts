import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
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
    // Placeholder: in production, integrate with SMS provider (Twilio, etc.)
    // For now, always return success
    return { message: 'OTP sent (placeholder — no SMS provider configured)' };
  }

  async verifyOtp(phone: string, code: string) {
    // Placeholder: in production, verify OTP from SMS provider
    // For dev, accept "123456" as valid code
    if (code !== '123456') {
      throw new UnauthorizedException('Invalid OTP code');
    }

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
