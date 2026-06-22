const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Company {
  id: string;
  name: string;
  tradingName?: string | null;
  vatRegistrationNumber?: string | null;
  registrationNumber?: string | null;
  financialYearEndMonth?: number;
  financialYearEndDay?: number;
  nextVatSubmissionDue?: string | null;
  vatFrequencyMonths?: number;
  phone?: string | null;
  email?: string | null;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companies: Company[];
}

class ApiClient {
  private token: string | null = null;
  private companyId: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  setCompanyId(id: string | null) {
    this.companyId = id;
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('companyId', id);
      else localStorage.removeItem('companyId');
    }
  }

  getCompanyId() {
    if (this.companyId) return this.companyId;
    if (typeof window !== 'undefined') {
      this.companyId = localStorage.getItem('companyId');
    }
    return this.companyId;
  }

  async fetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const companyId = this.getCompanyId();
    if (companyId) headers['x-company-id'] = companyId;

    const res = await fetch(`${API_URL}/api${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Request failed');
    }
    return res.json();
  }

  login(email: string, password: string) {
    return this.fetch<{ token: string; user: User; authProvider?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  supabaseLogin(accessToken: string) {
    return this.fetch<{ token: string; user: User; authProvider?: string }>('/auth/supabase', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
  }

  authConfig() {
    return this.fetch<{ supabaseEnabled: boolean; supabaseUrl: string | null }>('/auth/config');
  }

  me() {
    return this.fetch<User>('/auth/me');
  }

  listConsole(search?: string, status?: string) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    return this.fetch<Array<Record<string, unknown>>>(`/companies/console?${params}`);
  }

  getCompany(id: string) {
    return this.fetch<Company>(`/companies/${id}`);
  }

  getKpis() {
    return this.fetch<Record<string, unknown>>('/dashboard/kpis');
  }

  search(q: string) {
    return this.fetch<Record<string, Array<{ type: string; id: string; label: string }>>>('/dashboard/search?q=' + encodeURIComponent(q));
  }

  listNotes() {
    return this.fetch<Array<Record<string, unknown>>>('/notes');
  }

  createNote(data: Record<string, unknown>) {
    return this.fetch('/notes', { method: 'POST', body: JSON.stringify(data) });
  }

  listTasks(filter?: string) {
    return this.fetch<Array<Record<string, unknown>>>(`/tasks${filter ? `?filter=${filter}` : ''}`);
  }

  createTask(data: Record<string, unknown>) {
    return this.fetch('/tasks', { method: 'POST', body: JSON.stringify(data) });
  }

  listBankAccounts() {
    return this.fetch<Array<Record<string, unknown>>>('/banking/accounts');
  }

  createBankAccount(data: Record<string, unknown>) {
    return this.fetch('/banking/accounts', { method: 'POST', body: JSON.stringify(data) });
  }

  importBankCsv(accountId: string, rows: Array<Record<string, string>>) {
    return this.fetch<{ imported: number; batchId: string }>(
      `/banking/accounts/${accountId}/import`,
      { method: 'POST', body: JSON.stringify({ rows }) },
    );
  }

  ownerHealth() {
    return this.fetch<{ status: string; companyId: string; companyName: string | null }>('/owner/health');
  }

  ownerToday() {
    return this.fetch<{
      queue: {
        status: 'needs_attention' | 'clear' | 'getting_started';
        message: string;
        pendingCount: number;
      };
      bankBalance: {
        amount: number | null;
        accountCount: number;
        transactionCount: number;
        unconfirmedCount: number;
        lastUpdated: string | null;
        confidence: 'low' | 'partial' | 'actual';
        typeLabel: 'Actual' | 'Partial';
        supportingText: string;
      };
      vat: {
        display: 'not_registered' | 'unknown' | 'estimate';
        amount: number | null;
        typeLabel: 'Estimated' | 'Unknown' | null;
        headline: string;
        supportingText: string;
        reason: string | null;
        periodLabel: string | null;
        lastCalculated: string | null;
        nextDue: string | null;
      };
      sortedCount: number;
      confirmedCount: number;
      handledCount: number;
      pendingApprovalCount: number;
      pendingActionsShown: number;
      pendingActions: Array<{
        id: string;
        question: string;
        choices: string[];
        createdAt: string;
        amount: number | null;
        txnDate: string | null;
        payee: string | null;
      }>;
      activity: Array<{
        id: string;
        type: string;
        label: string;
        amount: number;
        date: string;
        activityStatus: 'sorted' | 'confirmed' | null;
        description: string;
      }>;
    }>('/owner/today');
  }

  resolveOwnerAction(actionId: string, choice: string) {
    return this.fetch<{ ok: boolean; alreadyResolved?: boolean }>(
      `/owner/actions/${actionId}/resolve`,
      { method: 'POST', body: JSON.stringify({ choice }) },
    );
  }

  listBankTransactions(accountId: string, status?: string, limit?: number) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (limit) params.set('limit', String(limit));
    const qs = params.toString();
    return this.fetch<Array<Record<string, unknown>>>(
      `/banking/accounts/${accountId}/transactions${qs ? `?${qs}` : ''}`,
    );
  }

  createBankTransaction(accountId: string, data: Record<string, unknown>) {
    return this.fetch(`/banking/accounts/${accountId}/transactions`, { method: 'POST', body: JSON.stringify(data) });
  }

  markReviewed(ids: string[]) {
    return this.fetch('/banking/transactions/mark-reviewed', { method: 'POST', body: JSON.stringify({ ids }) });
  }

  markReconciled(ids: string[]) {
    return this.fetch('/banking/transactions/mark-reconciled', { method: 'POST', body: JSON.stringify({ ids }) });
  }

  listVatPeriods() {
    return this.fetch<Array<Record<string, unknown>>>('/vat/periods');
  }

  getVatSettings() {
    return this.fetch<Record<string, unknown>>('/vat/settings');
  }

  calculateVat(periodId: string) {
    return this.fetch(`/vat/periods/${periodId}/calculate`, { method: 'POST' });
  }

  closeVatPeriod(periodId: string) {
    return this.fetch(`/vat/periods/${periodId}/close`, { method: 'POST' });
  }

  listLedgerAccounts() {
    return this.fetch<Array<Record<string, unknown>>>('/ledger/accounts');
  }

  listJournals() {
    return this.fetch<Array<Record<string, unknown>>>('/ledger/journals');
  }

  trialBalance(asOf?: string) {
    return this.fetch<Record<string, unknown>>(`/ledger/trial-balance${asOf ? `?asOf=${asOf}` : ''}`);
  }

  listCustomers() {
    return this.fetch<Array<Record<string, unknown>>>('/sales/customers');
  }

  listSuppliers() {
    return this.fetch<Array<Record<string, unknown>>>('/sales/suppliers');
  }

  listItems() {
    return this.fetch<Array<Record<string, unknown>>>('/sales/items');
  }

  listInvoices() {
    return this.fetch<Array<Record<string, unknown>>>('/sales/invoices');
  }

  listBills() {
    return this.fetch<Array<Record<string, unknown>>>('/sales/bills');
  }

  reportsCatalog() {
    return this.fetch<Array<{ id: string; name: string; category: string }>>('/reports/catalog');
  }

  generateReport(reportId: string) {
    return this.fetch(`/reports/generate?reportId=${reportId}`);
  }

  storageStatus() {
    return this.fetch<{ enabled: boolean }>('/storage/status');
  }

  async uploadBankStatement(accountId: string, file: File) {
    const form = new FormData();
    form.append('file', file);
    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const companyId = this.getCompanyId();
    if (companyId) headers['x-company-id'] = companyId;

    const res = await fetch(`${API_URL}/api/storage/bank-statements/${accountId}`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Upload failed');
    }
    return res.json();
  }
}

export const api = new ApiClient();
