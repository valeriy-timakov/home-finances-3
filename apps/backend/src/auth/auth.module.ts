import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { BearerStrategy } from './bearer.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PassportModule, PrismaModule, ConfigModule],
  providers: [BearerStrategy],
})
export class AuthModule {}
