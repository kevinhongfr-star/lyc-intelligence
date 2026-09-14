/**
 * NEXUSPage — v8.2 (light chat canvas + matte-black shell)
 *
 * Visual:
 *   SHELL (left panel, header): Apple matte black #0a0a0b, gray hairlines.
 *   CHAT (canvas + bubbles):    iOS light — #f7f7f9 canvas, white AI bubbles,
 *                               #0A84FF user bubbles, soft 20px radii.
 *                               Fuchsia ONLY on the logo dot / avatar tails.
 *
 * v8.2 features:
 *   - SSE-style streaming answers (first-token fast), polling fallback
 *   - Document upload (paperclip → /api/upload → file context in /api/chat)
 *   - Clickable suggestion chips on the greeting AND after every assistant turn
 *   - Two pastilles per answer: 💡 INSIGHTS & DATA (amber) · ⓘ BACKGROUND (teal)
 *   - Avatar 50% larger; panel & icons smaller
 *   - Ambient: 5 CC0 loops, hard loop, per-track volume + mute/silent
 *   - Warm, human, data-disciplined persona (WEB_COACH_DIRECTIVE)
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { streamChatMessage, uploadDocument, type ChatFile } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackNexusFirstMessageSent, trackNexusChatInitiation } from '@/analytics/eventTracker';
import { buildNexusFirstResponse, NEXUS_FIRST_RESPONSE_QUICK_REPLIES } from '@/nexus/nexusKnowledge';
import { buildLocalAssessmentContextForNexus, getAssessmentProgress, recommendNextAssessment } from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

interface Attachment {
  file: ChatFile;
  pending?: boolean;
}
interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  streaming?: boolean;
  insights?: string[];
  references?: string[];
  suggestions?: string[];
  attachments?: ChatFile[];
}

const DEMO_UID_KEY = 'nexus_demo_uid';

/* ── Compact, warm web directive (numbers only via insights/references) ── */
const WEB_COACH_DIRECTIVE = `You are NEXUS, an executive thinking partner from LYC Partners. A real, warm professional is on the other side.

VOICE & RAPPORT
- Greet and acknowledge the person before answering. Be human, present, unhurried.
- Build rapport across the WHOLE conversation: notice what they share about their role, situation, and priorities; remember context from earlier turns; earn trust — never assume it.
- Protect intimacy and privacy: do not press for personal detail, never expose what another person shared, and respect every boundary. One gentle question per turn, never an interrogation.
- Plain English only. No internal code names, no jargon, no product codenames.

ANSWER SHAPE
- Short warm opening line, then the direct answer in short paragraphs; use bullets only when they genuinely help.
- Main answer: ZERO statistics, percentages, market sizes, rankings, benchmarks or numeric claims. No numbers at all in the main answer.
- End with ONE inviting question or a small set of clear options. Keep the main answer under 140 words.
- Never push a form, assessment, PDF or paid step without explicit permission. Ask consent first.

DATA DISCIPLINE
- All numbers, market context, trends, benchmarks and supporting detail go ONLY into "insights" (longer, can be detailed).
- Background references go ONLY into "references" (max 2 short neutral entries, no internal source names).
- Every datum must be grounded in provided knowledge; never fabricate.

OUTPUT CONTRACT — return ONLY raw JSON, no markdown fence:
{"answer":"<warm prose, no numbers>", "insights":["<data/trend/context>"], "references":["<neutral background line>"]}`;

/* ── Shell tokens (matte black) ── */
const S = {
  shellBg: '#0a0a0b',
  panelBg: '#0d0d0e',
  headerBg: 'rgba(10,10,11,0.86)',
  line: 'rgba(255,255,255,0.08)',
  lineSoft: 'rgba(255,255,255,0.05)',
  icon: '#c7c7cc',
  iconDim: '#8e8e93',
  wh: '#ffffff',
  fus: '#C108AB',
};

