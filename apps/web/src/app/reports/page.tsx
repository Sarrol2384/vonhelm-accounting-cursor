'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@accounting/ui';
import { api } from '@/lib/api';
import { Download, FileText } from 'lucide-react';

interface Report {
  id: string;
  name: string;
  category: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.reportsCatalog().then(setReports).catch(console.error);
  }, []);

  const categories = [...new Set(reports.map((r) => r.category))];

  const runReport = async (id: string) => {
    setLoading(true);
    setSelectedReport(id);
    try {
      const data = await api.generateReport(id);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportUrl = (id: string, format: 'pdf' | 'xlsx') => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const companyId = typeof window !== 'undefined' ? localStorage.getItem('companyId') : '';
    return `${base}/api/reports/generate?reportId=${id}&format=${format}&token=${token}&company=${companyId}`;
  };

  return (
    <div>
      <PageHeader title="Reports" description="Financial, VAT, and operational reports with export" />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat} className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{cat}</h3>
              <ul className="space-y-1">
                {reports
                  .filter((r) => r.category === cat)
                  .map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => runReport(r.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${
                          selectedReport === r.id ? 'bg-brand/10 text-brand-dark' : 'text-slate-700'
                        }`}
                      >
                        <FileText className="h-4 w-4" />
                        {r.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            {selectedReport ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">{reports.find((r) => r.id === selectedReport)?.name}</h3>
                  <div className="flex gap-2">
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/reports/generate?reportId=${selectedReport}&format=pdf`}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(exportUrl(selectedReport, 'pdf'), '_blank');
                      }}
                    >
                      <Download className="h-3 w-3" /> PDF
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open(exportUrl(selectedReport, 'xlsx'), '_blank');
                      }}
                    >
                      <Download className="h-3 w-3" /> Excel
                    </a>
                  </div>
                </div>
                {loading ? (
                  <p className="text-sm text-slate-500">Generating report...</p>
                ) : (
                  <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-50 p-4 text-xs">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                )}
              </>
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">Select a report from the catalog</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
