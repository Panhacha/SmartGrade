import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StudentsService } from './students.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findAll() {
    return this.studentsService.findAll();
  }

  @Get('lookup/:student_id')
  async lookup(@Param('student_id') studentId: string) {
    const student = await this.studentsService.findByCode(studentId);
    if (!student) {
      return { found: false };
    }
    return {
      found: true,
      student: {
        student_id: student.student_code,
        full_name: student.name,
        class_name: student.class_name,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`
      }
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.studentsService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.studentsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  // Import Endpoints
  @Post('import-file')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.studentsService.parseImportFile(file.buffer);
  }

  @Post('import-google-sheet')
  async importGoogleSheet(@Body('sheet_url') sheetUrl: string) {
    if (!sheetUrl) throw new BadRequestException('Sheet URL is required');
    return this.studentsService.parseGoogleSheet(sheetUrl);
  }

  @Post('confirm-import')
  async confirmImport(@Body() body: { mapped_data: any[]; class_name?: string }) {
    if (!body.mapped_data || !Array.isArray(body.mapped_data)) {
      throw new BadRequestException('Invalid mapped data');
    }
    return this.studentsService.bulkUpsertStudents(body.mapped_data, body.class_name);
  }
}
