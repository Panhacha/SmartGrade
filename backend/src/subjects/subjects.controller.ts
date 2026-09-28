import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(@Body() body: any) {
    return this.subjectsService.create(body);
  }

  @Get()
  findAll() {
    return this.subjectsService.findAll();
  }
}
