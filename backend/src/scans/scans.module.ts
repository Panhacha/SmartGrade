import { Module } from '@nestjs/common';
import { ScansService } from './scans.service.js';
import { ScansController } from './scans.controller.js';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OcrModule } from '../ocr/ocr.module.js';

@Module({
  imports: [
    OcrModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
        }
      })
    })
  ],
  controllers: [ScansController],
  providers: [ScansService],
})
export class ScansModule {}
