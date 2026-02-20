import { Module } from '@nestjs/common';
import { GigsController } from './gigs.controller';
import { GigsService } from './gigs.service';
import { BullmqModule } from '../bullmq/bullmq.module';

@Module({
  imports: [BullmqModule],
  controllers: [GigsController],
  providers: [GigsService],
})
export class GigsModule {}
