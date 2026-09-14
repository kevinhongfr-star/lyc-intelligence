/**
 * NEXUSPage — v8 DARK THEME REDESIGN
 *
 * Design: Dark, minimal, confident.
 *   LEFT  (250)  — Recent chats + New Chat + Ambient sounds
 *   MAIN        — Chat with SVG orbital avatar, dark bg, fuchsia accent
 *
 * All chat logic preserved from V2 foundation.
 * Visual: v8 prototype (dark theme, 3D orbital avatar, comet tails, minimal icons).
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { trackCTA, trackNexusFirstMessageSent, trackNexusChatInitiation } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { buildNexusSystemPrompt, buildNexusFirstResponse, NEXUS_FIRST_RESPONSE_QUICK_REPLIES } from '@/nexus/nexusKnowledge';
import { buildLocalAssessmentContextForNexus, getAssessmentProgress, recommendNextAssessment } from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
  promptText?: string;
}

const GUEST_MESSAGE_LIMIT = 999;
const GUEST_STORAGE_KEY = 'nexus_guest_messages';
const QUICK_REPLIES = NEXUS_FIRST_RESPONSE_QUICK_REPLIES;

/* ── Dark theme tokens ── */
const T = {
  bg: '#0e0e0e', bg2: '#111111', bg3: '#151515',
  srf: '#171717', srf2: '#1c1c1c',
  bdr: 'rgba(255,255,255,0.05)', bdr2: 'rgba(255,255,255,0.09)',
  tx: '#d8d8d8', tx2: '#777777', tx3: '#444444',
  wh: '#ffffff', wh2: '#aaaaaa', wh3: '#555555',
  fus: '#C108AB', fusDim: 'rgba(193,8,171,0.10)',
  teal: '#0EA5A0', ocean: '#2563EB',
  r: 12, rs: 7,
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif",
  logo: "'Crimson Pro', Georgia, 'Times New Roman', serif",
};

/* ── Dark markdown ── */
const darkMd = {
  a: ({ href, children }: any) => <a href={href} style={{ color: T.teal, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ margin: '0 0 10px', lineHeight: 1.6, color: T.tx, fontFamily: T.font, fontSize: 14.5 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: T.logo, color: T.wh, fontSize: 20, margin: '4px 0 10px', fontWeight: 700 }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: T.logo, color: T.wh, fontSize: 18, margin: '4px 0 8px', fontWeight: 700 }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: T.logo, color: T.wh, fontSize: 15, margin: '4px 0 6px', fontWeight: 700 }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ color: T.wh, fontWeight: 600 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: T.tx2 }}>{children}</em>,
  ul: ({ children }: any) => <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>{children}</ul>,
  li: ({ children }: any) => <li style={{ color: T.tx, fontFamily: T.font, fontSize: 14.5, lineHeight: 1.6, marginBottom: 4 }}>{children}</li>,
};

function getGuestCount(): number {
  try { return parseInt(localStorage.getItem(GUEST_STORAGE_KEY) || '0', 10); } catch { return 0; }
}
function setGuestCount(count: number) {
  try { localStorage.setItem(GUEST_STORAGE_KEY, String(count)); } catch {}
}

/* ── Ambient sound icons (SVG line art) ── */
const AMBIENT_ICONS: Record<string, string> = {
  rain: '<svg viewBox="0 0 24 24"><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v6"/><path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25"/></svg>',
  coffee: '<svg viewBox="0 0 24 24"><path d="M17 8h1a4 4 0 010 8h-1"/><path d="M3 8h14v9a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M6 2v3"/><path d="M10 2v3"/><path d="M14 2v3"/></svg>',
  fire: '<svg viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"/></svg>',
  beach: '<svg viewBox="0 0 24 24"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
  forest: '<svg viewBox="0 0 24 24"><path d="M12 2L7 10h10L12 2z"/><path d="M12 8L5 18h14L12 8z"/><path d="M12 18v4"/></svg>',
};
const AMBIENT_SOUNDS = [
  { id: 'rain', label: 'Rain' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'fire', label: 'Fire' },
  { id: 'beach', label: 'Beach' },
  { id: 'forest', label: 'Forest' },
];

