import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { StudentsModule } from './students/students.module.js';
import { SubjectsModule } from './subjects/subjects.module.js';
import { AssessmentsModule } from './assessments/assessments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ScansModule } from './scans/scans.module.js';
import { OcrModule } from './ocr/ocr.module.js';
import { VerificationModule } from './verification/verification.module.js';
import { GradesModule } from './grades/grades.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [AuthModule, StudentsModule, SubjectsModule, AssessmentsModule, PrismaModule, ScansModule, OcrModule, VerificationModule, GradesModule, ReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
