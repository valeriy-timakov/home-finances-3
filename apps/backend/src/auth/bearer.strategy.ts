import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BearerStrategy extends PassportStrategy(Strategy, 'bearer') {
  private readonly redis: Redis;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    super();
    this.redis = new Redis(this.configService.get<string>('REDIS_URL')!,
      {
        password: this.configService.get<string>('REDIS_PASSWORD'),
      });
  }

  async validate(token: string): Promise<any> {
    const sessionJson = await this.redis.get(token);
    if (!sessionJson) {
      throw new UnauthorizedException('Invalid session token');
    }

    const sessionData = JSON.parse(sessionJson);
    const userIdString = sessionData.userId;

    if (!userIdString) {
      throw new UnauthorizedException('Session data is invalid');
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('User ID in session is not a valid number');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Припускаємо, що поле `agentId` існує в моделі User
    // Якщо поле називається інакше, потрібно буде це виправити
    return { id: user.id, agentId: user.id }; // Повертаємо об'єкт, який буде доступний як req.user
  }
}
