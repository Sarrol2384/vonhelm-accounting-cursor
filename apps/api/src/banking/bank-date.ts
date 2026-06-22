import { BadRequestException } from '@nestjs/common';

/** Parse bank CSV date strings — supports DD/MM/YYYY (SA banks) and ISO. */
export function parseBankTransactionDate(raw: string): Date {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new BadRequestException('Each row needs a date (DD/MM/YYYY or YYYY-MM-DD).');
  }

  if (/^\d{8}$/.test(trimmed)) {
    const y = parseInt(trimmed.slice(0, 4), 10);
    const m = parseInt(trimmed.slice(4, 6), 10);
    const d = parseInt(trimmed.slice(6, 8), 10);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {
      return dt;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const iso = trimmed.slice(0, 10);
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {
      return dt;
    }
  }

  const dmY = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (dmY) {
    const day = parseInt(dmY[1], 10);
    const month = parseInt(dmY[2], 10);
    let year = parseInt(dmY[3], 10);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day) {
      return dt;
    }
  }

  const fallback = new Date(trimmed);
  if (!Number.isNaN(fallback.getTime())) return fallback;

  throw new BadRequestException(
    `Could not read date "${raw}". Use DD/MM/YYYY (e.g. 15/06/2026) or YYYY-MM-DD.`,
  );
}
