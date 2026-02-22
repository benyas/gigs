import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
} from '@gigs/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

const REFRESH_COOKIE = 'gigs_refresh';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(registerSchema))
    body: { email: string; password: string; name: string; phone: string; role: 'client' | 'provider' },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(body);
    const refreshToken = this.authService.signRefreshToken(result.user.id);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(loginSchema))
    body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);
    const refreshToken = this.authService.signRefreshToken(result.user.id);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Post('otp/request')
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema))
    body: { phone: string },
  ) {
    return this.authService.requestOtp(body.phone);
  }

  @Post('otp/verify')
  async verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema))
    body: { phone: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(body.phone, body.code);
    const refreshToken = this.authService.signRefreshToken(result.user.id);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }
    const result = await this.authService.refreshFromToken(refreshToken);
    // Rotate refresh token
    const newRefreshToken = this.authService.signRefreshToken(result.user.id);
    res.cookie(REFRESH_COOKIE, newRefreshToken, COOKIE_OPTIONS);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
    return { message: 'Logged out' };
  }
}
