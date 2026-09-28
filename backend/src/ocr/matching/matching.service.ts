import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService) {}

  async fuzzyMatchStudent(detectedCode: string | null): Promise<string | null> {
    if (!detectedCode) return null;
    
    // Exact or simple substring match for simulation
    const student = await this.prisma.student.findFirst({
      where: {
        student_code: {
          contains: detectedCode,
          mode: 'insensitive'
        }
      }
    });

    return student ? student.id : null;
  }
}
