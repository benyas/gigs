import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
} from '@gigs/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema))
    body: { email: string; password: string; name: string; phone: string; role: 'client' | 'provider' },
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema))
    body: { email: string; password: string },
  ) {
    return this.authService.login(body.email, body.password);
  }

  @Post('otp/request')
  requestOtp(
    @Body(new ZodValidationPipe(otpRequestSchema))
    body: { phone: string },
  ) {
    return this.authService.requestOtp(body.phone);
  }

  @Post('otp/verify')
  verifyOtp(
    @Body(new ZodValidationPipe(otpVerifySchema))
    body: { phone: string; code: string },
  ) {
    return this.authService.verifyOtp(body.phone, body.code);
  }
}
