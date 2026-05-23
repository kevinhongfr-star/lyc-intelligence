import React, { useState } from 'react';
import { Search, Users, Loader2 } from 'lucide-react';
import { useContacts } from '@/hooks/useSupabaseData';
import { Badge, Card, CardContent } from '@/components/ui';

export function CandidatesPage() {
  const [search, setSearch] = useState('');
  const { data: contacts, count, loading } = useContacts({ query: search, limit: 50 });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-serif font-bold text-text-primary">Candidates</h1><p className="text-text-muted">{count} candidates</p></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" /><input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full max-w-md pl-10 pr-4 py-2 bg-bg-secondary border border-bg-tertiary rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" /></div>
      {loading ? <div className="text-text-muted text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{contacts.map(c => (
          <div key={c.id} className="bg-bg-secondary border border-bg-tertiary rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">{c.name?.[0] ?? '?'}</div><div><h3 className="font-medium text-text-primary">{c.name}</h3><p className="text-xs text-text-muted">{c.current_title ?? 'No title'} · {c.company?.name ?? 'No company'}</p></div></div>
            {c.trident_composite != null && <Badge variant={c.trident_composite >= 75 ? 'success' : c.trident_composite >= 50 ? 'warning' : 'default'}>TRIDENT: {c.trident_composite}</Badge>}
            <div className="mt-2 flex flex-wrap gap-1">{(c.skills || []).slice(0, 5).map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">{s}</span>)}</div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