/* ── Light chat tokens (iOS) ── */
const L = {
  canvas: '#f7f7f9',
  aiBubble: '#ffffff',
  userBubble: '#0A84FF',
  aiTx: '#1c1c1e',
  aiTx2: '#3c3c43',
  userTx: '#ffffff',
  bdr: 'rgba(60,60,67,0.12)',
  chipBorder: 'rgba(60,60,67,0.16)',
  chipText: '#1c1c1e',
  insight: '#b8860b',
  insightBg: 'rgba(184,134,11,0.08)',
  reference: '#0E7C78',
  referenceBg: 'rgba(14,124,120,0.08)',
  r: 20,
  rs: 10,
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif",
  logo: "'Crimson Pro', Georgia, 'Times New Roman', serif",
};

/* ── Ambient (CC0 loops self-hosted) ── */
const svgAttrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
const AMBIENT_ICONS: Record<string, string> = {
  rain: `<svg ${svgAttrs}><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v6"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
  cafe: `<svg ${svgAttrs}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 2v3"/><path d="M10 2v3"/><path d="M14 2v3"/></svg>`,
  fire: `<svg ${svgAttrs}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  beach: `<svg ${svgAttrs}><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  forest: `<svg ${svgAttrs}><path d="M12 2 7 10h10L12 2z"/><path d="M12 8 5 18h14L12 8z"/><path d="M12 18v4"/></svg>`,
};
const AMBIENT_SOUNDS = [
  { id: 'rain', file: '/sounds/ambient/rain.mp3', label: 'Rain' },
  { id: 'cafe', file: '/sounds/ambient/cafe.mp3', label: 'Cafe' },
  { id: 'fire', file: '/sounds/ambient/fire.mp3', label: 'Fire' },
  { id: 'beach', file: '/sounds/ambient/beach.mp3', label: 'Beach' },
  { id: 'forest', file: '/sounds/ambient/forest.mp3', label: 'Forest' },
] as const;

