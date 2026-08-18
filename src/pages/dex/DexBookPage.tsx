/**
 * DexBookPage — 1:1 coaching session booking (S2-T06)
 *
 * Fetches active consultants from the `consultants` table, displays their
 * specializations and capacity, and books a session by deducting 1 credit.
 */
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Mail, AlertCircle, Clock } from 'lucide-react';
import { Button, Card, CardContent, Badge, EmptyState } from '@/components/ui';
import { useCredits } from '@/contexts/CreditContext';
import { getSupabase } from '@/services/supabaseApi';

interface Consultant {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  specializations: string[] | null;
  max_capacity: number | null;
  current_load: number | null;
  status: string | null;
}

interface Confirmed {
  consultant: Consultant;
  slot: string;
}

const TIME_SLOTS = [
  'Mon 10:00', 'Mon 14:00', 'Mon 16:00',
  'Tue 10:00', 'Tue 14:00', 'Tue 16:00',
  'Wed 10:00', 'Wed 14:00', 'Wed 16:00',
  'Thu 10:00', 'Thu 14:00', 'Thu 16:00',
  'Fri 10:00', 'Fri 14:00',
];

export function DexBookPage() {
  const { credit, deductCredit, refreshCredits } = useCredits();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [slot, setSlot] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const sb = getSupabase();
        const { data, error: sbError } = await sb
          .from('consultants')
          .select('id, name, role, email, specializations, max_capacity, current_load, status')
          .eq('status', 'active')
          .order('name', { ascending: true });
        if (cancelled) return;
        if (sbError) {
          console.warn('[DexBookPage] consultants fetch failed:', sbError.message);
          setError('Unable to load coaching team right now.');
        } else {
          setConsultants((data as Consultant[]) ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[DexBookPage] error:', e);
          setError('Unable to load coaching team right now.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedConsultant = consultants.find(c => c.id === selectedId) ?? null;

  const handleBook = async () => {
    if (!selectedConsultant || !slot) return;
    if (credit.balance < 1) return;
    setBooking(true);
    setError(null);
    const ok = await deductCredit(1, `Coaching session with ${selectedConsultant.name}`);
    setBooking(false);
    if (!ok) {
      setError('Could not deduct a mile for this session. Please try again.');
      return;
    }
    await refreshCredits();
    setConfirmed({ consultant: selectedConsultant, slot });
    setSelectedId(null);
    setSlot('');
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-400 text-sm">Loading coaching team…</div>;
  }

  // ── Confirmation view ──
  if (confirmed) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1
            className="text-3xl font-bold text-[#1A1A2E] mb-2"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Session Booked
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Your coaching session with <span className="font-semibold">{confirmed.consultant.name}</span> is
            confirmed for <span className="font-semibold">{confirmed.slot}</span>. A confirmation will be sent
            to your email.
          </p>
          <Card className="text-left mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fuchsia text-white flex items-center justify-center font-semibold">
                  {confirmed.consultant.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-[#1A1A2E]">{confirmed.consultant.name}</div>
                  <div className="text-xs text-gray-500 capitalize">{confirmed.consultant.role?.replace(/_/g, '') ?? 'Consultant'}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3.5 h-3.5" /> {confirmed.slot}
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/dex/chat"><Button>Continue with DEX AI</Button></a>
            <a href="/dex-ai"><Button variant="outline">Back to DEX</Button></a>
          </div>
        </div>
      </div>
    );
  }

  // ── Booking view ──
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        <a href="/dex-ai" className="flex items-center gap-1 text-sm text-gray-500 hover:text-fuchsia mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to DEX
        </a>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-fuchsia/10 text-fuchsia text-xs font-semibold uppercase tracking-wide mb-3">
            <Calendar className="w-3 h-3" /> Coaching Session
          </div>
          <h1
            className="text-3xl font-bold text-[#1A1A2E] mb-2"
            style={{ fontFamily: "'Libre Baskerville', Georgia, serif" }}
          >
            Book a 1:1 Coaching Session
          </h1>
          <p className="text-sm text-gray-600">
            One mile per session with a senior LYC Partners consultant. You have{''}
            <span className="font-semibold text-fuchsia">{credit.balance} mi</span>.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {consultants.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-10 h-10 text-gray-400" />}
            title="No consultants available"
            description="Our coaching team is fully booked. Please check back soon."
          />
        ) : (
          <>
            {/* Consultant selection */}
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              {consultants.map(c => {
                const capacity = c.max_capacity ?? 0;
                const load = c.current_load ?? 0;
                const available = capacity > 0 ? Math.max(0, capacity - load) : null;
                const active = selectedId === c.id;
                return (
                  <Card
                    key={c.id}
                    className={`p-4 cursor-pointer transition-colors ${active ? 'border-fuchsia ring-1 ring-fuchsia' : 'hover:border-fuchsia/40'}`}
                    onClick={() => { setSelectedId(c.id); setSlot(''); }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-fuchsia/10 text-fuchsia flex items-center justify-center font-semibold flex-shrink-0">
                        {c.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[#1A1A2E]">{c.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{c.role?.replace(/_/g, '') ?? 'Consultant'}</div>
                        {c.specializations && c.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.specializations.slice(0, 3).map(s => (
                              <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5">{s}</span>
                            ))}
                          </div>
                        )}
                        {available != null && (
                          <div className="mt-2 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className={available > 0 ? 'text-green-600' : 'text-gray-400'}>
                              {available > 0 ? `${available} slot${available > 1 ? 's' : ''} open` : 'At capacity'}
                            </span>
                          </div>
                        )}
                      </div>
                      {c.email && (
                        <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="text-gray-400 hover:text-fuchsia">
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Slot selection */}
            {selectedConsultant && (
              <Card className="mb-6">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A2E]">Select a time with {selectedConsultant.name}</h3>
                    <Badge variant="outline" className="text-xs">1 mile</Badge>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {TIME_SLOTS.map(s => {
                      const active = slot === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSlot(s)}
                          className={`px-2 py-2 text-xs border transition-colors ${
                            active ? 'bg-fuchsia text-white border-fuchsia' : 'bg-white text-gray-600 border-gray-200 hover:border-fuchsia/40'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confirm */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {selectedConsultant && slot
                  ? `Confirm: ${selectedConsultant.name} · ${slot}`
                  : 'Select a consultant and time slot to continue.'}
              </div>
              <Button
                onClick={handleBook}
                disabled={!selectedConsultant || !slot || booking || credit.balance < 1}
              >
                {booking ? 'Booking…' : credit.balance < 1 ? 'No miles' : 'Confirm Booking'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DexBookPage;
