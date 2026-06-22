/**

 * Parse bank CSV exports into rows for POST /banking/accounts/:id/import

 * Supports common SA bank CSV exports and generic date/amount column layouts.

 */

export interface BankCsvRow {

  date: string;

  payee: string;

  description: string;

  reference: string;

  spent: string;

  received: string;

}



function normalizeHeader(h: string): string {

  return h.trim().toLowerCase().replace(/\s+/g, '_');

}



const DATE_KEYS = ['date', 'transaction_date', 'posting_date', 'value_date'];

const PAYEE_KEYS = ['payee', 'beneficiary', 'name', 'counterparty'];

const DESC_KEYS = ['description', 'narrative', 'details', 'memo'];

const REF_KEYS = ['reference', 'ref', 'reference_number'];

const SPENT_KEYS = ['spent', 'debit', 'amount_out', 'withdrawal', 'payment'];

const RECEIVED_KEYS = ['received', 'credit', 'amount_in', 'deposit'];



function pick(row: Record<string, string>, keys: string[]): string {

  for (const k of keys) {

    if (row[k] != null && row[k] !== '') return row[k];

  }

  return '';

}



function parseAmount(raw: string): string {

  if (!raw) return '';

  const cleaned = raw.replace(/[R\s]/g, '').replace(/\((.+)\)/, '-$1');

  // SA banks sometimes use comma as decimal separator in quoted fields

  const normalized = /,\d{2}$/.test(cleaned) && !cleaned.includes('.')

    ? cleaned.replace(',', '.')

    : cleaned.replace(/,/g, '');

  const n = parseFloat(normalized);

  return Number.isFinite(n) ? String(Math.abs(n)) : '';

}



function parseSignedAmount(raw: string): number | null {

  if (!raw) return null;

  const cleaned = raw.replace(/[R\s]/g, '').replace(/\((.+)\)/, '-$1');

  const normalized = /,\d{2}$/.test(cleaned) && !cleaned.includes('.')

    ? cleaned.replace(',', '.')

    : cleaned.replace(/,/g, '');

  const n = parseFloat(normalized);

  return Number.isFinite(n) ? n : null;

}



/** Split a CSV line respecting double-quoted fields (Nedbank descriptions contain commas). */

function parseCsvLine(line: string, delimiter: string): string[] {

  const fields: string[] = [];

  let current = '';

  let inQuotes = false;



  for (let i = 0; i < line.length; i++) {

    const ch = line[i];

    if (ch === '"') {

      if (inQuotes && line[i + 1] === '"') {

        current += '"';

        i++;

      } else {

        inQuotes = !inQuotes;

      }

    } else if (ch === delimiter && !inQuotes) {

      fields.push(current.trim());

      current = '';

    } else {

      current += ch;

    }

  }

  fields.push(current.trim());

  return fields.map((f) => f.replace(/^"|"$/g, '').replace(/""/g, '"'));

}



/** Parse SA bank CSV dates (YYYYMMDD, DD/MM/YYYY) and ISO into YYYY-MM-DD for the API. */

export function parseTransactionDate(raw: string): string | null {

  const trimmed = raw.trim();

  if (!trimmed) return null;



  // Nedbank TransactionHistory: 20260523

  if (/^\d{8}$/.test(trimmed)) {

    const y = parseInt(trimmed.slice(0, 4), 10);

    const m = parseInt(trimmed.slice(4, 6), 10);

    const d = parseInt(trimmed.slice(6, 8), 10);

    const dt = new Date(Date.UTC(y, m - 1, d));

    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {

      return dt.toISOString().slice(0, 10);

    }

    return null;

  }



  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {

    const iso = trimmed.slice(0, 10);

    const [y, m, d] = iso.split('-').map(Number);

    const dt = new Date(Date.UTC(y, m - 1, d));

    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) {

      return iso;

    }

    return null;

  }



  const dmY = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);

  if (dmY) {

    const day = parseInt(dmY[1], 10);

    const month = parseInt(dmY[2], 10);

    let year = parseInt(dmY[3], 10);

    if (year < 100) year += year >= 70 ? 1900 : 2000;

    const dt = new Date(Date.UTC(year, month - 1, day));

    if (dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day) {

      return dt.toISOString().slice(0, 10);

    }

    return null;

  }



  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {

    return parsed.toISOString().slice(0, 10);

  }



  return null;

}



export function parseBankCsv(text: string): BankCsvRow[] {

  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) return [];



  const delimiter = lines[0].includes(';') ? ';' : ',';

  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);

  const rows: BankCsvRow[] = [];



  for (let i = 1; i < lines.length; i++) {

    const cols = parseCsvLine(lines[i], delimiter);

    if (cols.every((c) => !c.trim())) continue;



    const raw: Record<string, string> = {};

    headers.forEach((h, idx) => {

      raw[h] = (cols[idx] ?? '').trim();

    });



    let spent = pick(raw, SPENT_KEYS);

    let received = pick(raw, RECEIVED_KEYS);



    // Single signed Amount column (Nedbank, FNB)

    if (!spent && !received && raw.amount) {

      const amt = parseSignedAmount(raw.amount);

      if (amt != null) {

        if (amt < 0) spent = String(Math.abs(amt));

        else if (amt > 0) received = String(amt);

      }

    }



    spent = parseAmount(spent);

    received = parseAmount(received);



    const dateRaw = pick(raw, DATE_KEYS);

    if (!dateRaw) continue;

    const parsedDate = parseTransactionDate(dateRaw);

    if (!parsedDate) continue;

    if (!spent && !received) continue;



    const description = pick(raw, DESC_KEYS) || pick(raw, PAYEE_KEYS);

    rows.push({

      date: parsedDate,

      payee: pick(raw, PAYEE_KEYS) || description,

      description,

      reference: pick(raw, REF_KEYS),

      spent,

      received,

    });

  }



  return rows;

}


