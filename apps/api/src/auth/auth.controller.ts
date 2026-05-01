import { Controller, Post, Body, UnauthorizedException, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: any, @Req() req: any) {
    const tenantId = req.headers['x-tenant-id'] || loginDto.tenantId;
    if (!tenantId) {
       throw new UnauthorizedException('Tenant ID is required');
    }

    let user;
    try {
      user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
        tenantId,
      );
    } catch (err: any) {
      if (err.status === 404) {
        throw new UnauthorizedException(err.response?.message || 'Invalid credentials');
      }
      throw err;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.authService.login(user);
  }

  @Post('refresh')
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }
}
