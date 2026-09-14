/**
 * NEXUSPage — v8.1 DARK THEME (full-immersion demo)
 *
 * Design: dark, minimal, confident.
 *   LEFT  (250)  — New chat + recent + Ambient sounds
 *   MAIN         — Chat thread with SVG orbital avatar, fuchsia accent
 *
 * v8.1 fixes:
 *   - Route lives OUTSIDE MarketingLayout (no site nav/footer — full immersion)
 *   - Readable message surfaces (high-contrast bubbles)
 *   - Ambient icons properly stroked (were invisible on dark)
 *   - No guest message limit (private demo)
 *   - LLM calls go through /api/chat → Coze (NEXUS Demo bot, full persona)
 */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { sendChatMessage } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import { SEO } from '@/components/seo/SEO';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { trackNexusFirstMessageSent, trackNexusChatInitiation } from '@/analytics/eventTracker';
import { reportError } from '@/analytics/errorMonitor';
import { buildNexusSystemPrompt, buildNexusFirstResponse, NEXUS_FIRST_RESPONSE_QUICK_REPLIES } from '@/nexus/nexusKnowledge';
import { buildLocalAssessmentContextForNexus, getAssessmentProgress, recommendNextAssessment } from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const DEMO_UID_KEY = 'nexus_demo_uid';
const QUICK_REPLIES = NEXUS_FIRST_RESPONSE_QUICK_REPLIES;

/* ── Dark theme tokens (v8.1 — contrast-tuned) ── */
const T = {
  bg: '#0e0e0e',
  srf: '#171717',
  srf2: '#1c1c1c',
  aiBubble: '#191919',
  bdr: 'rgba(255,255,255,0.10)',
  bdr2: 'rgba(255,255,255,0.16)',
  tx: '#ececec',        // primary text — high contrast on #0e0e0e
  tx2: '#a8a8a8',       // secondary
  tx3: '#7d7d7d',       // tertiary / labels
  icon: '#c4c4c4',      // panel icons
  wh: '#ffffff',
  userBubble: '#efefef',
  userTx: '#111111',
  fus: '#C108AB',
  fusDim: 'rgba(193,8,171,0.14)',
  teal: '#2dd4bf',
  ocean: '#3B82F6',
  r: 12, rs: 7,
  font: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', system-ui, sans-serif",
  logo: "'Crimson Pro', Georgia, 'Times New Roman', serif",
};

/* ── Markdown rendering inside AI bubbles ── */
const darkMd = {
  a: ({ href, children }: any) => <a href={href} style={{ color: T.teal, textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">{children}</a>,
  p: ({ children }: any) => <p style={{ margin: '0 0 10px', lineHeight: 1.65, color: T.tx, fontFamily: T.font, fontSize: 14.5 }}>{children}</p>,
  h1: ({ children }: any) => <h1 style={{ fontFamily: T.logo, color: T.wh, fontSize: 20, margin: '4px 0 10px', fontWeight: 700 }}>{children}</h1>,
  h2: ({ children }: any) => <h2 style={{ fontFamily: T.logo, color: T.wh, fontSize: 18, margin: '4px 0 8px', fontWeight: 700 }}>{children}</h2>,
  h3: ({ children }: any) => <h3 style={{ fontFamily: T.logo, color: T.wh, fontSize: 15, margin: '4px 0 6px', fontWeight: 700 }}>{children}</h3>,
  strong: ({ children }: any) => <strong style={{ color: T.wh, fontWeight: 600 }}>{children}</strong>,
  em: ({ children }: any) => <em style={{ color: T.tx2 }}>{children}</em>,
  ul: ({ children }: any) => <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }: any) => <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }: any) => <li style={{ color: T.tx, fontFamily: T.font, fontSize: 14.5, lineHeight: 1.65, marginBottom: 5 }}>{children}</li>,
};

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