/* ── SVG Avatar (kept from v8 orbital component) ── */
const CX = 30, CY = 30;
const DOTS = [
  { rx: 14, ry: 7,   spd: .0020, sz: 2.8, ph: 0,   tilt: .55,  tailLen: 35, tailSpace: .018 },
  { rx: 18, ry: 4.5, spd: .0014, sz: 1.6, ph: 2.3, tilt: -.44, tailLen: 28, tailSpace: .016 },
  { rx: 8,  ry: 15,  spd: .0027, sz: 1.1, ph: 4.2, tilt: 1.30,  tailLen: 22, tailSpace: .014 },
];
const TAIL_PAL = ['#C108AB', '#D946EF', '#A855F7', '#7C3AED', '#0EA5A0', '#14B8A6', '#0D9488', '#2563EB', '#3B82F6', '#60A5FA'];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function h2r(h: string) {
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function sampleGrad(f: number) {
  const i = f * (TAIL_PAL.length - 1), j = Math.floor(i);
  const a = h2r(TAIL_PAL[j]), b = h2r(TAIL_PAL[Math.min(j + 1, TAIL_PAL.length - 1)]);
  return { r: Math.round(lerp(a.r, b.r, i - j)), g: Math.round(lerp(a.g, b.g, i - j)), b: Math.round(lerp(a.b, b.b, i - j)) };
}
interface DotConfig {
  rx: number; ry: number; spd: number; sz: number; ph: number; tilt: number;
  tailLen: number; tailSpace: number;
  tailEls?: SVGCircleElement[]; mainEl?: SVGCircleElement;
}
function orbPos(d: DotConfig, ang: number) {
  const ex = d.rx * Math.cos(ang), ey = d.ry * Math.sin(ang);
  const ct = Math.cos(d.tilt), st = Math.sin(d.tilt);
  return { x: CX + ex * ct - ey * st, y: CY + ex * st + ey * ct, depth: Math.sin(ang) * Math.abs(Math.sin(d.tilt)) };
}
function orbTangent(d: DotConfig, ang: number) {
  const dex = -d.rx * Math.sin(ang), dey = d.ry * Math.cos(ang);
  const ct = Math.cos(d.tilt), st = Math.sin(d.tilt);
  const tx = dex * ct - dey * st, ty = dex * st + dey * ct;
  const len = Math.sqrt(tx * tx + ty * ty) || 1;
  return { x: tx / len, y: ty / len };
}

function NexusAvatar({ size = 22 }: { size?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const dots: DotConfig[] = DOTS.map(d => ({ ...d }));
    dots.forEach(d => {
      d.tailEls = [];
      for (let j = 0; j < d.tailLen; j++) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '0.4');
        svg.appendChild(c);
        d.tailEls.push(c);
      }
      const m = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      m.setAttribute('r', String(d.sz));
      svg.appendChild(m);
      d.mainEl = m;
    });

    function animate(t: number) {
      dots.forEach(d => {
        const ang = d.ph + t * d.spd;
        const mp = orbPos(d, ang);
        const tan = orbTangent(d, ang);
        const depthF = (mp.depth + 1) / 2;
        const sizeScale = 0.4 + 0.9 * depthF;
        const mainR = d.sz * sizeScale;
        const mainOp = 0.25 + 0.75 * depthF;
        const farCol = { r: 80, g: 40, b: 70 };
        const nearCol = { r: 255, g: 100, b: 220 };
        const cr = Math.round(lerp(farCol.r, nearCol.r, depthF));
        const cg = Math.round(lerp(farCol.g, nearCol.g, depthF));
        const cb = Math.round(lerp(farCol.b, nearCol.b, depthF));
        if (d.mainEl) {
          d.mainEl.setAttribute('cx', mp.x.toFixed(2));
          d.mainEl.setAttribute('cy', mp.y.toFixed(2));
          d.mainEl.setAttribute('r', mainR.toFixed(2));
          d.mainEl.setAttribute('fill', `rgb(${cr},${cg},${cb})`);
          d.mainEl.setAttribute('opacity', mainOp.toFixed(3));
        }
        const backX = -tan.x, backY = -tan.y;
        const perpX = -tan.y, perpY = tan.x;
        for (let j = 0; j < d.tailLen; j++) {
          const el = d.tailEls![j];
          const trail = (j + 1) * d.tailSpace;
          const wobble = Math.sin(t * 0.003 + j * 0.5 + d.ph) * 0.35;
          const fade = 1 - j / d.tailLen;
          el.setAttribute('cx', (mp.x + backX * trail * 60 + perpX * wobble * 2).toFixed(2));
          el.setAttribute('cy', (mp.y + backY * trail * 60 + perpY * wobble * 2).toFixed(2));
          const col = sampleGrad(1 - fade);
          el.setAttribute('fill', `rgb(${col.r},${col.g},${col.b})`);
          el.setAttribute('opacity', (fade * 0.5).toFixed(3));
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (svg) svg.innerHTML = '';
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 60 60"
      style={{ width: size, height: size, display: 'block', overflow: 'visible' }}
    />
  );
}

function getDemoUid(): string {
  try {
    let uid = localStorage.getItem(DEMO_UID_KEY);
    if (!uid) {
      uid = `demo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(DEMO_UID_KEY, uid);
    }
    return uid;
  } catch {
    return `demo-${Date.now().toString(36)}`;
  }
}

/* ── Light-theme markdown renderers ── */
const lightMd = {
  a: ({ href, children }: any) => <a href={href} style={{ color: L.reference, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ margin: '0 0 8px', lineHeight: 1.6, color: L.aiTx, fontFamily: L.font, fontSize: 14.5 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: L.logo, color: L.aiTx, fontSize: 19, margin: '4px 0 8px', fontWeight: 700 }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: L.logo, color: L.aiTx, fontSize: 17, margin: '4px 0 6px', fontWeight: 700 }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ color: L.aiTx, fontSize: 15, margin: '4px 0 6px', fontWeight: 600 }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ color: L.aiTx, fontWeight: 600 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: L.aiTx2 }}>{children}</em>,
  ul: ({ children }: any) => <ul style={{ margin: '2px 0 8px', paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '2px 0 8px', paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ color: L.aiTx, fontFamily: L.font, fontSize: 14.5, lineHeight: 1.6, marginBottom: 4 }}>{children}</li>,
};

function NEXUSPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const demoUid = useMemo(() => getDemoUid(), []);
  const assessmentProgress = useMemo(() => getAssessmentProgress(), []);
  const nextRecommendation = useMemo(() => recommendNextAssessment(), []);

  const [messages, setMessages] = useState<Message[]>(() => {
    const base = buildNexusFirstResponse(profile?.name);
    return [{ role: 'assistant', content: base, suggestions: NEXUS_FIRST_RESPONSE_QUICK_REPLIES }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set()); // key: `${i}:kind`
  const [panelOpen, setPanelOpen] = useState(true);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.6);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstMessageSentRef = useRef(false);
  const inFlightRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) { setInput(q); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [searchParams]);

  const codeParam = searchParams.get('code');
  const lensContext = useMemo(() => {
    if (!codeParam) return undefined;
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return undefined;
    const dimList = info.dimensions.map(d => `${d.name} (${d.lowLabel} → ${d.highLabel})`).join('; ');
    return [
      `=== CURRENT LENS CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Explain dimensions by their plain names. No internal codes in the answer.`,
    ].join('\n');
  }, [codeParam]);

  const localAssessmentContext = useMemo(() => buildLocalAssessmentContextForNexus(), []);
  const combinedContext = [lensContext, localAssessmentContext.contextString].filter(Boolean).join('\n\n');
  const systemPrompt = useMemo(
    () => [WEB_COACH_DIRECTIVE, combinedContext].filter(Boolean).join('\n\n'),
    [combinedContext],
  );

  useEffect(() => { trackNexusChatInitiation('direct_link'); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  /* ── Ambient audio control ── */
  useEffect(() => {
    if (!activeSound) return;
    const meta = AMBIENT_SOUNDS.find(s => s.id === activeSound);
    if (!meta) return;
    const audio = new Audio(meta.file);
    audio.loop = true;
    audio.crossOrigin = 'anonymous';
    audio.volume = muted ? 0 : volume;
    audioRef.current = audio;
    audio.play().catch(() => { setActiveSound(null); });
    return () => { audio.pause(); audio.src = ''; audioRef.current = null; };
  }, [activeSound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const toggleSound = (id: string) => {
    setActiveSound(prev => (prev === id ? null : id));
    setMuted(false);
  };

  /* ── Upload ── */
  const onFilesPicked = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    const file = fileList[0];
    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, { role: 'assistant', content: "That file is over 10 MB — could you share a smaller version?", isError: true }]);
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadDocument(file);
      setAttachments(prev => [...prev, { file: uploaded }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: e?.message?.includes('credit')
        ? "Document service is briefly unavailable. Please try again in a moment."
        : "I couldn't read that document — PDF, Word, text or spreadsheet works best.", isError: true }]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const send = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim();
    if ((!msgText && attachments.length === 0) || inFlightRef.current) return;
    inFlightRef.current = true;
    if (!firstMessageSentRef.current) {
      firstMessageSentRef.current = true;
      try { trackNexusFirstMessageSent('explorer'); } catch { /* analytics best-effort */ }
    }

    const files = attachments.map(a => a.file);
    const displayText = msgText || (files.length ? `Shared ${files.map(f => f.file_name).join(', ')}` : '');
    const userMsg: Message = { role: 'user', content: displayText, attachments: files.length ? files : undefined };
    const historyForRequest = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachments([]);
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    const assistantIdx = messages.length + 1; // index the assistant msg will have
    const placeholder: Message = { role: 'assistant', content: '', streaming: true };
    setMessages(prev => [...prev, placeholder]);

    let acc = '';
    const controller = streamChatMessage(
      msgText || 'I have shared a document. Please acknowledge and ask what I would like to explore.',
      user?.id || demoUid,
      historyForRequest,
      { systemPrompt, tier: 'explorer', files },
      {
        onDelta: (piece, replace) => {
          if (replace) acc = piece; else acc += piece;
          setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, content: acc } : m));
        },
        onMeta: (meta) => {
          setMessages(prev => prev.map((m, i) => i === assistantIdx ? {
            ...m,
            insights: meta.insights && meta.insights.length ? meta.insights : m.insights,
            references: meta.references && meta.references.length ? meta.references : m.references,
            suggestions: meta.suggestions && meta.suggestions.length ? meta.suggestions.slice(0, 4) : m.suggestions,
          } : m));
        },
        onError: (errMsg) => {
          acc = errMsg;
          setMessages(prev => prev.map((m, i) => i === assistantIdx ? { ...m, content: errMsg, isError: true, streaming: false } : m));
        },
        onDone: () => {
          setMessages(prev => prev.map((m, i) => i === assistantIdx ? {
            ...m,
            streaming: false,
            content: m.content || "Thank you for sharing that. What would you like to explore together?",
            suggestions: m.suggestions && m.suggestions.length ? m.suggestions : defaultFollowUps(m.content),
          } : m));
          inFlightRef.current = false;
          setLoading(false);
        },
      },
    );
    // Allow navigation / unmount to abort.
    return () => controller.abort();
  }, [input, attachments, messages, systemPrompt, user, demoUid]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      send();
    }
  };
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
  };

  const newChat = () => {
    inFlightRef.current = false;
    setMessages([{ role: 'assistant', content: buildNexusFirstResponse(profile?.name), suggestions: NEXUS_FIRST_RESPONSE_QUICK_REPLIES }]);
    setInput('');
    setAttachments([]);
    firstMessageSentRef.current = false;
    if (inputRef.current) inputRef.current.style.height = 'auto';
    navigate('/nexus/chat', { replace: true });
  };

  const toggleFold = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  /* ── Styles ── */
  useEffect(() => {
    const styleId = 'nexus-v82-styles';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      @keyframes nxFi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
      @keyframes nxTp{0%,80%,100%{opacity:.3;transform:translateY(0)}40%{opacity:1;transform:translateY(-3px)}}
      @keyframes nxBlink{0%,100%{opacity:.25}50%{opacity:.9}}
    `;
    document.head.appendChild(s);
    return () => { document.getElementById(styleId)?.remove(); };
  }, []);

  const chipsFor = (msg: Message, i: number) => {
    if (msg.role !== 'assistant' || msg.isError || msg.streaming) return null;
    const isLastAssistant = i === messages.length - 1 && !loading;
    if (!isLastAssistant) return null;
    const options = msg.suggestions && msg.suggestions.length
      ? msg.suggestions
      : (i === 0 ? NEXUS_FIRST_RESPONSE_QUICK_REPLIES : null);
    if (!options) return null;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 8, animation: 'nxFi 0.35s ease' }}>
        {options.map((opt, k) => (
          <button key={k} onClick={() => send(opt)} style={{
            padding: '7px 13px', borderRadius: 16, border: `1px solid ${L.chipBorder}`,
            background: '#fff', color: L.chipText, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', fontFamily: L.font, transition: 'all .15s',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}
            onMouseOver={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.borderColor = L.userBubble; }}
            onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = L.chipBorder; }}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <SEO title="NEXUS. — Executive Thinking Partner" description="NEXUS is the executive thinking partner by LYC Partners." />
      <div style={{
        display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden',
        background: S.shellBg, fontFamily: L.font, fontSize: 15, lineHeight: 1.5,
        WebkitFontSmoothing: 'antialiased' as any, color: S.wh,
      }}>

        {/* ── LEFT PANEL (matte black) ── */}
        <aside style={{
          width: panelOpen ? 212 : 0, background: S.panelBg,
          borderRight: panelOpen ? `1px solid ${S.line}` : 'none', display: 'flex', flexDirection: 'column',
          transition: 'width .28s cubic-bezier(.4,0,.2,1), opacity .2s', overflow: 'hidden', flexShrink: 0,
          opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none',
        }}>
          {/* Brand — avatar 22 → 33 (+50%) */}
          <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', borderBottom: `1px solid ${S.line}`, flexShrink: 0 }}>
            <div style={{ width: 33, height: 33, flexShrink: 0 }}><NexusAvatar size={33} /></div>
            <span style={{ fontFamily: L.logo, fontSize: 16.5, fontWeight: 700, color: S.wh, letterSpacing: '.01em' }}>
              NEXUS<span style={{ color: S.fus }}>.</span>
            </span>
          </div>

          <button onClick={newChat} style={{
            margin: '10px 12px 6px', padding: '8px 10px', borderRadius: L.rs,
            border: `1px solid ${S.line}`, background: 'transparent', color: S.icon, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', textAlign: 'left' as const, fontFamily: L.font,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke={S.icon} strokeWidth="1.9" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New Chat
          </button>

          <div style={{ padding: '8px 14px 4px', fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', color: S.iconDim, textTransform: 'uppercase' as const }}>Recent</div>
          <div style={{ flex: 1, overflowY: 'auto' as const, padding: '2px 8px 8px' }}>
            {['Career move thinking', 'Leadership benchmark', 'Board narrative prep'].map((p, i) => (
              <div key={i} style={{ padding: '7px 9px', borderRadius: L.rs, cursor: 'pointer', color: S.iconDim, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, transition: 'background .15s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                {p}
              </div>
            ))}
          </div>

          {/* Ambient */}
          <div style={{ borderTop: `1px solid ${S.line}`, padding: '10px 12px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '.08em', color: S.iconDim, textTransform: 'uppercase' as const, marginBottom: 8 }}>Ambient</div>
            <div style={{ display: 'flex', gap: 7, marginBottom: activeSound ? 8 : 0 }}>
              {AMBIENT_SOUNDS.map(snd => {
                const active = activeSound === snd.id;
                return (
                  <button key={snd.id} title={snd.label} onClick={() => toggleSound(snd.id)} style={{
                    width: 30, height: 30, borderRadius: 8,
                    border: `1px solid ${active ? 'rgba(255,255,255,0.30)' : S.line}`,
                    background: active ? '#1c1c1e' : 'transparent', color: active ? S.wh : S.icon,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }} dangerouslySetInnerHTML={{ __html: AMBIENT_ICONS[snd.id] }} />
                );
              })}
            </div>
            {activeSound && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, animation: 'nxFi .25s ease' }}>
                <button title={muted ? 'Unmute' : 'Mute'} onClick={() => setMuted(m => !m)} style={{
                  width: 24, height: 24, borderRadius: 6, border: `1px solid ${S.line}`, background: 'transparent',
                  color: muted ? S.iconDim : S.icon, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}>
                  {muted ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
                  )}
                </button>
                <input
                  type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); if (Number(e.target.value) > 0) setMuted(false); }}
                  style={{ flex: 1, accentColor: '#ffffff', height: 2, cursor: 'pointer' }}
                  aria-label="Ambient volume"
                />
              </div>
            )}
          </div>
        </aside>

        {/* ── MAIN (light chat) ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: L.canvas }}>
          {/* Header (matte black, gray line) */}
          <header style={{
            height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px', background: S.headerBg, backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${S.line}`, zIndex: 10, flexShrink: 0,
          }}>
            <button onClick={() => setPanelOpen(!panelOpen)} title="Toggle panel" style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${S.line}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.icon, padding: 0 }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {!panelOpen && <div style={{ width: 26, height: 26 }}><NexusAvatar size={26} /></div>}
              <h1 style={{ fontFamily: L.logo, fontSize: 16.5, fontWeight: 700, color: S.wh, letterSpacing: '.01em', margin: 0 }}>
                NEXUS<span style={{ color: S.fus }}>.</span>
              </h1>
            </div>
            <div style={{ width: 30 }} />
          </header>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto' as const }}>
            <div style={{ maxWidth: 740, margin: '0 auto', padding: '22px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                const hasInsights = !isUser && msg.insights && msg.insights.length > 0 && !msg.isError;
                const hasRefs = !isUser && msg.references && msg.references.length > 0 && !msg.isError;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '86%', animation: 'nxFi .3s ease' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexDirection: isUser ? 'row-reverse' : 'row' }}>
                      {!isUser && (
                        <div style={{ width: 22, height: 22, marginTop: 8, flexShrink: 0, borderRadius: '50%', background: '#fff', border: `1px solid ${L.bdr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <NexusAvatar size={18} />
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                        {/* attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 6, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                            {msg.attachments.map((a, k) => (
                              <span key={k} style={{ fontSize: 11.5, padding: '4px 9px', borderRadius: 10, background: isUser ? 'rgba(255,255,255,0.18)' : '#fff', color: isUser ? '#fff' : L.aiTx2, border: isUser ? 'none' : `1px solid ${L.bdr}`, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                                {a.file_name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div style={{
                          padding: '11px 15px', fontSize: 14.5, lineHeight: 1.55,
                          wordWrap: 'break-word' as any, overflowWrap: 'anywhere' as any,
                          ...(isUser
                            ? { background: L.userBubble, color: L.userTx, borderRadius: `${L.r}px ${L.r}px 4px ${L.r}px`, whiteSpace: 'pre-wrap' as any, boxShadow: '0 1px 2px rgba(10,132,255,0.25)' }
                            : { background: L.aiBubble, color: L.aiTx, border: `1px solid ${L.bdr}`, borderRadius: `${L.r}px ${L.r}px ${L.r}px 4px`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }),
                          ...(msg.isError ? { borderColor: 'rgba(239,68,68,0.35)', color: '#b91c1c', background: '#fef2f2' } : {}),
                        }}>
                          {isUser
                            ? msg.content
                            : (msg.content
                              ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={lightMd}>{msg.content}</ReactMarkdown>
                              : msg.streaming
                                ? <span style={{ display: 'inline-flex', gap: 4 }}>{[0, 1, 2].map(k => <span key={k} style={{ width: 5, height: 5, borderRadius: '50%', background: L.aiTx2, animation: `nxTp 1.2s ease-in-out infinite ${k * .15}s` }} />)}</span>
                                : '')}
                          {!isUser && msg.streaming && msg.content && (
                            <span style={{ display: 'inline-block', width: 2, height: 14, background: L.userBubble, marginLeft: 2, verticalAlign: '-2px', animation: 'nxBlink 1s infinite', borderRadius: 1 }} />
                          )}
                        </div>

                        {/* Pastilles */}
                        {(hasInsights || hasRefs) && (
                          <div style={{ display: 'flex', gap: 7, marginTop: 6 }}>
                            {hasInsights && (
                              <Pastille
                                label="INSIGHTS & DATA"
                                kind="insight"
                                open={expanded.has(`${i}:i`)}
                                onClick={() => toggleFold(`${i}:i`)}
                              />
                            )}
                            {hasRefs && (
                              <Pastille
                                label="BACKGROUND"
                                kind="reference"
                                open={expanded.has(`${i}:r`)}
                                onClick={() => toggleFold(`${i}:r`)}
                              />
                            )}
                          </div>
                        )}
                        {hasInsights && expanded.has(`${i}:i`) && (
                          <FoldCard kind="insight" title="INSIGHTS & DATA" items={msg.insights!} />
                        )}
                        {hasRefs && expanded.has(`${i}:r`) && (
                          <FoldCard kind="reference" title="BACKGROUND" items={msg.references!} />
                        )}
                      </div>
                    </div>
                    {chipsFor(msg, i)}
                  </div>
                );
              })}

              {loading && messages[messages.length - 1]?.content === '' && null}
              <div ref={bottomRef} style={{ height: 4 }} />
            </div>
          </div>

          {/* Input bar (light) */}
          <div style={{ padding: '8px 18px 12px', background: 'linear-gradient(to top, #f7f7f9 70%, rgba(247,247,249,0))', flexShrink: 0 }}>
            <div style={{ maxWidth: 740, margin: '0 auto' }}>
              {/* attachment chips */}
              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 7 }}>
                  {attachments.map((a, k) => (
                    <span key={k} style={{ fontSize: 12, padding: '4px 8px 4px 10px', borderRadius: 12, background: '#fff', border: `1px solid ${L.bdr}`, color: L.aiTx2, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {a.pending ? 'Uploading…' : a.file.file_name}
                      <button onClick={() => setAttachments(prev => prev.filter((_, x) => x !== k))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: L.aiTx2, padding: 0, lineHeight: 1 }} aria-label="Remove attachment">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 7, background: '#fff',
                border: `1px solid ${L.bdr}`, borderRadius: 22, padding: '5px 6px 5px 8px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx,.pptx" style={{ display: 'none' }} onChange={e => onFilesPicked(e.target.files)} />
                <button
                  title="Attach a document"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'transparent', cursor: uploading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: uploading ? '#c7c7cc' : '#8e8e93', flexShrink: 0, padding: 0 }}
                >
                  {uploading ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ animation: 'nxBlink 1s infinite' }}><path d="M21 12a9 9 0 1 1-6.2-8.56" /></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                  )}
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={uploading ? 'Reading your document…' : 'Message NEXUS…'}
                  disabled={loading || uploading}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5,
                    lineHeight: 1.5, resize: 'none', maxHeight: 100, padding: '7px 0', fontFamily: L.font, color: L.aiTx,
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || (!input.trim() && attachments.length === 0)}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', border: 'none',
                    background: loading || (!input.trim() && attachments.length === 0) ? '#d1d1d6' : L.userBubble,
                    cursor: loading || (!input.trim() && attachments.length === 0) ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'background .2s', padding: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9 22 2Z" />
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center' as const, marginTop: 8, color: '#8e8e93', fontSize: 10.5, fontFamily: L.font, margin: '8px 0 0' }}>
                NEXUS may produce inaccurate information. Verify critical decisions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function defaultFollowUps(_answer: string): string[] {
  // Gentle, context-neutral continuations when the engine sends no follow_ups.
  void _answer;
  return ['Tell me more', 'What should I consider first?', 'I have a document to share'];
}

function Pastille({ label, kind, open, onClick }: { label: string; kind: 'insight' | 'reference'; open: boolean; onClick: () => void }) {
  const color = kind === 'insight' ? L.insight : L.reference;
  return (
    <button onClick={onClick} title={label} style={{
      width: 26, height: 26, borderRadius: '50%',
      border: `1px solid ${color}55`, background: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, fontWeight: 700, fontSize: 12, fontFamily: L.font, padding: 0,
      transition: 'transform .15s, background .15s', transform: open ? 'scale(1.08)' : 'scale(1)',
    }}>
      {kind === 'insight' ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill={color}><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" /></svg>
      ) : (
        <span style={{ lineHeight: 1, fontStyle: 'italic' }}>i</span>
      )}
    </button>
  );
}

function FoldCard({ kind, title, items }: { kind: 'insight' | 'reference'; title: string; items: string[] }) {
  const color = kind === 'insight' ? L.insight : L.reference;
  const bg = kind === 'insight' ? L.insightBg : L.referenceBg;
  return (
    <div style={{
      marginTop: 7, maxWidth: 520, padding: '11px 14px', background: '#fff',
      border: `1px solid ${color}33`, borderRadius: 14, animation: 'nxFi .22s ease',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.06em', color, marginBottom: 7, background: bg, display: 'inline-block', padding: '2px 8px', borderRadius: 6 }}>
        {title}
      </div>
      {items.map((it, k) => (
        <div key={k} style={{ fontSize: 12.5, lineHeight: 1.55, color: L.aiTx2, marginBottom: k < items.length - 1 ? 7 : 0 }}>
          {kind === 'reference' ? <span style={{ color }}>· </span> : <span style={{ color }}>• </span>}
          {it}
        </div>
      ))}
    </div>
  );
}

export default NEXUSPage;
