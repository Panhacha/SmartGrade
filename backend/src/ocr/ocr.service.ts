import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { MatchingService } from './matching/matching.service.js';
import * as path from 'path';
import * as process from 'process';
import * as os from 'os';
import Tesseract from 'tesseract.js';
import { Jimp } from 'jimp';

@Injectable()
export class OcrService {
  constructor(
    private prisma: PrismaService,
    private matchingService: MatchingService
  ) {}

  async processPaper(paperId: string) {
    const paper = await this.prisma.scannedPaper.findUnique({
      where: { id: paperId }
    });

    if (!paper) return;

    try {
      const filePath = path.join(process.cwd(), paper.file_url);
      
      const { data: { text } } = await Tesseract.recognize(
        filePath,
        'eng',
        { logger: m => console.log('OCR Progress:', m.status, Math.round(m.progress * 100) + '%') }
      );

      let detectedCode = 'UNKNOWN';
      const idMatch = text.match(/(DUC\s*\d{4}\s*-\s*\d{4})/i) || text.match(/ID[\s:]*([A-Z0-9-]+)/i);
      if (idMatch) {
         let rawCode = idMatch[1] ? idMatch[1] : idMatch[0];
         detectedCode = rawCode.replace(/\s+/g, '').toUpperCase();
      }

      let detectedScore = 0;
      let confidence = 0.5;
      
      // Isolate RED text to extract the score reliably
      try {
        const image = await Jimp.read(filePath);
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(this: any, x, y, idx) {
          const red   = this.bitmap.data[idx + 0];
          const green = this.bitmap.data[idx + 1];
          const blue  = this.bitmap.data[idx + 2];
          if (red > 150 && green < 150 && blue < 150) {
             this.bitmap.data[idx + 0] = 0;
             this.bitmap.data[idx + 1] = 0;
             this.bitmap.data[idx + 2] = 0;
          } else {
             this.bitmap.data[idx + 0] = 255;
             this.bitmap.data[idx + 1] = 255;
             this.bitmap.data[idx + 2] = 255;
          }
        });
        
        const tmpPath = path.join(os.tmpdir(), `score-${paperId}.png`);
        await image.write(tmpPath as `${string}.${string}`);
        
        const { data: scoreData } = await Tesseract.recognize(tmpPath, 'eng', { 
          tessedit_pageseg_mode: '11', 
          tessedit_char_whitelist: '0123456789' 
        } as any);
        
        const numbers = scoreData.text.match(/\d+/g);
        if (numbers && numbers.length > 0) {
           const validScores = numbers.map(n => parseInt(n, 10)).filter(n => n <= 100);
           if (validScores.length > 0) {
              detectedScore = validScores[validScores.length - 1];
              confidence = 0.95; // High confidence since it's from the red channel
           } else {
              detectedScore = parseInt(numbers[numbers.length - 1], 10);
           }
        }
      } catch (err) {
        console.error("Error isolating red score:", err);
      }

      const studentId = await this.matchingService.fuzzyMatchStudent(detectedCode);
      if (studentId) confidence += 0.1;

      await this.prisma.recognizedResult.create({
        data: {
          paper_id: paperId,
          detected_student_code: detectedCode,
          detected_score: detectedScore,
          confidence: Math.min(confidence, 0.99),
          raw_text: text,
          status: confidence >= 0.8 && studentId ? 'CONFIDENT' : 'NEEDS_REVIEW'
        }
      });

      await this.prisma.scannedPaper.update({
        where: { id: paperId },
        data: {
          status: 'PROCESSED',
          student_id: studentId,
        }
      });
    } catch (e) {
      console.error('OCR Error:', e);
      await this.prisma.scannedPaper.update({
        where: { id: paperId },
        data: { status: 'FAILED' }
      });
    }
  }

  async processBatch(batchId: string) {
    const batch = await this.prisma.scanBatch.findUnique({
      where: { id: batchId },
      include: { ScannedPapers: true }
    });

    if (!batch) return;

    for (const paper of batch.ScannedPapers) {
      await this.processPaper(paper.id);
      
      // Update batch processed count
      await this.prisma.scanBatch.update({
        where: { id: batchId },
        data: {
          processed_files: {
            increment: 1
          }
        }
      });
    }

    // Complete the batch
    await this.prisma.scanBatch.update({
      where: { id: batchId },
      data: { status: 'COMPLETED' }
    });
  }
}