/* ── Ambient sound icons (SVG line art, stroked for dark bg) ── */
const svgAttrs = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';
const AMBIENT_ICONS: Record<string, string> = {
  rain: `<svg ${svgAttrs}><path d="M16 13v8"/><path d="M8 13v8"/><path d="M12 15v6"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>`,
  coffee: `<svg ${svgAttrs}><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/><path d="M6 2v3"/><path d="M10 2v3"/><path d="M14 2v3"/></svg>`,
  fire: `<svg ${svgAttrs}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  beach: `<svg ${svgAttrs}><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>`,
  forest: `<svg ${svgAttrs}><path d="M12 2 7 10h10L12 2z"/><path d="M12 8 5 18h14L12 8z"/><path d="M12 18v4"/></svg>`,
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
  { rx: 14, ry: 7,   spd: .0020, sz: 2.8, ph: 0,   tilt: .55,  tailLen: 35, tailSpace: .018 },
  { rx: 18, ry: 4.5, spd: .0014, sz: 1.6, ph: 2.3, tilt: -.44, tailLen: 28, tailSpace: .016 },
  { rx: 8,  ry: 15,  spd: .0027, sz: 1.1, ph: 4.2, tilt: 1.30, tailLen: 22, tailSpace: .014 },
];
const TAIL_PAL = ['#C108AB', '#D946EF', '#A855F7', '#7C3AED', '#0EA5A0', '#14B8A6', '#0D9488', '#2563EB', '#3B82F6', '#60A5FA'];

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function h2r(h: string) {
  return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}
function sampleGrad(f: number) {
  const i = f * (TAIL_PAL.length - 1), j = Math.floor(i);
  const a = h2r(TAIL_PAL[j]), b = h2r(TAIL_PAL[Math.min(j + 1, TAIL_PAL.length - 1)]);
  return {
    r: Math.round(lerp(a.r, b.r, i - j)),
    g: Math.round(lerp(a.g, b.g, i - j)),
    b: Math.round(lerp(a.b, b.b, i - j)),
  };
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
          const f = j / (d.tailLen - 1);
          const tailAng = ang - (j + 1) * d.tailSpace * 8;
          const tp = orbPos(d, tailAng);
          const tDepthF = (tp.depth + 1) / 2;
          const dist = (j + 1) * d.tailSpace * (d.rx + d.ry) * 0.65;
          const wave = Math.sin(t * 0.001 + j * 0.35) * (0.2 + f * 1.2);
          const txP = mp.x + backX * dist + perpX * wave;
          const tyP = mp.y + backY * dist + perpY * wave;
          const tailSz = mainR * Math.max(0.04, 1 - f * 0.94);
          const gc = sampleGrad(f);
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
          el.setAttribute('fill', `rgb(${Math.min(255, fr)},${Math.min(255, fg)},${Math.min(255, fb)})`);
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

  const demoUid = useMemo(() => getDemoUid(), []);
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

  useEffect(() => { trackNexusChatInitiation('direct_link'); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = useCallback(async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || loading) return;
    if (!firstMessageSentRef.current) {
      firstMessageSentRef.current = true;
      trackNexusFirstMessageSent({ tier: 'explorer', source: 'nexus_chat' });
    }
    const userMsg: Message = { role: 'user', content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);
    try {
      const fullHistory = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const reply = await sendChatMessage(
        msgText,
        user?.id || demoUid,
        fullHistory,
        { systemPrompt, tier: 'explorer' },
      );
      const isErr = /having trouble connecting/i.test(reply);
      setMessages(prev => [...prev, { role: 'assistant', content: reply, isError: isErr }]);
    } catch (e: any) {
      reportError(e, { context: 'nexus_chat_send' });
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again in a moment.", isError: true }]);
    }
    setLoading(false);
  }, [input, loading, messages, systemPrompt, user, demoUid]);

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
    setInput('');
    firstMessageSentRef.current = false;
    if (inputRef.current) inputRef.current.style.height = 'auto';
    navigate('/nexus/chat', { replace: true });
  };

  const showQuickReplies = messages.length === 1 && messages[0].role === 'assistant' && !loading;

  /* ── Inline CSS (keyframe animations) ── */
  const styleId = 'nexus-v8-styles';
  useEffect(() => {
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = `
      @keyframes nxFi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      @keyframes nxTp{0%,80%,100%{opacity:.35;transform:scale(.85)}40%{opacity:1;transform:scale(1)}}
      @keyframes nxBreatheGlow{0%,100%{border-color:rgba(255,255,255,0.14)}50%{border-color:rgba(193,8,171,0.35);box-shadow:0 0 22px -8px rgba(193,8,171,0.25)}}
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
          background: `radial-gradient(ellipse 120% 80% at 18% 12%, rgba(193,8,171,.03) 0%, transparent 55%),
            radial-gradient(ellipse 100% 100% at 82% 88%, rgba(14,165,160,.03) 0%, transparent 50%),
            radial-gradient(ellipse 70% 50% at 50% 50%, rgba(37,99,235,.02) 0%, transparent 65%)`,
        }} />

        {/* ── LEFT PANEL ── */}
        <aside style={{
          width: panelOpen ? 250 : 0, background: 'rgba(13,13,13,0.96)', backdropFilter: 'blur(20px)',
          borderRight: panelOpen ? `1px solid ${T.bdr}` : 'none', display: 'flex', flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s', overflow: 'hidden', flexShrink: 0,
          opacity: panelOpen ? 1 : 0, pointerEvents: panelOpen ? 'auto' : 'none',
        }}>
          {/* Brand */}
          <div style={{ height: 54, display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px', borderBottom: `1px solid ${T.bdr}`, flexShrink: 0 }}>
            <div style={{ width: 22, height: 22, flexShrink: 0 }}><NexusAvatar /></div>
            <span style={{ fontFamily: T.logo, fontSize: 17, fontWeight: 700, color: T.wh, letterSpacing: '0.01em' }}>
              NEXUS<span style={{ color: T.fus }}>.</span>
            </span>
          </div>

          <button onClick={newChat} style={{
            margin: '10px 12px 6px', padding: '9px 10px', borderRadius: T.rs,
            border: `1px solid ${T.bdr2}`, background: 'transparent', color: T.tx, fontSize: 12.5, fontWeight: 500,
            cursor: 'pointer', textAlign: 'left' as const, fontFamily: T.font,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke={T.icon} strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New Chat
          </button>

          <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.tx3, textTransform: 'uppercase' as const }}>Recent</div>
          <div style={{ flex: 1, overflowY: 'auto' as const, padding: '4px 8px 10px' }}>
            {['How does NEXUS work?', 'APAC leadership benchmarking', 'Board narrative prep'].map((p, i) => (
              <div key={i} style={{ padding: '8px 10px', borderRadius: T.rs, cursor: 'pointer', color: T.tx2, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, transition: 'background 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                {p}
              </div>
            ))}
          </div>

          {/* Ambient */}
          <div style={{ borderTop: `1px solid ${T.bdr}`, padding: '12px 14px 14px', flexShrink: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: T.tx3, textTransform: 'uppercase' as const, marginBottom: 9 }}>Ambient</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 7 }}>
              {AMBIENT_SOUNDS.map(s => {
                const active = activeSound === s.id;
                return (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setActiveSound(active ? null : s.id)}
                      title={s.label}
                      style={{
                        width: 38, height: 38, borderRadius: 7,
                        border: `1px solid ${active ? 'rgba(193,8,171,0.55)' : T.bdr}`,
                        background: active ? T.fusDim : 'rgba(255,255,255,0.03)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: active ? '#f05ad4' : T.icon,
                        transition: 'all 0.2s', padding: 0,
                      }}
                      dangerouslySetInnerHTML={{ __html: AMBIENT_ICONS[s.id] }}
                    />
                    <span style={{ fontSize: 9.5, color: active ? T.tx2 : T.tx3 }}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
          {/* Slim internal header */}
          <header style={{
            height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 18px', background: 'rgba(14,14,14,0.82)', backdropFilter: 'blur(24px)',
            borderBottom: `1px solid ${T.bdr}`, zIndex: 10, flexShrink: 0,
          }}>
            <button onClick={() => setPanelOpen(!panelOpen)} title="Toggle panel" style={{ width: 32, height: 32, borderRadius: T.rs, border: `1px solid ${T.bdr}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.icon, padding: 0 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /></svg>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {!panelOpen && <div style={{ width: 20, height: 20 }}><NexusAvatar /></div>}
              <h1 style={{ fontFamily: T.logo, fontSize: 17, fontWeight: 700, color: T.wh, letterSpacing: '0.01em', margin: 0 }}>
                NEXUS<span style={{ color: T.fus }}>.</span>
              </h1>
            </div>
            <div style={{ width: 32 }} />
          </header>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto' as const }}>
            <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 18px 10px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={i} style={{
                    display: 'flex', alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%', animation: 'nxFi 0.3s ease',
                  }}>
                    <div style={{
                      padding: '11px 16px', fontSize: 14.5, lineHeight: 1.6,
                      wordWrap: 'break-word' as any, overflowWrap: 'anywhere' as any,
                      ...(isUser
                        ? {
                            background: T.userBubble, color: T.userTx,
                            borderRadius: `${T.r}px ${T.r}px 4px ${T.r}px`,
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                            whiteSpace: 'pre-wrap' as any,
                          }
                        : {
                            background: T.aiBubble, color: T.tx,
                            border: `1px solid ${T.bdr}`,
                            borderRadius: `${T.r}px ${T.r}px ${T.r}px 4px`,
                          }),
                      ...(msg.isError ? { borderColor: 'rgba(239,68,68,0.4)', color: '#fca5a5' } : {}),
                    }}>
                      {isUser
                        ? msg.content
                        : <ReactMarkdown remarkPlugins={[remarkGfm]} components={darkMd}>{msg.content}</ReactMarkdown>}
                    </div>
                  </div>
                );
              })}

              {/* Quick replies under the greeting */}
              {showQuickReplies && (
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, marginTop: 2, animation: 'nxFi 0.4s ease' }}>
                  {QUICK_REPLIES.map((reply, i) => (
                    <button key={i} onClick={() => send(reply)} style={{
                      padding: '8px 14px', borderRadius: T.rs, border: `1px solid ${T.bdr2}`,
                      background: 'rgba(255,255,255,0.03)', color: T.tx, fontSize: 12.5, fontWeight: 400,
                      cursor: 'pointer', fontFamily: T.font, transition: 'all 0.2s',
                    }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(193,8,171,0.5)'; e.currentTarget.style.color = '#f05ad4'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = T.bdr2; e.currentTarget.style.color = T.tx; }}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ alignSelf: 'flex-start', animation: 'nxFi 0.3s ease', background: T.aiBubble, border: `1px solid ${T.bdr}`, borderRadius: `${T.r}px ${T.r}px ${T.r}px 4px`, padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: T.tx3, animation: `nxTp 1.2s ease-in-out infinite ${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} style={{ height: 4 }} />
            </div>
          </div>

          {/* Input bar */}
          <div style={{ padding: '8px 18px 14px', background: 'rgba(14,14,14,0.9)', backdropFilter: 'blur(24px)', borderTop: `1px solid ${T.bdr}`, flexShrink: 0 }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: 8, background: T.srf,
                border: `1px solid ${T.bdr}`, borderRadius: T.r, padding: '5px 5px 5px 16px',
                transition: 'border-color 0.3s, box-shadow 0.3s', animation: 'nxBreatheGlow 5s ease-in-out infinite',
              }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Message NEXUS…"
                  disabled={loading}
                  rows={1}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5,
                    lineHeight: 1.5, resize: 'none', maxHeight: 100, padding: '6px 0', fontFamily: T.font,
                    color: T.tx,
                  }}
                />
                <button
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                  style={{
                    width: 32, height: 32, borderRadius: T.rs, border: 'none',
                    background: loading || !input.trim() ? '#262626' : T.fus,
                    cursor: loading || !input.trim() ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.2s', padding: 0,
                  }}
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" /><path d="M22 2 15 22 11 13 2 9 22 2Z" />
                  </svg>
                </button>
              </div>
              <p style={{ textAlign: 'center' as const, marginTop: 9, color: T.tx3, fontSize: 10.5, fontFamily: T.font, margin: '8px 0 0' }}>
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
