import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const totalStudents = await this.prisma.student.count();
    const totalAssessments = await this.prisma.assessment.count();
    
    const grades = await this.prisma.grade.findMany({
      include: { Assessment: true }
    });
    const pendingScans = await this.prisma.recognizedResult.count({
      where: { status: { in: ['PENDING', 'NEEDS_REVIEW', 'CONFIDENT'] } }
    });

    const totalGraded = grades.length;
    let passedCount = 0;
    let failedCount = 0;
    let sumPercentage = 0;
    let highest = 0;
    let lowest = 100;

    const classPerformanceMap: Record<string, { pass: number, fail: number }> = {};

    grades.forEach(g => {
      const isPassed = g.percentage >= g.Assessment.passing_score;
      if (isPassed) passedCount++; else failedCount++;
      sumPercentage += g.percentage;
      if (g.percentage > highest) highest = g.percentage;
      if (g.percentage < lowest) lowest = g.percentage;

      const className = g.Assessment.class_name;
      if (!classPerformanceMap[className]) {
        classPerformanceMap[className] = { pass: 0, fail: 0 };
      }
      if (isPassed) classPerformanceMap[className].pass++;
      else classPerformanceMap[className].fail++;
    });

    const avgPercentage = totalGraded > 0 ? (sumPercentage / totalGraded) : 0;
    if (totalGraded === 0) lowest = 0;

    const classPerformance = Object.keys(classPerformanceMap).map(cls => ({
      name: cls,
      Passed: classPerformanceMap[cls].pass,
      Failed: classPerformanceMap[cls].fail,
    }));

    const recentActivity = await this.prisma.verificationLog.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        Grade: {
          include: { Student: true, Assessment: true }
        }
      }
    });

    return {
      stats: {
        totalStudents,
        totalAssessments,
        pendingReview: pendingScans,
        totalGraded,
        avgPercentage: avgPercentage.toFixed(1),
        highestPercentage: highest.toFixed(1),
        lowestPercentage: lowest.toFixed(1),
      },
      charts: {
        passFail: [
          { name: 'Passed', value: passedCount, color: '#10b981' },
          { name: 'Failed', value: failedCount, color: '#ef4444' }
        ],
        classPerformance
      },
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        action: a.action,
        student: a.Grade.Student.name,
        assessment: a.Grade.Assessment.name,
        date: a.created_at
      }))
    };
  }

  async getNotifications() {
    const pendingScans = await this.prisma.recognizedResult.count({
      where: { status: { in: ['PENDING', 'NEEDS_REVIEW', 'CONFIDENT'] } }
    });

    const failedBatches = await this.prisma.scanBatch.count({
      where: { status: 'FAILED' }
    });

    const processingBatches = await this.prisma.scanBatch.count({
      where: { status: 'PROCESSING' }
    });

    const notifications = [];
    if (pendingScans > 0) {
      notifications.push({ id: 1, title: 'Review Required', message: `${pendingScans} papers are waiting for your verification.`, type: 'warning', time: new Date() });
    }
    if (processingBatches > 0) {
      notifications.push({ id: 2, title: 'Processing Scans', message: `${processingBatches} batch(es) currently being processed by AI.`, type: 'info', time: new Date() });
    }
    if (failedBatches > 0) {
      notifications.push({ id: 3, title: 'Error Detected', message: `${failedBatches} batch(es) failed to process.`, type: 'error', time: new Date() });
    }
    
    return notifications;
  }
}
