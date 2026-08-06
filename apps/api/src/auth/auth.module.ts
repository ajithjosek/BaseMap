import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SsoService } from './sso.service';
import { AuthController } from './auth.controller';
import { SsoController } from './sso.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secretKey',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy, SsoService],
  controllers: [AuthController, SsoController],
  exports: [AuthService, SsoService],
})
export class AuthModule {}
