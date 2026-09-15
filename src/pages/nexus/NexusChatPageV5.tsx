import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { V1 } from '@/styles/v1-tokens';
import ChatRightRail from '@/components/nexus/ChatRightRail';
import { ConversationContextBar, DateSeparator } from '@/components/nexus/SingleConversationView';
import { sendChatMessageStream, NexusChatResponse } from '@/services/coze';
import { useAuthStore } from '@/stores/authStore';
import {
  buildNexusSystemPrompt,
  buildNexusFirstResponse,
  NEXUS_FIRST_RESPONSE_QUICK_REPLIES,
} from '@/nexus/nexusKnowledge';
import {
  buildLocalAssessmentContextForNexus,
  getAssessmentProgress,
  recommendNextAssessment,
} from '@/nexus/resultContextBuilder';
import { ASSESSMENT_CATALOG } from '@/assessments/catalog';
import { getAvailablePersonas } from '@/config/nexusPersonas';
import { reportError } from '@/analytics/errorMonitor';
import { NexusProfileGate, getSavedProfile, type NexusUserProfile } from './NexusProfileGate';
import {
  trackCTA,
  trackNexusChatInitiation,
  trackNexusFirstMessageSent,
} from '@/analytics/eventTracker';

// ─── iOS-inspired theme tokens ───────────────────────────────────────────────
const IOS = {
  bg: '#F5F5F7',          // iOS off-white
  panel: '#3A3632',       // warm charcoal
  divider: '#4A4640',     // warm gray divider
  dividerLight: '#5A5650',
  textDark: '#1D1D1F',    // on light bg
  textLight: '#F2EFEA',   // warm off-white on charcoal
  bubbleBot: '#FFFFFF',
  bubbleUser: '#E8E8ED',
  shadow: '0 1px 3px rgba(0,0,0,0.08)',
  teal: V1.teal600,
  tealDark: V1.teal700,
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface BotMessage {
  type: 'bot';
  id: string;
  paragraphs: string[];
  time: string;
  insights?: string;
  isStreaming?: boolean;
}

interface UserMessage {
  type: 'user';
  id: string;
  text: string;
  time: string;
}

interface SystemCard {
  type: 'system';
  id: string;
  label: string;
  title: string;
  pills?: string[];
  insight?: string;
}

interface MilestoneCard {
  type: 'milestone';
  id: string;
  title: string;
  dueDate: string;
  status: string;
}

interface DateSeparatorRow {
  type: 'date';
  id: string;
  date: string;
}

interface OptionChips {
  type: 'chips';
  id: string;
  options: string[];
}

interface TypingIndicator {
  type: 'typing';
  id: string;
}

type MessageRow =
  | BotMessage
  | UserMessage
  | SystemCard
  | MilestoneCard
  | DateSeparatorRow
  | OptionChips
  | TypingIndicator;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function nowTime(prefix: string): string {
  const d = new Date();
  const hh = d.getHours();
  const mm = d.getMinutes().toString().padStart(2, '0');
  const ampm = hh >= 12 ? 'PM' : 'AM';
  const h12 = ((hh + 11) % 12) + 1;
  return `${prefix} · ${h12}:${mm} ${ampm}`;
}

function todayLabel(): string {
  const d = new Date();
  const month = d.toLocaleString('en-US', { month: 'short' });
  return `Today · ${month} ${d.getDate()}, ${d.getFullYear()}`;
}

function toParagraphs(response: string): string[] {
  const paras = response
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.length > 0 ? paras : [response];
}

// ─── Avatars ─────────────────────────────────────────────────────────────────
function NexusAvatar({ size = 36 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${V1.teal500}, ${V1.teal800})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `2px solid rgba(255,255,255,0.15)`,
        // no outer ring
        position: 'relative',
      }}
    >
      <span style={{ color: '#fff', fontSize: size * 0.4, fontWeight: 700, fontFamily: V1.monoFont }}>
        N
      </span>
    </div>
  );
}

function HeaderOrbitAvatar() {
  return (
    <div style={{ position: 'relative', width: 28, height: 28 }}>
      <div
        style={{
          position: 'absolute',
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${V1.teal500}, ${V1.teal800})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: 3,
          left: 3,
          // orbit removed — static avatar
        }}
      >
        <span style={{ color: '#fff', fontSize: 9, fontWeight: 700, fontFamily: V1.monoFont }}>N</span>
      </div>
    </div>
  );
}

