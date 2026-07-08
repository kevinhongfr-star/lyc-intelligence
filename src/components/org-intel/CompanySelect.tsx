/**
 * CompanySelect — shared dropdown for picking a target company across tabs.
 *
 * Fetches from `target_companies` (T1 table). When T1 SQL is not run yet,
 * the fetch will 404 and the dropdown shows "No companies yet" — this is
 * expected behavior, not a bug.
 */
import React, { useEffect, useState } from 'react';
import { Building2, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export interface Company {
  id: string;
  name: string;
  sector: string | null;
  country: string | null;
  hq_city: string | null;
  status: string | null;
}

interface Props {
  value: string | null;
  onChange: (companyId: string | null) => void;
  className?: string;
  /** When true, shows "All companies" option as default */
  allowAll?: boolean;
}

export function CompanySelect({ value, onChange, className, allowAll }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sb = useAuthStore.getState().supabase;
    if (!sb) {
      setError('Supabase not available');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const { data, error: e } = await sb
          .from('target_companies')
          .select('id,name,sector,country,hq_city,status')
          .is('archived_at', null)
          .order('name', { ascending: true })
          .limit(500);
        if (e) {
          setError(e.message);
        } else {
          setCompanies((data ?? []) as Company[]);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className={className}>
      <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
        <Building2 className="w-4 h-4" />
        Target company
      </label>
      {loading ? (
        <div className="flex items-center gap-2 text-text-muted text-sm py-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading companies…
        </div>
      ) : error ? (
        <div className="text-sm text-red-600 py-2">{error}</div>
      ) : companies.length === 0 ? (
        <div className="text-sm text-text-muted py-2">
          No companies yet. Upload one from the Companies tab.
        </div>
      ) : (
        <select
          value={value ?? (allowAll ? '__all__' : '')}
          onChange={(e) => onChange(e.target.value === '__all__' ? null : e.target.value)}
          className="w-full md:w-96 border border-bg-hover rounded-none px-3 py-2 text-sm bg-white"
        >
          {allowAll && <option value="__all__">All companies</option>}
          {!allowAll && <option value="">— Select a company —</option>}
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.sector ? ` · ${c.sector}` : ''}
              {c.country ? ` · ${c.country}` : ''}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
