import { Controller, Get, Query, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('reports')
@Auth()
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('catalog')
  catalog() {
    return this.service.catalog();
  }

  @Get('generate')
  async generate(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Query('reportId') reportId: string,
    @Query('format') format: 'json' | 'pdf' | 'xlsx' = 'json',
    @Res() res: Response,
  ) {
    const result = await this.service.generate(user.id, companyId, reportId, format);
    if (format === 'pdf' && Buffer.isBuffer(result)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}.pdf"`);
      return res.send(result);
    }
    if (format === 'xlsx' && Buffer.isBuffer(result)) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${reportId}.xlsx"`);
      return res.send(result);
    }
    return res.json(result);
  }
}