// ─── Message blocks ──────────────────────────────────────────────────────────
function BotMessageBlock({ msg }: { msg: BotMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ marginTop: 24, display: 'flex', gap: 10 }}
    >
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <NexusAvatar size={34} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            background: IOS.bubbleBot,
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: IOS.shadow,
            border: '1px solid #E5E5EA',
          }}
        >
          {msg.paragraphs.map((p, i) => (
            <p
              key={i}
              style={{
                fontFamily: V1.displayFont,
                fontSize: 16,
                lineHeight: V1.leadingBody,
                color: IOS.textDark,
                fontWeight: V1.fwRegular,
                margin: i === 0 ? '0 0 10px 0' : i === msg.paragraphs.length - 1 ? '10px 0 0 0' : '10px 0',
              }}
            >
              {p}
              {msg.isStreaming && i === msg.paragraphs.length - 1 && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 2,
                    height: 16,
                    background: V1.teal600,
                    marginLeft: 2,
                    verticalAlign: 'text-bottom',
                    animation: 'nexus-cursor-blink 0.8s step-end infinite',
                  }}
                />
              )}
            </p>
          ))}
        </div>
        {msg.insights && (
          <div
            style={{
              marginTop: 8,
              background: '#F0FAF8',
              borderRadius: 8,
              padding: '10px 14px',
              border: `1px solid ${V1.teal200}`,
              fontFamily: V1.bodyFont,
              fontSize: 13,
              color: V1.teal900,
              lineHeight: V1.leadingBody,
            }}
          >
            <span style={{ fontWeight: 600, fontFamily: V1.monoFont, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: V1.trackingMono }}>
              Insights
            </span>
            <br />
            {msg.insights}
          </div>
        )}
        <div
          style={{
            marginTop: 4,
            fontFamily: V1.monoFont,
            fontSize: '0.6rem',
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.ink400,
            lineHeight: V1.leadingLabel,
          }}
        >
          {msg.time}
        </div>
      </div>
    </motion.div>
  );
}

function UserMessageBlock({ msg }: { msg: UserMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'flex-end' }}
    >
      <div style={{ maxWidth: '75%' }}>
        <div
          style={{
            background: IOS.bubbleUser,
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: IOS.shadow,
            textAlign: 'right',
          }}
        >
          <span
            style={{
              fontFamily: V1.bodyFont,
              fontSize: 15,
              lineHeight: V1.leadingBody,
              color: IOS.textDark,
            }}
          >
            {msg.text}
          </span>
        </div>
        <div
          style={{
            marginTop: 4,
            textAlign: 'right',
            fontFamily: V1.monoFont,
            fontSize: '0.6rem',
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.ink400,
            lineHeight: V1.leadingLabel,
          }}
        >
          {msg.time}
        </div>
      </div>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        <UserAvatar size={34} />
      </div>
    </motion.div>
  );
}

const FALLBACK_OPTIONS = [
  'Tell me more about this',
  'What should I do next?',
  'Give me a specific example',
  'How does this compare to best practices?',
  'Others / None of the above',
];

