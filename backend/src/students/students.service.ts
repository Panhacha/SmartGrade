import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import * as xlsx from 'xlsx';
import axios from 'axios';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.student.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.student.findUnique({ where: { id } });
  }

  findByCode(student_code: string) {
    return this.prisma.student.findUnique({ where: { student_code } });
  }

  create(data: any) {
    return this.prisma.student.create({ data });
  }

  update(id: string, data: any) {
    return this.prisma.student.update({ where: { id }, data });
  }

  async remove(id: string) {
    try {
      return await this.prisma.student.delete({ where: { id } });
    } catch (e: any) {
      if (e.code === 'P2003') {
        throw new BadRequestException('Cannot delete student. They may have existing grades or scans.');
      }
      throw e;
    }
  }

  private extractDataFromWorksheet(worksheet: xlsx.WorkSheet) {
    const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rows.length === 0) {
      throw new BadRequestException('The uploaded file or sheet is empty.');
    }

    let headerRowIndex = 0;
    let headers: string[] = [];
    
    // Scan up to first 10 rows to find the true header row (looks for ID/Name keywords)
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i];
      if (!row) continue;
      const rowString = row.join(' ').toLowerCase().replace(/\s+/g, '');
      if ((rowString.includes('អត្តលេខ') || rowString.includes('id') || rowString.includes('code')) &&
          (rowString.includes('ឈ្មោះ') || rowString.includes('name'))) {
        headerRowIndex = i;
        // Generate valid header names, ensuring no duplicates or empty strings
        headers = row.map((col, idx) => col ? String(col).trim() : `__EMPTY_${idx}`);
        break;
      }
    }

    if (headers.length === 0) {
       // fallback to row 0 if no clear header row found
       headers = (rows[0] || []).map((col, idx) => col ? String(col).trim() : `__EMPTY_${idx}`);
    }

    const rawData = [];
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
      const rowArray = rows[i];
      // Skip completely empty rows
      if (!rowArray || rowArray.length === 0 || rowArray.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }
      
      const rowObj: any = {};
      headers.forEach((h, index) => {
        rowObj[h] = rowArray[index];
      });
      rawData.push(rowObj);
    }

    return { headers, rawData };
  }

  async parseImportFile(buffer: Buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      return this.extractDataFromWorksheet(worksheet);
    } catch (e) {
      throw new BadRequestException('Failed to parse Excel/CSV file.');
    }
  }

  async parseGoogleSheet(sheetUrl: string) {
    try {
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) throw new BadRequestException('Invalid Google Sheets URL');
      const sheetId = match[1];

      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await axios.get(exportUrl, { responseType: 'arraybuffer' });
      const workbook = xlsx.read(response.data, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      return this.extractDataFromWorksheet(worksheet);
    } catch (e) {
      throw new BadRequestException('Failed to fetch Google Sheet. Make sure it is set to "Anyone with link can view".');
    }
  }

  async bulkUpsertStudents(mappedData: any[], fallbackClassName?: string) {
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const row of mappedData) {
      if (!row.student_id || !row.full_name) {
        failed++;
        errors.push(`Missing student_id or full_name for row: ${JSON.stringify(row)}`);
        continue;
      }

      const class_name = row.class_name || fallbackClassName || 'Unassigned';

      try {
        const existing = await this.prisma.student.findUnique({
          where: { student_code: String(row.student_id) }
        });

        if (existing) {
          await this.prisma.student.update({
            where: { student_code: String(row.student_id) },
            data: {
              name: String(row.full_name),
              khmer_name: row.khmer_name ? String(row.khmer_name) : null,
              gender: row.gender ? String(row.gender) : null,
              class_name: class_name,
              academic_year: row.academic_year ? String(row.academic_year) : null,
              email: row.email ? String(row.email) : null,
              phone: row.phone ? String(row.phone) : null,
              import_source: row.import_source || 'EXCEL'
            }
          });
          updated++;
        } else {
          await this.prisma.student.create({
            data: {
              student_code: String(row.student_id),
              name: String(row.full_name),
              khmer_name: row.khmer_name ? String(row.khmer_name) : null,
              gender: row.gender ? String(row.gender) : null,
              class_name: class_name,
              academic_year: row.academic_year ? String(row.academic_year) : null,
              email: row.email ? String(row.email) : null,
              phone: row.phone ? String(row.phone) : null,
              import_source: row.import_source || 'EXCEL'
            }
          });
          inserted++;
        }
      } catch (e: any) {
        failed++;
        errors.push(`Failed to save student ${row.student_id}: ${e.message}`);
      }
    }

    return {
      success: true,
      stats: { inserted, updated, failed },
      errors
    };
  }
}
