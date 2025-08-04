import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name); // ✅ Logger

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req) {
    this.logger.log('🔍 /auth/me called with user:', req.user); // ✅ Log user from token

    return {
      message: 'Authenticated user info',
      user: {
        id: req.user.userId || req.user.sub,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}
