/**
 * ArchetypeCard Component (T-101)
 * Reusable card showing archetype icon, name, instrument color, teaser, confidence.
 */

import React from 'react';
import { InstrumentId } from '@/types/assessment';
import { INSTRUMENT_COLORS } from '@/data/instrumentColors';

interface ArchetypeCardProps {
  name: string;
  instrument: InstrumentId;
  description: string;
  teaser: string;
  iconUrl?: string;
  confidence?: number;
  isTransitional?: boolean;
  blurred?: boolean;
  className?: string;
}

export const ArchetypeCard: React.FC<ArchetypeCardProps> = ({
  name,
  instrument,
  description,
  teaser,
  iconUrl,
  confidence,
  isTransitional = false,
  blurred = false,
  className = '',
}) => {
  const colors = INSTRUMENT_COLORS[instrument] ?? INSTRUMENT_COLORS.shift;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${blurred ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-1'} ${className}`}
      style={{
        borderColor: colors.main,
        backgroundColor: colors.light,
      }}
    >
      {/* Color accent bar */}
      <div className="h-1.5" style={{ backgroundColor: colors.main }} />
      
      <div className="p-5">
        {/* Icon */}
        <div className="mb-3 flex items-center gap-3">
          {iconUrl ? (
            <img src={iconUrl} alt={name} className="h-10 w-10" style={{ filter: `drop-shadow(0 1px 2px ${colors.main}40)` }} />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ backgroundColor: colors.main }}
            >
              {name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.dark }}>
              {instrument.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className={`text-sm leading-relaxed text-gray-700 ${blurred ? 'blur-[2px]' : ''}`}>
          {blurred ? teaser : description}
        </p>

        {/* Confidence indicator */}
        {confidence !== undefined && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${confidence * 100}%`, backgroundColor: colors.main }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}

        {/* Transitional badge */}
        {isTransitional && (
          <div className="mt-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Transitional
          </div>
        )}

        {/* Blur overlay */}
        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium shadow-md" style={{ color: colors.dark }}>
              Take assessment to reveal
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchetypeCard;
