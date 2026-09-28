import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.assessment.create({
      data: {
        name: data.name,
        subject_id: data.subject_id,
        class_name: data.class_name,
        max_score: data.max_score,
        passing_score: data.passing_score,
        exam_date: new Date(data.exam_date),
        created_by: data.created_by,
      }
    });
  }

  findAll() {
    return this.prisma.assessment.findMany({
      include: { Subject: true }
    });
  }

  findOne(id: string) {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: { Subject: true }
    });
  }
}
