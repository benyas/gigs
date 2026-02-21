import { Module } from '@nestjs/common';
import { PushController } from './push.controller';
import { PushService } from '../common/push.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PushController],
  providers: [PushService],
})
export class PushModule {}
