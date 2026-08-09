import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Users, TrendingUp, Award, CheckCircle, MessageCircle, Calendar, MapPin } from 'lucide-react';

interface PeerMatchInfo {
  id: string;
  name: string;
  role: string;
  organization: string;
  level: string;
  skills: string[];
  strengths: string[];
  developmentAreas: string[];
  rating: number;
  completedSessions: number;
  timezone?: string;
  availability: string;
  preferredMethodology?: string;
}

interface MatchScore {
  overall: number;
  skillAlignment: number;
  experienceComplement: number;
  personalityFit: number;
  availabilityMatch: number;
  diversityScore: number;
}

interface PeerMatchCardProps {
  peer: PeerMatchInfo;
  score: MatchScore;
  quality: string;
  onAccept: () => void;
  onDecline: () => void;
  onViewProfile: () => void;
  isSelected?: boolean;
}

const QUALITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  excellent: { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500' },
  good: { bg: 'bg-[#C108AB]', text: 'text-[#C108AB]', border: 'border-[#C108AB]' },
  fair: { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-500' },
  poor: { bg: 'bg-gray-400', text: 'text-gray-600', border: 'border-gray-400' },
};

export function PeerMatchCard({
  peer,
  score,
  quality,
  onAccept,
  onDecline,
  onViewProfile,
  isSelected = false,
}: PeerMatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const style = QUALITY_STYLES[quality] ?? QUALITY_STYLES.fair;

  const getInitials = (name: string) => name
    .split('')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      className={`border bg-white transition-all ${
        isSelected ? 'border-[#C108AB] border-2' : 'border-[#e8e6e3]'
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#C108AB] text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            {getInitials(peer.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-[#1a1a1a] truncate">{peer.name}</h4>
                <p className="text-xs text-[#555] truncate">{peer.role}</p>
                <p className="text-xs text-[#999] truncate">{peer.organization}</p>
              </div>
              <div className={`text-right flex-shrink-0 ml-2`}>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-[#1a1a1a]">{peer.rating}</span>
                </div>
                <span className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}>
                  {quality} match
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="border border-[#e8e6e3] p-2">
            <div className="text-xs text-[#555]">Overall</div>
            <div className="text-sm font-bold text-[#C108AB]">{Math.round(score.overall * 100)}%</div>
          </div>
          <div className="border border-[#e8e6e3] p-2">
            <div className="text-xs text-[#555]">Skills</div>
            <div className="text-sm font-bold text-[#C108AB]">{Math.round(score.skillAlignment * 100)}%</div>
          </div>
          <div className="border border-[#e8e6e3] p-2">
            <div className="text-xs text-[#555]">Personality</div>
            <div className="text-sm font-bold text-[#C108AB]">{Math.round(score.personalityFit * 100)}%</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {peer.skills.slice(0, 4).map((skill, i) => (
            <span
              key={i}
              className="px-2 py-0.5 bg-[rgba(193,8,171,0.08)] text-[#C108AB] text-xs"
            >
              {skill}
            </span>
          ))}
        </div>

        <motion.div
          initial={false}
          animate={{ height: showDetails ? 'auto' : 0, opacity: showDetails ? 1 : 0 }}
          className="overflow-hidden"
        >
          <div className="pt-4 mt-3 border-t border-[#e8e6e3] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#555] font-semibold">Strengths:</span>
              <ul className="mt-1 space-y-0.5">
                {peer.strengths.slice(0, 3).map((s, i) => (
                  <li key={i} className="text-[#1a1a1a] flex items-start gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-[#555] font-semibold">Development:</span>
              <ul className="mt-1 space-y-0.5">
                {peer.developmentAreas.slice(0, 3).map((d, i) => (
                  <li key={i} className="text-[#1a1a1a] flex items-start gap-1">
                    <TrendingUp className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-3 flex items-center gap-3 text-xs text-[#555]">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3" />
              {peer.completedSessions} sessions
            </span>
            {peer.timezone && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {peer.timezone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              Prefers {peer.preferredMethodology ?? 'GROW'}
            </span>
          </div>
        </motion.div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex-1 px-3 py-2 border border-[#e8e6e3] text-sm text-[#555] hover:border-[#C108AB] hover:text-[#C108AB] transition-colors"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
          <button
            onClick={onDecline}
            className="px-3 py-2 border border-[#e8e6e3] text-sm text-[#555] hover:border-red-500 hover:text-red-500 transition-colors"
          >
            Skip
          </button>
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-[#C108AB] text-white text-sm font-semibold hover:bg-[#A00790] transition-colors"
          >
            Connect
          </button>
        </div>
      </div>
    </motion.div>
  );
}