function RollingOptionsPanel({
  chips,
  onSelect,
}: {
  chips: OptionChips;
  onSelect: (text: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Ensure exactly 5 options, 5th always "Others / None of the above"
  const options = useMemo(() => {
    const base = chips.options.length > 0 ? chips.options : FALLBACK_OPTIONS;
    const first4 = base.slice(0, 4);
    while (first4.length < 4) first4.push(FALLBACK_OPTIONS[first4.length]);
    return [...first4, 'Others / None of the above'];
  }, [chips.options]);

  const handleSelect = (opt: string) => {
    setExpanded(false);
    onSelect(opt);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.15 }}
      style={{ marginTop: 8, marginLeft: 44 }}
    >
      {/* Collapsed: ↓ pill */}
      <AnimatePresence>
        {!expanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => setExpanded(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 12px',
              border: '1px solid #E5E5EA',
              background: '#FFFFFF',
              borderRadius: 14,
              cursor: 'pointer',
              fontFamily: V1.bodyFont,
              fontSize: 12,
              color: V1.ink500,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = V1.teal400; e.currentTarget.style.color = V1.teal700; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E5EA'; e.currentTarget.style.color = V1.ink500; }}
          >
            <span style={{ fontSize: 10 }}>↓</span>
            <span>Options</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded: vertical panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{
              overflow: 'hidden',
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #E5E5EA',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {options.map((opt, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: i * 0.04 }}
                onClick={() => handleSelect(opt)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 14px',
                  border: 'none',
                  borderBottom: i < options.length - 1 ? '1px solid #F0F0F2' : 'none',
                  background: hoveredIdx === i ? '#F0FAF8' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: V1.bodyFont,
                  fontSize: 13,
                  color: hoveredIdx === i ? V1.teal700 : V1.ink700,
                  lineHeight: V1.leadingBody,
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
              >
                {opt}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SystemCardBlock({ card }: { card: SystemCard }) {
  return (
    <div
      style={{
        marginLeft: 44,
        marginTop: 20,
        marginBottom: 20,
        background: IOS.panel,
        padding: 22,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.teal300,
          lineHeight: V1.leadingLabel,
          fontWeight: V1.fwSemibold,
        }}
      >
        {card.label}
      </div>
      <div
        style={{
          fontFamily: V1.displayFont,
          fontSize: '1.1rem',
          fontWeight: V1.fwSemibold,
          color: IOS.textLight,
          marginTop: 8,
          marginBottom: 16,
          lineHeight: V1.leadingHeading,
        }}
      >
        {card.title}
      </div>
      {card.pills && card.pills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {card.pills.map((pill, i) => (
            <span
              key={i}
              style={{
                border: `1px solid ${V1.teal300}`,
                color: V1.teal300,
                fontFamily: V1.monoFont,
                fontSize: '0.6rem',
                letterSpacing: V1.trackingMono,
                textTransform: 'uppercase',
                padding: '4px 8px',
                borderRadius: 12,
                lineHeight: V1.leadingLabel,
              }}
            >
              {pill}
            </span>
          ))}
        </div>
      )}
      {card.insight && (
        <div
          style={{
            marginTop: card.pills && card.pills.length > 0 ? 16 : 0,
            fontFamily: V1.displayFont,
            fontSize: 15,
            fontStyle: 'italic',
            color: 'rgba(255,255,255,0.85)',
            lineHeight: V1.leadingBody,
          }}
        >
          {card.insight}
        </div>
      )}
    </div>
  );
}

function MilestoneCardBlock({ card }: { card: MilestoneCard }) {
  return (
    <div
      style={{
        marginLeft: 44,
        marginTop: 20,
        marginBottom: 20,
        border: `1px solid ${V1.teal200}`,
        background: V1.teal50,
        padding: 16,
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: V1.monoFont,
          fontSize: '0.7rem',
          letterSpacing: V1.trackingMono,
          textTransform: 'uppercase',
          color: V1.teal700,
          lineHeight: V1.leadingLabel,
          fontWeight: V1.fwSemibold,
        }}
      >
        MILESTONE
      </div>
      <div
        style={{
          fontFamily: V1.displayFont,
          fontSize: 18,
          color: V1.teal900,
          fontWeight: V1.fwSemibold,
          marginTop: 4,
          marginBottom: 8,
          lineHeight: V1.leadingHeading,
        }}
      >
        {card.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ fontFamily: V1.monoFont, fontSize: '0.65rem', letterSpacing: '0.02em', color: V1.ink600, lineHeight: V1.leadingLabel }}>
          {card.dueDate}
        </div>
        <div style={{ fontFamily: V1.monoFont, fontSize: '0.65rem', letterSpacing: V1.trackingMono, textTransform: 'uppercase', color: V1.teal700, lineHeight: V1.leadingLabel, fontWeight: V1.fwSemibold }}>
          {card.status}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <a href="#" style={{ fontFamily: V1.bodyFont, fontSize: 13, color: V1.teal700, textDecoration: 'none', fontWeight: V1.fwMedium, lineHeight: V1.leadingBody }}>
          View milestone →
        </a>
      </div>
    </div>
  );
}

function TypingIndicatorBlock() {
  return (
    <div style={{ marginTop: 24, marginLeft: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
      <NexusAvatar size={34} />
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[0, 160, 320].map((delay) => (
          <span
            key={delay}
            style={{
              width: 5,
              height: 5,
              background: V1.teal600,
              borderRadius: '50%',
              animation: `nexus-typing-bounce 1.1s infinite ease-in-out`,
              animationDelay: `${delay}ms`,
              display: 'inline-block',
            }}
          />
        ))}
        <span
          style={{
            fontFamily: V1.monoFont,
            fontSize: '0.6rem',
            letterSpacing: V1.trackingMono,
            textTransform: 'uppercase',
            color: V1.ink400,
            lineHeight: V1.leadingLabel,
            marginLeft: 4,
          }}
        >
          Thinking
        </span>
      </div>
    </div>
  );
}

// ─── Ambient Sound Panel ─────────────────────────────────────────────────────
const AMBIENT_SOUNDS: { name: string; url: string }[] = [
  { name: 'Rain', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8e5e6b8bc.mp3' },
  { name: 'Forest', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_a1c1f7e1f3.mp3' },
  { name: 'Cafe', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_d17153e883.mp3' },
  { name: 'Ocean', url: 'https://cdn.pixabay.com/audio/2022/03/11/audio_3e9df3c5c3.mp3' },
  { name: 'Fireplace', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_4e6b89e5b1.mp3' },
  { name: 'White Noise', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0629c50c28.mp3' },
];

const LS_SOUND_KEY = 'nexus_ambient_sound';
const LS_VOLUME_KEY = 'nexus_ambient_volume';

function AmbientSoundPanel() {
  const [open, setOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const saved = localStorage.getItem(LS_SOUND_KEY);
    return saved ? parseInt(saved, 10) || 0 : -1;
  });
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem(LS_VOLUME_KEY);
    return saved ? parseInt(saved, 10) : 50;
  });
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedIdx >= 0 && selectedIdx < AMBIENT_SOUNDS.length) {
      localStorage.setItem(LS_SOUND_KEY, String(selectedIdx));
    }
  }, [selectedIdx]);

  useEffect(() => {
    localStorage.setItem(LS_VOLUME_KEY, String(volume));
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100;
    }
  }, [volume, muted]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setSelectedIdx(-1);
    localStorage.removeItem(LS_SOUND_KEY);
  }, []);

  const selectSound = useCallback((idx: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (idx === selectedIdx) {
      stopSound();
      return;
    }
    setSelectedIdx(idx);
    const audio = new Audio(AMBIENT_SOUNDS[idx].url);
    audio.loop = true;
    audio.volume = muted ? 0 : volume / 100;
    audio.play().catch(() => {});
    audioRef.current = audio;
  }, [selectedIdx, volume, muted, stopSound]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Ambient sounds"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: '2px 6px',
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
      >
        🎵
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 8,
        background: IOS.panel,
        borderRadius: 12,
        padding: 16,
        width: 240,
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontFamily: V1.monoFont, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: V1.trackingMono, color: V1.teal300 }}>
          Ambient Sound
        </span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {AMBIENT_SOUNDS.map((s, i) => (
          <button
            key={i}
            onClick={() => selectSound(i)}
            style={{
              padding: '6px 8px',
              borderRadius: 8,
              border: `1px solid ${selectedIdx === i ? V1.teal500 : IOS.divider}`,
              background: selectedIdx === i ? 'rgba(0,180,160,0.15)' : 'transparent',
              color: selectedIdx === i ? V1.teal300 : '#AAA',
              fontFamily: V1.bodyFont,
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => setMuted((m) => !m)}
          style={{ background: 'none', border: 'none', color: muted ? '#666' : V1.teal300, cursor: 'pointer', fontSize: 16 }}
        >
          {muted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ flex: 1, accentColor: V1.teal600 }}
        />
        {selectedIdx >= 0 && (
          <button
            onClick={stopSound}
            style={{ background: 'none', border: 'none', color: '#F55', cursor: 'pointer', fontSize: 14 }}
            title="Stop"
          >
            ⏹
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── File Upload Button ──────────────────────────────────────────────────────
const ACCEPTED_UPLOAD_TYPES = 'application/pdf,.docx,.txt';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function FileUploadButton({
  userId,
  sessionId,
  onDocumentUploaded,
}: {
  userId: string;
  sessionId: string | null;
  onDocumentUploaded: (documentId: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      alert('File too large. Max 10MB.');
      return;
    }
    setUploading(true);
    try {
      // Upload to Supabase storage
      const path = `${userId}/${sessionId || 'default'}/${file.name}`;
      const uploadRes = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_doc',
          file_name: file.name,
          storage_path: path,
          file_data: await fileToBase64(file),
          session_id: sessionId,
        }),
      });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
      const data = await uploadRes.json();
      if (data.document_id) {
        onDocumentUploaded(data.document_id);
      }
    } catch (err) {
      console.error('[upload] Failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_UPLOAD_TYPES}
        onChange={handleFile}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Attach file (PDF, DOCX, TXT — max 10MB)"
        style={{
          background: 'none',
          border: 'none',
          cursor: uploading ? 'wait' : 'pointer',
          fontSize: 18,
          padding: '4px 8px',
          opacity: uploading ? 0.4 : 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
      >
        {uploading ? '⏳' : '📎'}
      </button>
    </>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Main component ──────────────────────────────────────────────────────────
export function NexusChatPageV5(): React.ReactElement {
  const [userProfile, setUserProfile] = useState<NexusUserProfile | null>(() => getSavedProfile());
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamingBotId, setStreamingBotId] = useState<string | null>(null);
  const [pendingDocIds, setPendingDocIds] = useState<string[]>([]);
  const { user, profile } = useAuthStore();
  const [searchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstMessageSentRef = useRef(false);
  const streamingRef = useRef<string>('');

  const codeParam = searchParams.get('code');

  const lensContext = useMemo(() => {
    if (!codeParam) return undefined;
    const info = ASSESSMENT_CATALOG[codeParam.toUpperCase()];
    if (!info) return undefined;
    const dimList = info.dimensions
      .map((d) => `${d.name} (${d.lowLabel} → ${d.highLabel})`)
      .join('; ');
    return [
      `=== CURRENT LENS CONTEXT ===`,
      `The user is asking about their ${info.name} (${info.code}) results.`,
      `Instrument measures ${info.dimensions.length} dimensions: ${dimList}.`,
      `Tagline: ${info.tagline}`,
      `Ground your answer in this instrument. Reference the specific dimensions by name when explaining findings.`,
    ].join('\n');
  }, [codeParam]);

  const localAssessmentContext = useMemo(() => buildLocalAssessmentContextForNexus(), []);
  const combinedContext = [lensContext, localAssessmentContext.contextString]
    .filter(Boolean)
    .join('\n\n');
  const systemPrompt = useMemo(
    () => buildNexusSystemPrompt(combinedContext).systemPrompt,
    [combinedContext],
  );

  const activeLensData = useMemo(() => {
    const pick = (code: string | undefined) => {
      if (!code) return undefined;
      const info = ASSESSMENT_CATALOG[code.toUpperCase()];
      if (!info) return undefined;
      return { code: info.code, name: info.b2cName || info.name, progress: 100 };
    };
    return pick(codeParam) || pick(localAssessmentContext.completedCodes[0]);
  }, [codeParam, localAssessmentContext]);

  const activePersona = useMemo(() => {
    const personas = getAvailablePersonas(profile?.tier);
    return personas[0];
  }, [profile?.tier]);

  const sessionId = useMemo(() => {
    return localStorage.getItem('nexus_session_id') || `session_${Date.now()}`;
  }, []);

  const userId = useMemo(() => {
    return user?.id || 'guest-' + (localStorage.getItem('nexus_guest_id') || Math.random().toString(36).slice(2));
  }, [user?.id]);

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = '44px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  };

  // Initialize thread
  useEffect(() => {
    trackNexusChatInitiation('direct_link');
    // Build personalized greeting from profile
    const profileContext = userProfile
      ? `Welcome, ${userProfile.name}. I've noted you're a ${userProfile.role} in ${userProfile.industry || 'your field'} at ${userProfile.location || 'your location'}. ${userProfile.challenge ? `Let's focus on ${userProfile.challenge.slice(0, 120)}` : "How can I help you today?"}`
      : '';
    const base = profileContext || buildNexusFirstResponse(profile?.name);
    const assessmentProgress = getAssessmentProgress();
    let greeting = base;
    if (assessmentProgress.completed > 0) {
      const progressLine = `\n\nYou've completed ${assessmentProgress.completed} of ${assessmentProgress.total} assessments on this device.`;
      let recLine = '';
      const nextRecommendation = recommendNextAssessment();
      if (nextRecommendation) {
        recLine = `\nBased on your history, I'd suggest **${nextRecommendation.name}** next — ${nextRecommendation.reason}`;
      }
      greeting = base + progressLine + recLine;
    }
    setMessages([
      { type: 'date', id: 'today', date: todayLabel() },
      { type: 'bot', id: 'welcome', paragraphs: toParagraphs(greeting), time: nowTime('NEXUS') },
      { type: 'chips', id: 'quick-replies', options: NEXUS_FIRST_RESPONSE_QUICK_REPLIES },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name, userProfile]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || inputValue).trim();
    if (!text || loading) return;
    if (messageText) {
      trackCTA({
        location: 'nexus_chat',
        label: 'Quick Reply',
        destination: undefined,
        context_id: messageText.slice(0, 80),
      });
    }
    const userMsg: UserMessage = {
      type: 'user',
      id: `u-${Date.now()}`,
      text,
      time: nowTime('You'),
    };
    const typingId = `t-${Date.now()}`;
    setMessages((prev) => {
      const cleaned = prev.filter((m) => m.type !== 'typing' && m.type !== 'chips');
      return [...cleaned, userMsg, { type: 'typing', id: typingId }];
    });
    setInputValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    setLoading(true);
    streamingRef.current = '';

    try {
      const history = messages
        .filter((m) => m.type === 'user' || m.type === 'bot')
        .slice(-10)
        .map((m) => ({
          role: m.type === 'user' ? 'user' : 'assistant',
          content: m.type === 'user' ? m.text : m.paragraphs.join('\n\n'),
        }));

      const botId = `b-${Date.now()}`;

      // Remove typing, add empty bot message for streaming
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId);
        return [
          ...withoutTyping,
          {
            type: 'bot' as const,
            id: botId,
            paragraphs: [''],
            time: nowTime('NEXUS'),
            isStreaming: true,
          },
        ];
      });
      setStreamingBotId(botId);

      let resultResponse: NexusChatResponse | null = null;

      resultResponse = await sendChatMessageStream(
        text,
        userId,
        history,
        systemPrompt ? { systemPrompt } : undefined,
        (token: string) => {
          streamingRef.current += token;
          // Update the streaming bot message with accumulated text
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, paragraphs: toParagraphs(streamingRef.current) }
                : m,
            ),
          );
        },
      );

      // Finalize bot message
      setMessages((prev) => {
        const finalParas = toParagraphs(resultResponse?.response || streamingRef.current);
        return prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                paragraphs: finalParas,
                isStreaming: false,
                insights: resultResponse?.insights,
              }
            : m,
        );
      });

      // Append rolling options panel after every bot reply (always 5 options)
      const prompts = resultResponse?.suggested_prompts || [];
      setMessages((prev) => [
        ...prev,
        { type: 'chips', id: `chips-${botId}`, options: prompts },
      ]);

      setStreamingBotId(null);
      streamingRef.current = '';

      if (!firstMessageSentRef.current) {
        firstMessageSentRef.current = true;
        trackNexusFirstMessageSent('coze-gpt-4o');
      }
    } catch (e) {
      reportError(e, { scope: 'nexus_v5:streamChat', severity: 'warning' });
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== typingId);
        return [
          ...withoutTyping.filter((m) => !m.id.startsWith('b-') || !('isStreaming' in m && m.isStreaming)),
          {
            type: 'bot',
            id: `b-err-${Date.now()}`,
            paragraphs: ['Something went wrong. Please try again in a moment.'],
            time: nowTime('NEXUS'),
          },
        ];
      });
      setStreamingBotId(null);
    }
    setLoading(false);
  };

  const handleChipSelect = (text: string) => {
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleDocumentUploaded = (documentId: string) => {
    setPendingDocIds((prev) => [...prev, documentId]);
  };

  // Profile gate: show form if no profile saved or user clicked Profile button
  if (!userProfile || showProfileForm) {
    return (
      <NexusProfileGate
        onComplete={(p) => {
          setUserProfile(p);
          setShowProfileForm(false);
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', gap: 0, minHeight: 'calc(100vh - 0px)' }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 0px)',
          position: 'relative',
          background: IOS.bg,
        }}
      >
        {/* Header */}
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: IOS.panel,
            borderBottom: `1px solid ${IOS.divider}`,
            padding: '10px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <HeaderOrbitAvatar />
            <div>
              <span
                style={{
                  fontFamily: V1.monoFont,
                  fontSize: '0.65rem',
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  color: V1.teal300,
                  lineHeight: V1.leadingLabel,
                  fontWeight: V1.fwSemibold,
                }}
              >
                Conversation
              </span>
              <span style={{ color: IOS.dividerLight, fontFamily: V1.bodyFont, margin: '0 6px' }}>·</span>
              <span
                style={{
                  fontFamily: V1.displayFont,
                  fontSize: 13,
                  fontStyle: 'italic',
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: V1.leadingBody,
                }}
              >
                Single continuous thread
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setShowProfileForm(true)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: V1.monoFont, fontSize: '0.65rem', letterSpacing: V1.trackingMono, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', lineHeight: V1.leadingLabel }}
            >
              Profile
            </button>
            <span style={{ color: IOS.dividerLight, fontFamily: V1.bodyFont }}>•</span>
            <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: V1.monoFont, fontSize: '0.65rem', letterSpacing: V1.trackingMono, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', lineHeight: V1.leadingLabel }}>
              Export
            </button>
            <span style={{ color: IOS.dividerLight, fontFamily: V1.bodyFont }}>•</span>
            <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: V1.monoFont, fontSize: '0.65rem', letterSpacing: V1.trackingMono, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', lineHeight: V1.leadingLabel }}>
              Share →
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 20px 20px 20px',
          }}
        >
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <ConversationContextBar />
            <AnimatePresence>
              {messages.map((row) => {
                switch (row.type) {
                  case 'date':
                    return <DateSeparator key={row.id} date={row.date} />;
                  case 'bot':
                    return <BotMessageBlock key={row.id} msg={row} />;
                  case 'user':
                    return <UserMessageBlock key={row.id} msg={row} />;
                  case 'chips':
                    return <RollingOptionsPanel key={row.id} chips={row} onSelect={handleChipSelect} />;
                  case 'system':
                    return <SystemCardBlock key={row.id} card={row} />;
                  case 'milestone':
                    return <MilestoneCardBlock key={row.id} card={row} />;
                  case 'typing':
                    return <TypingIndicatorBlock key={row.id} />;
                  default:
                    return null;
                }
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Input area */}
        <div
          style={{
            flexShrink: 0,
            borderTop: `1px solid #E5E5EA`,
            background: '#FFFFFF',
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  autoGrow(e.target);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Write to Nexus…"
                rows={1}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  border: '1px solid rgba(0,0,0,0.04)',
                  borderRadius: 22,
                  padding: '11px 14px',
                  fontFamily: V1.bodyFont,
                  fontSize: 15,
                  color: IOS.textDark,
                  lineHeight: V1.leadingBody,
                  minHeight: 44,
                  maxHeight: 200,
                  resize: 'vertical',
                  outline: 'none',
                  background: IOS.bg,
                  transition: `border-color ${V1.durFast}ms ${V1.ease}`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(0,180,160,0.2)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.04)')}
              />
              <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileUploadButton
                  userId={userId}
                  sessionId={sessionId}
                  onDocumentUploaded={handleDocumentUploaded}
                />
                {pendingDocIds.length > 0 && (
                  <span style={{ fontFamily: V1.monoFont, fontSize: '0.6rem', color: V1.teal600, textTransform: 'uppercase' }}>
                    {pendingDocIds.length} doc{pendingDocIds.length > 1 ? 's' : ''} attached
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <button
                onClick={sendMessage}
                style={{
                  alignSelf: 'flex-end',
                  padding: '10px 18px',
                  background: V1.ink900,
                  color: V1.white,
                  fontFamily: V1.monoFont,
                  fontSize: '0.65rem',
                  letterSpacing: V1.trackingMono,
                  textTransform: 'uppercase',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  lineHeight: V1.leadingLabel,
                  fontWeight: V1.fwSemibold,
                  transition: `background-color ${V1.durFast}ms ${V1.ease}`,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = V1.teal900)}
                onMouseLeave={(e) => (e.currentTarget.style.background = V1.ink900)}
              >
                Send
              </button>
              <AmbientSoundPanel />
            </div>
          </div>
        </div>
      </div>

      <ChatRightRail
        mode="regular"
        persona={activePersona}
        activeLens={activeLensData}
        recentMilestones={[]}
      />

      {/* Global keyframes */}
      <style>{`
        @keyframes nexus-typing-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes nexus-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        /* pulse & orbit animations removed — no tails */
      `}</style>
    </div>
  );
}

export default NexusChatPageV5;
