import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { OcrService } from '../ocr/ocr.service.js';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private ocrService: OcrService
  ) {}

  async createBatch(assessmentId: string, userId: string, files: Express.Multer.File[]) {
    const batch = await this.prisma.scanBatch.create({
      data: {
        assessment_id: assessmentId,
        created_by: userId,
        total_files: files.length,
        status: 'PROCESSING',
      },
    });

    const paperPromises = files.map(file => {
      return this.prisma.scannedPaper.create({
        data: {
          batch_id: batch.id,
          file_url: `/uploads/${file.filename}`,
          status: 'PENDING',
        }
      });
    });

    await Promise.all(paperPromises);

    // Trigger AI processing in the background asynchronously
    this.ocrService.processBatch(batch.id).catch(console.error);

    return batch;
  }

  async getBatchStatus(batchId: string) {
    const batch = await this.prisma.scanBatch.findUnique({
      where: { id: batchId },
      include: { ScannedPapers: true }
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      id: batch.id,
      total_files: batch.total_files,
      processed_files: batch.processed_files,
      status: batch.status,
      created_at: batch.created_at,
    };
  }

  async getBatches() {
    return this.prisma.scanBatch.findMany({
      include: { Assessment: true },
      orderBy: { created_at: 'desc' }
    });
  }
}
