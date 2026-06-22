import { Controller, Get, Post, Headers, Param, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';
import { Auth, CurrentUser } from '../auth/auth.decorators';
import { User } from '@accounting/db';

@Controller('storage')
@Auth()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get('status')
  status() {
    return { enabled: this.storage.isEnabled() };
  }

  @Post('bank-statements/:accountId')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadBankStatement(
    @CurrentUser() user: User,
    @Headers('x-company-id') companyId: string,
    @Param('accountId') accountId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!this.storage.isEnabled()) {
      throw new BadRequestException('Supabase Storage not configured — set SUPABASE_SERVICE_ROLE_KEY');
    }
    const result = await this.storage.uploadFile(
      companyId,
      `bank-statements/${accountId}`,
      file.originalname,
      file.buffer,
      file.mimetype,
    );
    return { ...result, accountId, uploadedBy: user.id };
  }

  @Get('bank-statements/:accountId')
  listBankStatements(
    @Headers('x-company-id') companyId: string,
    @Param('accountId') accountId: string,
  ) {
    if (!this.storage.isEnabled()) return { files: [] };
    return this.storage.listFiles(companyId, `bank-statements/${accountId}`);
  }
}
