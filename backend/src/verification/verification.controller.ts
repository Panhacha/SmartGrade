import { Controller, Post, Get, Param, Body, UseGuards, Request, Delete } from '@nestjs/common';
import { VerificationService } from './verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('pending')
  getPending() {
    return this.verificationService.getPendingVerifications();
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() body: { finalScore?: number, finalStudentCode?: string },
    @Request() req: any
  ) {
    return this.verificationService.approveResult(id, req.user.userId, body.finalScore, body.finalStudentCode);
  }

  @Delete(':id')
  reject(@Param('id') id: string) {
    return this.verificationService.rejectResult(id);
  }
}
