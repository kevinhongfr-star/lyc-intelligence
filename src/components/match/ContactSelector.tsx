import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, User, Building2, Loader2, Check } from 'lucide-react';

const DS = {
  accent: '#C108AB',
  bg: '#FFFFFF',
  bgAlt: '#F5F5F5',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#000000',
  textSecondary: '#333333',
  muted: '#666666',
  radius: '12px',
  radiusSm: '8px',
};

interface DbContact {
  id: string;
  name: string;
  email: string | null;
  current_title: string | null;
  headline: string | null;
  summary: string | null;
  career_history: Array<{ company: string; role: string }> | null;
  seniority: string | null;
  skills: string[] | null;
  trident_composite: number | null;
  company?: { id: string; name: string } | null;
}

interface ContactSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (contacts: Array<{ contact_id: string; name: string; cv: string }>) => void;
  multi?: boolean;
}

export function ContactSelector({ open, onClose, onSelect, multi = true }: ContactSelectorProps) {
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<DbContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectedData, setSelectedData] = useState<Map<string, DbContact>>(new Map());

  const fetchContacts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (q) params.set('q', q);
      const res = await fetch(`/api/data/contact?${params}`);
      const data = await res.json();
      setContacts(data.data || []);
    } catch (e) {
      console.error('[ContactSelector] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchContacts('');
      setSelected(new Set());
      setSelectedData(new Map());
      setSearch('');
    }
  }, [open, fetchContacts]);

  useEffect(() => {
    const timer = setTimeout(() => fetchContacts(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchContacts]);

  const toggleSelect = (c: DbContact) => {
    const next = new Set(selected);
    const nextData = new Map(selectedData);
    if (next.has(c.id)) {
      next.delete(c.id);
      nextData.delete(c.id);
    } else {
      if (multi) {
        next.add(c.id);
        nextData.set(c.id, c);
      } else {
        next.clear();
        nextData.clear();
        next.add(c.id);
        nextData.set(c.id, c);
      }
    }
    setSelected(next);
    setSelectedData(nextData);
  };

  const handleConfirm = () => {
    const results = Array.from(selectedData.entries()).map(([id, c]) => {
      // Build CV text from contact data
      const parts: string[] = [];
      if (c.headline) parts.push(c.headline);
      if (c.summary) parts.push(c.summary);
      if (c.career_history?.length) {
        parts.push('\nCareer History:');
        for (const ch of c.career_history) {
          parts.push(`- ${ch.role} at ${ch.company}`);
        }
      }
      if (c.skills?.length) {
        parts.push(`\nSkills: ${c.skills.join(', ')}`);
      }
      return {
        contact_id: id,
        name: c.name,
        cv: parts.join('\n'),
      };
    });
    onSelect(results);
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
        borderRadius: '0px', padding: '24px', width: '100%', maxWidth: '640px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '18px', fontWeight: 700, margin: 0 }}>
            Select Candidates from Database
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X style={{ width: 20, height: 20, color: DS.muted }} />
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '12px', width: 16, height: 16, color: DS.muted }} />
          <input
            placeholder="Search by name, title, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 38px',
              background: DS.bgAlt, border: `1px solid ${DS.cardBorder}`,
              borderRadius: '0px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
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
          ) : contacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: DS.muted, fontSize: '14px' }}>
              No contacts found. Try a different search term.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {contacts.map((c) => {
                const isSelected = selected.has(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => toggleSelect(c)}
                    style={{
                      padding: '12px 16px',
                      background: isSelected ? `${DS.accent}08` : DS.bgAlt,
                      border: `1px solid ${isSelected ? DS.accent : DS.cardBorder}`,
                      borderRadius: '0px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '4px',
                      border: `2px solid ${isSelected ? DS.accent : DS.cardBorder}`,
                      background: isSelected ? DS.accent : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <Check style={{ width: 12, height: 12, color: '#fff' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <User style={{ width: 14, height: 14, color: DS.muted, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, fontSize: '14px', color: DS.text }}>{c.name}</span>
                        {c.trident_composite != null && (
                          <span style={{
                            fontSize: '11px', fontWeight: 700, padding: '2px 6px',
                            borderRadius: '4px',
                            background: c.trident_composite >= 75 ? '#22C55E20' : c.trident_composite >= 50 ? '#EAB30820' : '#EF444420',
                            color: c.trident_composite >= 75 ? '#16A34A' : c.trident_composite >= 50 ? '#CA8A04' : '#DC2626'
                          }}>
                            {c.trident_composite}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: DS.muted }}>
                        {c.current_title && <span>{c.current_title}</span>}
                        {c.company?.name && (
                          <>
                            <span>·</span>
                            <Building2 style={{ width: 12, height: 12, flexShrink: 0 }} />
                            <span>{c.company.name}</span>
                          </>
                        )}
                        {c.seniority && <span>· {c.seniority}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: DS.muted }}>
            {selected.size} candidate{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', background: DS.bgAlt, border: `1px solid ${DS.cardBorder}`,
                borderRadius: '0px', color: DS.textSecondary, fontSize: '14px', cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              style={{
                padding: '10px 20px', background: DS.accent, border: 'none',
                borderRadius: '0px', color: '#fff', fontSize: '14px', fontWeight: 600,
                cursor: selected.size > 0 ? 'pointer' : 'not-allowed',
                opacity: selected.size > 0 ? 1 : 0.5
              }}
            >
              Add {selected.size > 0 ? `${selected.size} ` : ''}to Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