/* ── SVG Avatar constants ── */
const CX = 30, CY = 30;
const DOTS = [
  { rx:14, ry:7,   spd:.0020, sz:2.8, ph:0,   tilt:.55,  tailLen:35, tailSpace:.018 },
  { rx:18, ry:4.5, spd:.0014, sz:1.6, ph:2.3, tilt:-.44, tailLen:28, tailSpace:.016 },
  { rx:8,  ry:15,  spd:.0027, sz:1.1, ph:4.2, tilt:1.30, tailLen:22, tailSpace:.014 },
];
const TAIL_PAL = ['#C108AB','#D946EF','#A855F7','#7C3AED','#0EA5A0','#14B8A6','#0D9488','#2563EB','#3B82F6','#60A5FA'];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function h2r(h: string) {
  return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) };
}
function lc(a: string, b: string, t: number) {
  const c = h2r(a), d = h2r(b);
  return `rgb(${Math.round(lerp(c.r,d.r,t))},${Math.round(lerp(c.g,d.g,t))},${Math.round(lerp(c.b,d.b,t))})`;
}
function sampleGrad(f: number) {
  const i = f * (TAIL_PAL.length - 1), j = Math.floor(i);
  return lc(TAIL_PAL[j], TAIL_PAL[Math.min(j+1, TAIL_PAL.length-1)], i - j);
}

interface DotConfig {
  rx: number; ry: number; spd: number; sz: number; ph: number; tilt: number;
  tailLen: number; tailSpace: number;
  tailEls?: SVGCircleElement[]; mainEl?: SVGCircleElement;
}

function orbPos(d: DotConfig, ang: number) {
  const ex = d.rx * Math.cos(ang), ey = d.ry * Math.sin(ang);
  const ct = Math.cos(d.tilt), st = Math.sin(d.tilt);
  return { x: CX + ex*ct - ey*st, y: CY + ex*st + ey*ct, depth: Math.sin(ang) * Math.abs(Math.sin(d.tilt)) };
}
function orbTangent(d: DotConfig, ang: number) {
  const dex = -d.rx * Math.sin(ang), dey = d.ry * Math.cos(ang);
  const ct = Math.cos(d.tilt), st = Math.sin(d.tilt);
  const tx = dex*ct - dey*st, ty = dex*st + dey*ct;
  const len = Math.sqrt(tx*tx + ty*ty) || 1;
  return { x: tx/len, y: ty/len };
}

/* ── NEXUS Avatar Component ── */
function NexusAvatar() {
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
        const farCol = { r:80, g:40, b:70 };
        const nearCol = { r:255, g:100, b:220 };
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
          const f = j / (d.tailLen - 1);
          const tailAng = ang - (j+1) * d.tailSpace * 8;
          const tp = orbPos(d, tailAng);
          const tDepthF = (tp.depth + 1) / 2;
          const dist = (j + 1) * d.tailSpace * (d.rx + d.ry) * 0.65;
          const wave = Math.sin(t * 0.001 + j * 0.35) * (0.2 + f * 1.2);
          const txP = mp.x + backX * dist + perpX * wave;
          const tyP = mp.y + backY * dist + perpY * wave;
          const tailSz = mainR * Math.max(0.04, 1 - f * 0.94);
          const gradCol = sampleGrad(f);
          const gc = h2r(gradCol);
          const depthBright = 0.5 + 0.5 * tDepthF;
          const fr = Math.round(gc.r * depthBright + 255 * (1 - depthBright) * 0.1);
          const fg = Math.round(gc.g * depthBright + 255 * (1 - depthBright) * 0.05);
          const fb = Math.round(gc.b * depthBright + 255 * (1 - depthBright) * 0.08);
          const baseOp = 0.52 * Math.pow(1 - f, 1.2);
          const depthOp = 0.4 + 0.6 * tDepthF;
          const op = Math.max(0.003, baseOp * depthOp);

          const el = d.tailEls![j];
          el.setAttribute('cx', txP.toFixed(2));
          el.setAttribute('cy', tyP.toFixed(2));
          el.setAttribute('r', Math.max(0.05, tailSz).toFixed(3));
          el.setAttribute('fill', `rgb(${Math.min(255,fr)},${Math.min(255,fg)},${Math.min(255,fb)})`);
          el.setAttribute('opacity', op.toFixed(3));
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);

    return () => { cancelAnimationFrame(rafRef.current); while (svg.firstChild) svg.removeChild(svg.firstChild); };
  }, []);

  return <svg ref={svgRef} viewBox="0 0 60 60" style={{ width: '100%', height: '100%', overflow: 'visible' }} />;
}

