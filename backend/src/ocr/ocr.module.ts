import { Module } from '@nestjs/common';
import { OcrService } from './ocr.service.js';
import { MatchingService } from './matching/matching.service.js';

@Module({
  providers: [OcrService, MatchingService],
  exports: [OcrService],
})
export class OcrModule {}
