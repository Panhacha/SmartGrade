import { Controller, Post, Get, Param, UseInterceptors, UploadedFiles, Body, UseGuards, Request } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ScansService } from './scans.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scansService: ScansService) {}

  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 100))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('assessment_id') assessmentId: string,
    @Request() req: any
  ) {
    const userId = req.user.userId;
    return this.scansService.createBatch(assessmentId, userId, files);
  }

  @Get(':id/status')
  getBatchStatus(@Param('id') id: string) {
    return this.scansService.getBatchStatus(id);
  }

  @Get()
  getBatches() {
    return this.scansService.getBatches();
  }
}