/* ── Main Page ── */
export function NEXUSPage() {
  const { user, profile } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const assessmentProgress = useMemo(() => getAssessmentProgress(), []);
  const nextRecommendation = useMemo(() => recommendNextAssessment(), []);

  const [messages, setMessages] = useState<Message[]>(() => {
    const base = buildNexusFirstResponse(profile?.name);
    let greeting = base;
    if (assessmentProgress.completed > 0) {
      const progressLine = `\n\nYou've completed ${assessmentProgress.completed} of ${assessmentProgress.total} assessments on this device.`;
      let recLine = '';
      if (nextRecommendation) recLine = `\nBased on your history, I'd suggest **${nextRecommendation.name}** next — ${nextRecommendation.reason}`;
      greeting = base + progressLine + recLine;
    }
    return [{ role: 'assistant', content: greeting }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCountState] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const firstMessageSentRef = useRef(false);

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
      `Ground your answer in this instrument. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const localAssessmentContext = useMemo(() => buildLocalAssessmentContextForNexus(), []);
  const combinedContext = [lensContext, localAssessmentContext.contextString].filter(Boolean).join('\n\n');
  const systemPrompt = useMemo(() => buildNexusSystemPrompt(combinedContext).systemPrompt, [combinedContext]);

  const isGuest = !user;
  const remaining = isGuest ? Math.max(0, GUEST_MESSAGE_LIMIT - guestCount) : Infinity;
  const showGuestLimit = isGuest && guestCount >= GUEST_MESSAGE_LIMIT;

  useEffect(() => { trackNexusChatInitiation('direct_link'); }, []);
  useEffect(() => { if (isGuest) setGuestCountState(getGuestCount()); }, [isGuest]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading || showGuestLimit) return;
    if (!firstMessageSentRef.current) {
      firstMessageSentRef.current = true;
      trackNexusFirstMessageSent({ tier: 'explorer', source: 'nexus_chat' });
    }
    if (isGuest) {
      const c = getGuestCount() + 1;
      setGuestCount(c); setGuestCountState(c);
    }
    const userMsg: Message = { role: 'user', content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
    setLoading(true);
    try {
      const fullHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(msgText, fullHistory, systemPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      reportError(e, { context: 'nexus_chat_send' });
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment.", isError: true }]);
    }
    setLoading(false);
  }, [input, loading, showGuestLimit, isGuest, messages, systemPrompt]);

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
    setMessages([{ role: 'assistant', content: buildNexusFirstResponse(profile?.name) }]);
    setInput(''); firstMessageSentRef.current = false;
    if (inputRef.current) { inputRef.current.style.height = 'auto'; }
  };

  const showWelcome = messages.length <= 1 && !loading;

  /* ── Inline CSS (keyframe animations) ── */
  const styleId = 'nexus-v8-styles';
  useEffect(() => {
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      @keyframes nxFi{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
      @keyframes nxTp{0%,80%,100%{opacity:.3;transform:scale(.85)}40%{opacity:1;transform:scale(1)}}
      @keyframes nxBreatheBtn{0%,100%{transform:scale(1);opacity:.84}50%{transform:scale(1.03);opacity:1}}
      @keyframes nxBreatheGlow{0%,100%{border-color:rgba(255,255,255,0.09);box-shadow:none}50%{border-color:rgba(255,255,255,0.07);box-shadow:0 0 18px -7px rgba(193,8,171,0.05)}}
    `;
    document.head.appendChild(s);
    return () => { const el = document.getElementById(styleId); if (el) el.remove(); };
  }, []);

  return (
    <>
      <SEO title="NEXUS. — AI-Powered Leadership Intelligence" description="NEXUS is the AI-native leadership intelligence platform by LYC Partners." />
      <div style={{
        display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden',
        position: 'relative', zIndex: 1, fontFamily: T.font, background: T.bg, color: T.tx, fontSize: 15, lineHeight: 1.5,
        WebkitFontSmoothing: 'antialiased' as any,
      }}>
        {/* Background gradients */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse 120% 80% at 18% 12%, rgba(193,8,171,.025) 0%, transparent 55%),
            radial-gradient(ellipse 100% 100% at 82% 88%, rgba(14,165,160,.025) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(37,99,235,.015) 0%, transparent 65%)`,
        }} />

        {/* ── LEFT PANEL ── */}
        <aside style={{
          width: panelOpen ? 250 : 0, background: 'rgba(13,13,13,0.96)', backdropFilter: 'blur(20px)',
          borderRight: panelOpen ? `1px solid ${T.bdr}` : 'none', display: 'flex', flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s', overflow: 'hidden', flexShrink: 0,
          opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none',
        }}>
          <div style={{ height: 50, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.tx3, textTransform: 'uppercase' as const }}>Recent</span>
          </div>
          <button onClick={newChat} style={{
            margin: '8px 12px', padding: 7, borderRadius: T.rs, border: `1px solid ${T.bdr2}`,
            background: 'transparent', color: T.tx2, fontSize: 12, fontWeight: 500, cursor: 'pointer',
            textAlign: 'center' as const, fontFamily: T.font,
          }}>+ New Chat</button>
          <div style={{ flex: 1, overflowY: 'auto' as const, padding: 10 }}>
            {[{ t: 'Today', p: 'How does NEXUS work?' }, { t: 'Yesterday', p: 'AI for executive search' }, { t: 'Last Week', p: 'Tell me about your services' }].map((c, i) => (
              <div key={i} style={{ padding: '9px 11px', borderBottom: `1px solid ${T.bdr}`, cursor: 'pointer', borderRadius: T.rs, transition: 'background 0.15s' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: T.wh2, marginBottom: 1 }}>{c.t}</div>
                <div style={{ fontSize: 11, color: T.tx3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.p}</div>
              </div>
            ))}
          </div>
          {/* Ambient */}
          <div style={{ borderTop: `1px solid ${T.bdr}`, padding: '10px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.tx3, textTransform: 'uppercase' as const, marginBottom: 8 }}>Ambient</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
              {AMBIENT_SOUNDS.map(s => (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <button
                    onClick={() => setActiveSound(activeSound === s.id ? null : s.id)}
                    title={s.label}
                    style={{
                      width: 36, height: 36, borderRadius: 6, border: `1px solid ${activeSound === s.id ? 'rgba(193,8,171,0.18)' : T.bdr}`,
                      background: activeSound === s.id ? T.fusDim : 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeSound === s.id ? T.fus : T.tx3,
                      transition: 'all 0.2s', padding: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: AMBIENT_ICONS[s.id] }}
                  />
                  <span style={{ fontSize: 9, color: T.tx3 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          {/* Header */}
          <header style={{
            height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px', background: 'rgba(14,14,14,0.82)', backdropFilter: 'blur(24px)',
            borderBottom: `1px solid ${T.bdr}`, zIndex: 10, flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <button onClick={newChat} title="New Chat" style={{ width: 32, height: 32, borderRadius: T.rs, border: `1px solid ${T.bdr}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.wh3, padding: 0 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 5v14M5 12h14"/></svg>
              </button>
              <button onClick={() => setPanelOpen(!panelOpen)} title="Toggle Panel" style={{ width: 32, height: 32, borderRadius: T.rs, border: `1px solid ${T.bdr}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.wh3, padding: 0 }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              </button>
            </div>
            <h1 style={{ fontFamily: T.logo, fontSize: 18, fontWeight: 700, color: T.wh, letterSpacing: '0.01em', margin: 0 }}>
              NEXUS<span style={{ color: T.fus }}>.</span>
            </h1>
            <div />
          </header>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto' as const, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Welcome screen */}
            {showWelcome && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '24px 20px', gap: 8 }}>
                <div style={{ width: 44, height: 44 }}><NexusAvatar /></div>
                <div style={{ fontFamily: T.logo, fontSize: 24, fontWeight: 700, color: T.wh, letterSpacing: '0.02em' }}>
                  NEXUS<span style={{ color: T.fus }}>.</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 400, color: T.tx2, marginTop: 2 }}>How can I help?</div>
                {messages.length === 1 && !loading && !showGuestLimit && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, justifyContent: 'center', marginTop: 14, maxWidth: 380 }}>
                    {QUICK_REPLIES.map((reply, i) => (
                      <button key={i} onClick={() => send(reply)} style={{
                        padding: '6px 12px', borderRadius: T.rs, border: `1px solid ${T.bdr2}`, background: 'transparent',
                        color: T.tx2, fontSize: 12, fontWeight: 400, cursor: 'pointer', fontFamily: T.font,
                        transition: 'all 0.25s',
                      }}>
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Messages */}
            {!showWelcome && messages.map((msg, i) => {
              if (i === 0 && msg.role === 'assistant' && messages.length <= 2) return null;
              const isUser = msg.role === 'user';
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column',
                  maxWidth: isUser ? 660 : 600, alignSelf: isUser ? 'flex-end' : 'flex-start',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  animation: 'nxFi 0.3s ease',
                }}>
                  <div style={{
                    padding: '9px 14px', fontSize: 14.5, lineHeight: 1.6, wordWrap: 'break-word' as any, whiteSpace: 'pre-wrap' as any,
                    ...(isUser
                      ? { background: 'rgba(255,255,255,0.90)', color: '#111', borderRadius: `${T.r}px ${T.r}px 4px ${T.r}px`, boxShadow: '0 1px 3px rgba(0,0,0,0.12)' }
                      : { color: T.tx, paddingLeft: 0, paddingRight: 0 }
                    ),
                  }}>
                    {isUser ? msg.content : <ReactMarkdown remarkPlugins={[remarkGfm]} components={darkMd}>{msg.content}</ReactMarkdown>}
                  </div>
                </div>
              );
            })}

            {/* Loading */}
            {loading && (
              <div style={{ alignSelf: 'flex-start', animation: 'nxFi 0.3s ease' }}>
                <div style={{ padding: '9px 0', color: T.tx }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#3a3a3a', animation: `nxTp 1.2s ease-in-out infinite ${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Guest limit */}
            {showGuestLimit && (
              <div style={{ alignSelf: 'flex-start', maxWidth: 600, padding: 24, border: `1px solid ${T.bdr2}`, borderRadius: T.r, background: T.srf, animation: 'nxFi 0.3s ease' }}>
                <h3 style={{ fontFamily: T.logo, fontSize: 16, color: T.wh, margin: '0 0 8px', fontWeight: 700 }}>Unlock the full experience</h3>
                <p style={{ fontFamily: T.font, fontSize: 13, color: T.tx2, margin: '0 0 16px', lineHeight: 1.6 }}>
                  Create a profile for full NEXUS access, the 11-lens catalog, and saved conversation history.
                </p>
                <Link to="/signup" onClick={() => trackCTA({ location: 'nexus_chat', label: 'Create Account (guest limit CTA)', destination: '/signup' })} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: T.rs,
                  background: T.fus, color: '#fff', fontSize: 13, fontWeight: 500, textDecoration: 'none',
                }}>
                  Create profile <span>→</span>
                </Link>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{ padding: '8px 14px 16px', background: 'rgba(14,14,14,0.82)', backdropFilter: 'blur(24px)', borderTop: `1px solid ${T.bdr}`, flexShrink: 0 }}>
            <div style={{ maxWidth: 660, margin: '0 auto' }}>
              {isGuest && remaining > 0 && remaining < GUEST_MESSAGE_LIMIT && (
                <div style={{ textAlign: 'center' as const, marginBottom: 8, color: T.tx3, fontSize: 11 }}>
                  {remaining} complimentary message{remaining === 1 ? '' : 's'} remaining
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 7, background: T.srf,
                border: `1px solid ${T.bdr2}`, borderRadius: T.r, padding: '4px 4px 4px 14px',
                transition: 'border-color 0.3s, box-shadow 0.3s', animation: 'nxBreatheGlow 4s ease-in-out infinite',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder={showGuestLimit ? 'Create a profile to continue...' : 'Message Nexus\u2026'}
                  disabled={showGuestLimit || loading}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5,
                    lineHeight: 1.5, resize: 'none', maxHeight: 100, padding: '5px 0', fontFamily: T.font,
                    color: T.tx,
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim() || showGuestLimit}
                  style={{
                    width: 30, height: 30, borderRadius: T.rs, border: 'none',
                    background: loading || !input.trim() || showGuestLimit ? '#222' : T.fus,
                    cursor: loading || !input.trim() || showGuestLimit ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s', padding: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center' as const, marginTop: 8, color: T.tx3, fontSize: 11, fontFamily: T.font }}>
                NEXUS may produce inaccurate information. Verify critical decisions.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default NEXUSPage;
