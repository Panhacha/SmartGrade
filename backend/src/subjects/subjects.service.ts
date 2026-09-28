import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  create(data: { name: string; code: string }) {
    return this.prisma.subject.create({
      data: {
        name: data.name,
        code: data.code,
      }
    });
  }

  findAll() {
    return this.prisma.subject.findMany();
  }
}
