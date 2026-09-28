import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as ExcelJS from 'exceljs';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.grade.findMany({
      include: {
        Assessment: { include: { Subject: true } },
        Student: true,
      },
      orderBy: { verified_at: 'desc' }
    });
  }

  async exportGrades() {
    const grades = await this.findAll();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Grades');

    sheet.columns = [
      { header: 'Student Code', key: 'student_code', width: 15 },
      { header: 'Student Name', key: 'student_name', width: 25 },
      { header: 'Assessment', key: 'assessment', width: 25 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Percentage (%)', key: 'percentage', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Verified At', key: 'verified_at', width: 20 },
    ];

    grades.forEach(grade => {
      sheet.addRow({
        student_code: grade.Student?.student_code || 'N/A',
        student_name: grade.Student?.name || 'Unknown',
        assessment: grade.Assessment?.name || 'N/A',
        subject: grade.Assessment?.Subject?.name || 'N/A',
        score: grade.score || 0,
        percentage: grade.percentage ? grade.percentage.toFixed(2) : '0.00',
        status: grade.status || 'PENDING',
        verified_at: grade.verified_at ? new Date(grade.verified_at).toISOString().split('T')[0] : ''
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
