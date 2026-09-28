import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { GradesService } from './grades.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { Response } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('export')
  async exportGrades(@Res() res: Response) {
    const buffer = await this.gradesService.exportGrades();
    res.setHeader('Content-Disposition', 'attachment; filename=grades_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  }

  @Get()
  findAll() {
    return this.gradesService.findAll();
  }
}
