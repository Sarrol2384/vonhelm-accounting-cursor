import { Module } from '@nestjs/common';
import { OwnerController } from './owner.controller';
import { OwnerService } from './owner.service';
import { AbPipelineService } from './ab-pipeline.service';

@Module({
  controllers: [OwnerController],
  providers: [OwnerService, AbPipelineService],
  exports: [AbPipelineService],
})
export class OwnerModule {}
