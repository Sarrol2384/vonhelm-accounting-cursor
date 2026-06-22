import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private client: SupabaseClient | null = null;

  private getClient(): SupabaseClient {
    if (this.client) return this.client;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new BadRequestException('Supabase Storage is not configured');
    }
    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.client;
  }

  isEnabled() {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  async uploadFile(
    companyId: string,
    folder: string,
    filename: string,
    buffer: Buffer,
    contentType: string,
  ) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'accounting-files';
    const path = `${companyId}/${folder}/${Date.now()}-${filename}`;
    const client = this.getClient();

    const { error } = await client.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: false,
    });
    if (error) throw new BadRequestException(error.message);

    const { data: signed } = await client.storage
      .from(bucket)
      .createSignedUrl(path, 3600);

    return { path, bucket, signedUrl: signed?.signedUrl ?? null };
  }

  async listFiles(companyId: string, folder: string) {
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'accounting-files';
    const client = this.getClient();
    const { data, error } = await client.storage.from(bucket).list(`${companyId}/${folder}`);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }
}
