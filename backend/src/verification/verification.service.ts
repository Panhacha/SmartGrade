import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class VerificationService {
  constructor(private prisma: PrismaService) {}

  async approveResult(resultId: string, userId: string, finalScore?: number, finalStudentCode?: string) {
    const result = await this.prisma.recognizedResult.findUnique({
      where: { id: resultId },
      include: { ScannedPaper: { include: { ScanBatch: { include: { Assessment: true } } } } }
    });

    if (!result) throw new NotFoundException('Result not found');

    const score = finalScore ?? result.detected_score;
    const studentCode = finalStudentCode ?? result.detected_student_code;

    if (score === null || !studentCode) {
      throw new BadRequestException('Score and Student Code must be provided for approval');
    }

    const assessment = result.ScannedPaper.ScanBatch.Assessment;
    if (score > assessment.max_score) {
      throw new BadRequestException(`Score cannot exceed maximum score of ${assessment.max_score}`);
    }

    const student = await this.prisma.student.findUnique({ where: { student_code: studentCode } });
    if (!student) throw new NotFoundException('Student not found');

    // Duplicate check: does the student already have a grade for this assessment?
    const existingGrade = await this.prisma.grade.findFirst({
      where: { student_id: student.id, assessment_id: assessment.id }
    });

    const percentage = (score / assessment.max_score) * 100;
    let grade;

    if (existingGrade) {
      // Override the existing grade
      grade = await this.prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          score: score,
          percentage: percentage,
          verified_by: userId,
          verified_at: new Date()
        }
      });
    } else {
      grade = await this.prisma.grade.create({
        data: {
          assessment_id: assessment.id,
          student_id: student.id,
          score: score,
          percentage: percentage,
          status: 'VERIFIED',
          verified_by: userId,
          verified_at: new Date()
        }
      });
    }

    await this.prisma.recognizedResult.update({
      where: { id: resultId },
      data: { status: 'APPROVED' }
    });
    
    await this.prisma.scannedPaper.update({
      where: { id: result.paper_id },
      data: { student_id: student.id }
    });

    await this.prisma.verificationLog.create({
      data: {
        grade_id: grade.id,
        old_score: result.detected_score,
        new_score: score,
        action: 'APPROVED',
        user_id: userId
      }
    });

    return grade;
  }

  async rejectResult(resultId: string) {
    return this.prisma.recognizedResult.update({
      where: { id: resultId },
      data: { status: 'REJECTED' }
    });
  }

  async getPendingVerifications() {
    const results = await this.prisma.recognizedResult.findMany({
      where: { status: { in: ['PENDING', 'NEEDS_REVIEW', 'CONFIDENT'] } },
      include: {
        ScannedPaper: { 
          include: { 
            Student: true,
            ScanBatch: { include: { Assessment: true } } 
          } 
        }
      }
    });

    // Compute dynamic validation warnings for each result
    return Promise.all(results.map(async (result) => {
      const warnings: string[] = [];
      const assessment = result.ScannedPaper.ScanBatch.Assessment;
      const student = result.ScannedPaper.Student;

      // 1. Low Confidence
      if ((result.confidence || 0) < 0.8) warnings.push('LOW_CONFIDENCE');
      
      // 2. Score Range Validation
      if (result.detected_score !== null && result.detected_score > assessment.max_score) {
        warnings.push('EXCEEDS_MAX_SCORE');
      }

      if (!student) {
        // 3. Invalid ID
        warnings.push('INVALID_ID');
      } else {
        // 4. Wrong Class Detection
        if (student.class_name !== assessment.class_name) {
          warnings.push('WRONG_CLASS');
        }

        // 5. Duplicate Detection (another paper by same student in same assessment)
        const duplicates = await this.prisma.scannedPaper.count({
          where: {
            student_id: student.id,
            ScanBatch: { assessment_id: assessment.id },
            id: { not: result.ScannedPaper.id }
          }
        });
        if (duplicates > 0) warnings.push('DUPLICATE_PAPER');
        
        // Check if already graded
        const graded = await this.prisma.grade.count({
          where: { student_id: student.id, assessment_id: assessment.id }
        });
        if (graded > 0) warnings.push('ALREADY_GRADED');
      }

      return {
        ...result,
        warnings
      };
    }));
  }
}
