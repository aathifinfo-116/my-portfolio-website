import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto } from './dto/login.dto';

interface AuthedRequest extends Request {
  user: { id: string; email: string; displayName: string };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** Rate-limited harder than the rest of the API: 5 attempts per minute. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /** Lets the dashboard verify a stored token is still good on page load. */
  @Get('me')
  me(@Req() req: AuthedRequest) {
    return req.user;
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  changePassword(@Req() req: AuthedRequest, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }
}
