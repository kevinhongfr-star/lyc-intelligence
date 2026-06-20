import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Briefcase, Building2, Loader2, Check } from 'lucide-react';

const DS = {
  accent: '#C108AB',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
};

interface DbMandate {
  id: string;
  title: string;
  status: string;
  jd_description: string | null;
  search_definition: string | null;
  skills_requirements: string[] | null;
  company?: { id: string; name: string } | null;
}

interface MandateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mandate: { mandate_id: string; title: string; jd: string }) => void;
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    '1_search': 'Searching', '2_shortlist': 'Shortlist', '3_interview': 'Interview',
    '4_offer': 'Offer', '5_placed': 'Placed', '6_closed': 'Closed'
  };
  return map[s] || s;
}

export function MandateSelector({ open, onClose, onSelect }: MandateSelectorProps) {
  const [search, setSearch] = useState('');
  const [mandates, setMandates] = useState<DbMandate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMandates = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (q) params.set('q', q);
      const res = await fetch(`/api/data/mandate?${params}`);
      const data = await res.json();
      setMandates(data.data || []);
    } catch (e) {
      console.error('[MandateSelector] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchMandates('');
      setSearch('');
    }
  }, [open, fetchMandates]);

  useEffect(() => {
    const timer = setTimeout(() => fetchMandates(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchMandates]);

  const handleSelect = (m: DbMandate) => {
    const jd = m.jd_description || m.search_definition || '';
    onSelect({ mandate_id: m.id, title: m.title, jd });
    onClose();
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px', zIndex: 1000
    }}>
      <div style={{
        background: DS.card, border: `1px solid ${DS.cardBorder}`,
        borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '640px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Select a Mandate (JD)
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: 20, height: 20, color: DS.muted }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '12px', width: 16, height: 16, color: DS.muted }} />
          <input
            placeholder="Search by mandate title or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px',
              background: DS.bgAlt, border: `1px solid ${DS.cardBorder}`,
              borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
            autoFocus
          />
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 style={{ width: 24, height: 24, color: DS.accent, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : mandates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: DS.muted, fontSize: '14px' }}>
              No mandates found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mandates.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  style={{
                    padding: '14px 16px',
                    background: DS.bgAlt,
                    border: `1px solid ${DS.cardBorder}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = DS.accent;
                    (e.currentTarget as HTMLElement).style.background = `${DS.accent}05`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = DS.cardBorder;
                    (e.currentTarget as HTMLElement).style.background = DS.bgAlt;
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Briefcase style={{ width: 14, height: 14, color: DS.accent, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: '14px', color: DS.text, flex: 1 }}>
                      {m.title}
                    </span>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                      background: m.status === '1_search' ? '#3B82F620' : m.status === '5_placed' ? '#22C55E20' : '#EAB30820',
                      color: m.status === '1_search' ? '#2563EB' : m.status === '5_placed' ? '#16A34A' : '#CA8A04',
                      fontWeight: 600
                    }}>
                      {statusLabel(m.status)}
                    </span>
                  </div>
                  {m.company?.name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: DS.muted, marginLeft: '22px' }}>
                      <Building2 style={{ width: 12, height: 12 }} />
                      {m.company.name}
                    </div>
                  )}
                  {m.jd_description && (
                    <div style={{ fontSize: '12px', color: DS.muted, marginTop: '6px', marginLeft: '22px', 
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.jd_description.slice(0, 120)}...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={onClose} style={{
            padding: '10px 24px', background: DS.bgAlt, border: `1px solid ${DS.cardBorder}`,
            borderRadius: '8px', color: DS.textSecondary, fontSize: '14px', cursor: 'pointer'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
