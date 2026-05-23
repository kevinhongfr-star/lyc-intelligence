import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, getMandates, searchContacts, getPipelineByMandate, getMandateWithPipeline, getEvents, getDocuments, getNotifications } from '@/services/supabaseApi';
import type { Mandate, Contact, CandidatePipeline, CalendarEvent, Document } from '@/services/supabaseApi';

export function useDashboardStats() {
  const [stats, setStats] = useState<any>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { getDashboardStats().then(s => { setStats(s); setLoading(false); }); }, []);
  return { stats, loading };
}

export function useMandates(params?: { status?: string; limit?: number }) {
  const [data, setData] = useState<Mandate[]>([]); const [count, setCount] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  useEffect(() => { getMandates(params).then(r => { setData(r.data); setCount(r.count); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }, []);
  return { data, count, loading, error };
}

export function useContacts(params: { query?: string; limit?: number }) {
  const [data, setData] = useState<Contact[]>([]); const [count, setCount] = useState(0); const [loading, setLoading] = useState(true);
  useEffect(() => { searchContacts(params).then(r => { setData(r.data); setCount(r.count); setLoading(false); }); }, [params.query]);
  return { data, count, loading };
}

export function usePipeline(mandateId: string) {
  const [data, setData] = useState<Record<string, CandidatePipeline[]>>({}); const [loading, setLoading] = useState(true);
  useEffect(() => { getPipelineByMandate(mandateId).then(r => { setData(r); setLoading(false); }); }, [mandateId]);
  return { data, loading };
}

export function useMandateDetail(mandateId: string) {
  const [mandate, setMandate] = useState<Mandate | null>(null); const [pipeline, setPipeline] = useState<CandidatePipeline[]>([]); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const r = await getMandateWithPipeline(mandateId);
    setMandate(r.mandate); setPipeline(r.pipeline); setLoading(false);
  }, [mandateId]);
  useEffect(() => { load(); }, [load]);
  return { mandate, pipeline, loading, refresh: load };
}

export function useEvents() {
  const [data, setData] = useState<CalendarEvent[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getEvents().then(d => { setData(d); setLoading(false); }); }, []);
  return { data, setData, loading };
}

export function useDocuments() {
  const [data, setData] = useState<Document[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getDocuments().then(d => { setData(d); setLoading(false); }); }, []);
  return { data, loading };
}

export function useNotifications() {
  const [data, setData] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { getNotifications().then(d => { setData(d); setLoading(false); }); }, []);
  return { data, loading };
}
