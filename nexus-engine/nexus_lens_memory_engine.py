"""
NEXUS Lens + Memory + Recommendation Engine v1.0
Phase 4 | Wave 7

Three vertical layers added to the existing 5-layer horizontal stack:
- U0: User Intelligence (context, memory, milestones, artifacts)
- L0: Lens Intelligence (pattern→lens mapping, signal scoring)
- R1: Recommendation Engine (trust-aligned, card-based suggestions)

Integrates with the existing NexusDemoEngine from Wave 4.
"""

import json
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
from enum import IntEnum


# =============================================================================
# LENS CANON — 11 Diagnostic Instruments (Diagnostic Canon Package v1.0)
# =============================================================================

LENS_CANON = {
    "L01_CPI": {
        "name": "CPI",
        "full_name": "China Leadership Pipeline Index",
        "duration": "5mi",
        "tier": "Flagship",
        "pillar": "P1",
        "description": "Flagship 360° leadership pipeline assessment for China market leaders.",
        "min_trust_stage": 3,
        "complimentary": False,
        "is_flagship": True,
    },
    "L02_LEAP": {
        "name": "LEAP",
        "full_name": "Competitive Positioning",
        "duration": "1mi",
        "tier": "Light",
        "pillar": "P1",
        "description": "How strong is your competitive position in your market?",
        "min_trust_stage": 1,
        "complimentary": True,
    },
    "L03_COACH": {
        "name": "COACH",
        "full_name": "Executive Coaching Fit",
        "duration": "2mi",
        "tier": "Standard",
        "pillar": "P1",
        "description": "Are you ready to benefit from coaching, and what kind?",
        "min_trust_stage": 2,
        "complimentary": False,
    },
    "L04_PRISM": {
        "name": "PRISM",
        "full_name": "Professional Branding",
        "duration": "2mi",
        "tier": "Standard",
        "pillar": "P3",
        "description": "How does your professional brand land across four dimensions?",
        "min_trust_stage": 1,
        "complimentary": True,
    },
    "L05_IMPACT": {
        "name": "IMPACT",
        "full_name": "Board & Stakeholder Impact",
        "duration": "2mi",
        "tier": "Standard",
        "pillar": "P3",
        "description": "How effective are you with boards and key stakeholders?",
        "min_trust_stage": 2,
        "complimentary": False,
    },
    "L06_QUEST": {
        "name": "QUEST",
        "full_name": "Strategic Market Positioning",
        "duration": "2mi",
        "tier": "Standard",
        "pillar": "P3",
        "description": "How strong is your strategic positioning in your market?",
        "min_trust_stage": 2,
        "complimentary": False,
    },
    "L07_BRIDGE": {
        "name": "BRIDGE",
        "full_name": "Cross-Cultural Relational Intelligence",
        "duration": "3mi",
        "tier": "Signature",
        "pillar": "P2",
        "description": "How well do you navigate cross-cultural relationships?",
        "min_trust_stage": 3,
        "complimentary": False,
    },
    "L08_MOSAIC": {
        "name": "MOSAIC",
        "full_name": "Institutional Trust & Relationship Velocity",
        "duration": "3mi",
        "tier": "Signature",
        "pillar": "P2",
        "description": "How quickly and deeply do you build institutional trust?",
        "min_trust_stage": 3,
        "complimentary": False,
    },
    "L09_DRIVE": {
        "name": "DRIVE",
        "full_name": "Motivational Alignment",
        "duration": "2mi",
        "tier": "Standard",
        "pillar": "P2",
        "description": "Is your motivation aligned with your current path?",
        "min_trust_stage": 2,
        "complimentary": False,
    },
    "L10_SPARK": {
        "name": "SPARK",
        "full_name": "AI Leadership Readiness",
        "duration": "3mi",
        "tier": "Signature",
        "pillar": "P4",
        "description": "How ready are you to lead in an AI-transformed environment?",
        "min_trust_stage": 3,
        "complimentary": False,
    },
    "L11_FORGE": {
        "name": "FORGE",
        "full_name": "Sales Excellence Capability",
        "duration": "3mi",
        "tier": "Signature",
        "pillar": "P4",
        "description": "How strong is your sales and revenue generation capability?",
        "min_trust_stage": 3,
        "complimentary": False,
    },
}


# =============================================================================
# PATTERN → LENS AFFINITY MAPPING
# Score: 0=none, 1=tangential, 2=relevant, 3=diagnostic
# Only non-zero affinities listed
# =============================================================================

PATTERN_LENS_AFFINITY = {
    # === Career & Positioning Patterns (F-Series) ===
    "Invisible Value Syndrome": {"L02_LEAP": 3, "L04_PRISM": 3, "L06_QUEST": 2},
    "Commoditization Trap": {"L02_LEAP": 3, "L06_QUEST": 3, "L11_FORGE": 2, "L04_PRISM": 2},
    "Positioning Drift": {"L02_LEAP": 2, "L06_QUEST": 3, "L11_FORGE": 2, "L04_PRISM": 2},
    "Talent Market Arbitrage": {"L02_LEAP": 3, "L09_DRIVE": 2},
    "Reference Level Problem": {"L02_LEAP": 2, "L04_PRISM": 3, "L06_QUEST": 2},
    "Narrow Framing Problem": {"L02_LEAP": 2, "L04_PRISM": 2, "L06_QUEST": 2},
    "First 90 Days Pressure": {"L02_LEAP": 1, "L03_COACH": 2, "L05_IMPACT": 2},

    # === Coaching & Executive Dynamics (H-Series) ===
    "Executive Isolation": {"L03_COACH": 3, "L09_DRIVE": 3, "L05_IMPACT": 2},
    "Stuck Loop": {"L03_COACH": 3, "L09_DRIVE": 2, "L10_SPARK": 1},
    "The Ambiguity Gap": {"L03_COACH": 3, "L09_DRIVE": 2, "L02_LEAP": 1},
    "Action Addiction": {"L03_COACH": 3, "L09_DRIVE": 2, "L05_IMPACT": 1},
    "Imposter Syndrome Variant": {"L03_COACH": 2, "L04_PRISM": 1, "L09_DRIVE": 2},
    "Overfunctioning Trap": {"L03_COACH": 2, "L05_IMPACT": 2, "L08_MOSAIC": 1},
    "Decision Fatigue Cascade": {"L03_COACH": 2, "L10_SPARK": 2, "L05_IMPACT": 1},
    "Success Trap": {"L03_COACH": 2, "L09_DRIVE": 3, "L02_LEAP": 1},

    # === Stakeholder & Board (G+D Series) ===
    "Board Level Blind Spot": {"L05_IMPACT": 3, "L06_QUEST": 2},
    "Stakeholder Map Blind Spot": {"L05_IMPACT": 3, "L08_MOSAIC": 3},
    "Executive Presence Mismatch": {"L05_IMPACT": 3, "L04_PRISM": 3, "L07_BRIDGE": 2},
    "Strategic Narrative Gap": {"L05_IMPACT": 2, "L06_QUEST": 3, "L11_FORGE": 2},
    "The Preparation Paradox": {"L05_IMPACT": 2, "L03_COACH": 1},
    "Quiet Influence Problem": {"L05_IMPACT": 2, "L08_MOSAIC": 2},
    "Power Without Authority": {"L05_IMPACT": 2, "L08_MOSAIC": 2, "L10_SPARK": 1},
    "Trust Velocity Gap": {"L08_MOSAIC": 3, "L07_BRIDGE": 3, "L11_FORGE": 2},

    # === Cross-Cultural (B-Series) ===
    "Cultural Code Mismatch": {"L07_BRIDGE": 3, "L04_PRISM": 2, "L06_QUEST": 2},
    "Cross-Border Discount": {"L07_BRIDGE": 3, "L02_LEAP": 2, "L04_PRISM": 2},
    "Translation Engine Failure": {"L07_BRIDGE": 3, "L05_IMPACT": 1},
    "High-Context Low-Context Gap": {"L07_BRIDGE": 2, "L08_MOSAIC": 1},
    "Institutional Cultural Gap": {"L07_BRIDGE": 2, "L08_MOSAIC": 2, "L10_SPARK": 2},
    "Face Dynamics": {"L07_BRIDGE": 2, "L08_MOSAIC": 2, "L05_IMPACT": 1},
    "Global Local Tension": {"L07_BRIDGE": 2, "L05_IMPACT": 2},

    # === Trust & Relationships (MOSAIC patterns) ===
    "Relationship Equity Drain": {"L08_MOSAIC": 3, "L07_BRIDGE": 1},
    "The Transparency Paradox": {"L08_MOSAIC": 2, "L04_PRISM": 1},

    # === Motivation & Purpose (DRIVE patterns) ===
    "Motivational Drift": {"L09_DRIVE": 3, "L03_COACH": 2},
    "Plateau Paradox": {"L09_DRIVE": 3, "L02_LEAP": 1},

    # === AI & Transformation (E-Series) ===
    "AI Adoption Chasm": {"L10_SPARK": 3, "L06_QUEST": 1},
    "Digital Fluency Gap": {"L10_SPARK": 3, "L04_PRISM": 1},
    "AI Integration Blind Spot": {"L10_SPARK": 3, "L06_QUEST": 2},
    "Change Saturation Point": {"L10_SPARK": 3, "L03_COACH": 1},
    "Skill Obsolescence Curve": {"L10_SPARK": 2, "L02_LEAP": 2},

    # === Sales & Revenue (FORGE patterns) ===
    "Revenue Leak Blind Spot": {"L11_FORGE": 3, "L02_LEAP": 1},
    "Value Articulation Gap": {"L11_FORGE": 3, "L04_PRISM": 2},
    "Pipeline Velocity Problem": {"L11_FORGE": 3, "L08_MOSAIC": 1},
    "Relationship Conversion Gap": {"L11_FORGE": 3, "L08_MOSAIC": 2},

    # === Cross-Series Synthesis (meta-patterns) ===
    "Multi-Level Stuckness": {"L03_COACH": 2, "L09_DRIVE": 2, "L01_CPI": 2},
    "Trust-Capability Mismatch": {"L08_MOSAIC": 2, "L05_IMPACT": 2, "L01_CPI": 2},
    "Culture-Strategy Gap": {"L06_QUEST": 2, "L07_BRIDGE": 2, "L01_CPI": 2},
    "Visibility-Impact Gap": {"L04_PRISM": 2, "L05_IMPACT": 2, "L01_CPI": 2},
    "Adaptation-Identity Tension": {"L02_LEAP": 2, "L09_DRIVE": 2, "L01_CPI": 2},
    "Execution-Vision Disconnect": {"L06_QUEST": 2, "L10_SPARK": 2, "L01_CPI": 2},
}


# =============================================================================
# U0 — USER INTELLIGENCE
# =============================================================================

class TrustStage(IntEnum):
    INTRODUCTORY = 1
    WORKING = 2
    DEEP = 3
    PARTNER = 4


@dataclass
class LensResult:
    lens_id: str
    date_completed: str
    overall_score: Optional[float] = None
    dimension_scores: Dict[str, float] = field(default_factory=dict)
    key_findings: List[str] = field(default_factory=list)
    highest_dimension: Optional[str] = None
    biggest_gap: Optional[str] = None


@dataclass
class Milestone:
    id: str
    goal: str
    category: str  # career_transition / promotion / leadership / etc.
    priority: str = "medium"  # high / medium / low
    status: str = "not_started"  # not_started / in_progress / blocked / achieved
    target_date: Optional[str] = None
    sub_steps: List[Dict] = field(default_factory=list)


@dataclass
class SessionSummary:
    date: str
    scenario: str
    key_insights: List[str] = field(default_factory=list)
    patterns_identified: List[str] = field(default_factory=list)
    decisions_made: List[str] = field(default_factory=list)
    action_items: List[str] = field(default_factory=list)


class UserIntelligence:
    """
    U0 Layer — User Intelligence
    Structured user context: identity, artifacts, assessments, memory, milestones, trust
    """

    def __init__(self, user_id: str = "demo_user"):
        self.user_id = user_id

        # Identity
        self.name: Optional[str] = None
        self.role: Optional[str] = None
        self.company: Optional[str] = None
        self.level: Optional[str] = None
        self.industry: Optional[str] = None
        self.function: Optional[str] = None
        self.geography: Optional[str] = None
        self.career_stage: Optional[str] = None
        self.transition_status: Optional[str] = None
        self.key_people: List[str] = field(default_factory=list)

        # Artifacts
        self.artifacts: List[Dict] = []  # {type, name, date_uploaded, key_insights: []}

        # Assessment history
        self.lens_results: Dict[str, LensResult] = {}
        self.pending_lens_results: List[str] = []  # lenses completed but not yet debriefed

        # Conversation memory
        self.active_threads: List[Dict] = []  # {topic, phase, key_insights: [], next_step}
        self.session_history: List[SessionSummary] = []
        self.durable_insights: List[str] = []

        # Milestones
        self.milestones: List[Milestone] = []

        # Trust
        self.trust_score: int = 0
        self.trust_stage: TrustStage = TrustStage.INTRODUCTORY
        self.total_sessions: int = 0

        # Session-level tracking
        self.cards_shown_this_session: int = 0
        self.turns_since_last_card: int = 99
        self.dismissed_recommendations: List[str] = []  # recommendation IDs
        self.accepted_recommendations: List[str] = []

        # Current session patterns
        self.current_session_patterns: List[str] = []

    def is_lens_completed(self, lens_id: str) -> bool:
        return lens_id in self.lens_results

    def get_completed_lens_count(self) -> int:
        return len(self.lens_results)

    def get_active_milestones(self) -> List[Milestone]:
        return [m for m in self.milestones if m.status in ("in_progress", "blocked")]

    def add_pattern(self, pattern_name: str):
        """Track pattern identified in current session (deduplicated)"""
        if pattern_name not in self.current_session_patterns:
            self.current_session_patterns.append(pattern_name)

    def add_trust(self, points: int, reason: str = ""):
        """Add trust points and update stage"""
        self.trust_score += points
        self._update_trust_stage()

    def _update_trust_stage(self):
        """Update trust stage based on score + lens count"""
        score = self.trust_score
        lens_count = self.get_completed_lens_count()

        # Base thresholds on score
        if score < 6:
            stage = TrustStage.INTRODUCTORY
        elif score < 15:
            stage = TrustStage.WORKING
        elif score < 30:
            stage = TrustStage.DEEP
        else:
            stage = TrustStage.PARTNER

        # Lens count can boost stage
        if lens_count >= 3 and stage < TrustStage.DEEP:
            stage = TrustStage.DEEP
        if lens_count >= 6 and stage < TrustStage.PARTNER:
            stage = TrustStage.PARTNER

        self.trust_stage = stage

    def get_context_summary(self) -> Dict:
        """Get compressed context for prompt injection"""
        active_milestone = self.get_active_milestones()
        last_session = self.session_history[-1] if self.session_history else None

        return {
            "identity": {
                "name": self.name,
                "role": self.role,
                "company": self.company,
                "level": self.level,
                "industry": self.industry,
            },
            "active_milestone": active_milestone[0].goal if active_milestone else None,
            "last_session_summary": last_session.key_insights[:1] if last_session else None,
            "active_threads": [t["topic"] for t in self.active_threads[:3]],
            "lenses_completed": [
                {
                    "id": lid,
                    "name": LENS_CANON[lid]["name"],
                    "key_finding": res.key_findings[0] if res.key_findings else None,
                }
                for lid, res in list(self.lens_results.items())[-3:]
            ],
            "artifacts_count": len(self.artifacts),
            "trust_stage": self.trust_stage.name,
            "durable_insight": self.durable_insights[0] if self.durable_insights else None,
        }

    def to_dict(self) -> Dict:
        """Serialize full profile"""
        return {
            "user_id": self.user_id,
            "identity": {
                "name": self.name,
                "role": self.role,
                "company": self.company,
                "level": self.level,
                "industry": self.industry,
                "function": self.function,
                "geography": self.geography,
                "career_stage": self.career_stage,
                "transition_status": self.transition_status,
            },
            "trust_score": self.trust_score,
            "trust_stage": self.trust_stage.name,
            "total_sessions": self.total_sessions,
            "lenses_completed": list(self.lens_results.keys()),
            "active_milestones": [m.goal for m in self.get_active_milestones()],
            "durable_insights": self.durable_insights[:5],
        }


# =============================================================================
# L0 — LENS INTELLIGENCE
# =============================================================================

class LensScorer:
    """
    L0 Layer — Lens Intelligence
    Pattern→lens mapping, signal accumulation, threshold detection
    """

    # Signal thresholds
    THRESHOLD_DORMANT = (0, 2)
    THRESHOLD_BACKGROUND = (3, 4)
    THRESHOLD_ACTIVE = (5, 6)
    THRESHOLD_SUGGESTIBLE = 7  # and above

    def __init__(self):
        self.affinity_map = PATTERN_LENS_AFFINITY
        self.lens_canon = LENS_CANON

    def calculate_signals(self, activated_patterns: List[str]) -> Dict[str, int]:
        """
        Calculate lens signal strength from activated patterns.
        Each pattern contributes its affinity score per lens.
        Same pattern multiple times = only once (deduplicated).
        """
        signals = defaultdict(int)
        seen_patterns = set()

        for pattern in activated_patterns:
            if pattern in seen_patterns:
                continue
            seen_patterns.add(pattern)

            affinities = self.affinity_map.get(pattern, {})
            for lens_id, score in affinities.items():
                signals[lens_id] += score

        return dict(signals)

    def get_signal_level(self, signal: int) -> str:
        """Classify signal level: dormant / background / active / suggestible"""
        if signal >= self.THRESHOLD_SUGGESTIBLE:
            return "suggestible"
        elif signal >= self.THRESHOLD_ACTIVE[0]:
            return "active"
        elif signal >= self.THRESHOLD_BACKGROUND[0]:
            return "background"
        else:
            return "dormant"

    def get_suggestible_lenses(
        self,
        signals: Dict[str, int],
        user: UserIntelligence,
    ) -> List[Tuple[str, int]]:
        """
        Get list of lenses at suggestible threshold,
        filtered by: not already completed, trust stage allows.
        Returns sorted list of (lens_id, signal) pairs, highest signal first.
        """
        suggestible = []

        for lens_id, signal in signals.items():
            if signal < self.THRESHOLD_SUGGESTIBLE:
                continue
            if user.is_lens_completed(lens_id):
                continue

            lens = self.lens_canon.get(lens_id)
            if not lens:
                continue

            # Trust stage check
            min_stage = lens["min_trust_stage"]
            # One-stage-ahead rule: can suggest up to one stage above current
            max_allowed_stage = user.trust_stage + 1
            if min_stage > max_allowed_stage:
                continue

            suggestible.append((lens_id, signal))

        # Sort by signal descending
        suggestible.sort(key=lambda x: x[1], reverse=True)
        return suggestible

    def get_active_lenses(self, signals: Dict[str, int]) -> List[Tuple[str, int, str]]:
        """Get all lenses at active level or above, with signal and level"""
        active = []
        for lens_id, signal in signals.items():
            level = self.get_signal_level(signal)
            if level in ("active", "suggestible"):
                active.append((lens_id, signal, level))
        active.sort(key=lambda x: x[1], reverse=True)
        return active

    def generate_lens_suggestion_copy(
        self,
        lens_id: str,
        user_context: str = "",
    ) -> Dict[str, str]:
        """Generate card copy for a lens suggestion"""
        lens = self.lens_canon[lens_id]
        name = lens["name"]
        full = lens["full_name"]
        duration = lens["duration"]

        # Body copy varies by lens
        body_templates = {
            "L02_LEAP": "What you're describing — the gap between what you bring and how the market values it — is exactly what LEAP measures. It's a 10-minute competitive positioning read.",
            "L03_COACH": "The pattern you're stuck in is exactly what COACH diagnoses. It's a 20-minute coaching fit assessment that tells you what kind of support would move you fastest.",
            "L04_PRISM": "The gap between how you see your contribution and how stakeholders perceive it is exactly what PRISM measures. It's a 20-minute professional branding diagnostic.",
            "L05_IMPACT": "What you're describing about stakeholder dynamics and board-level visibility is exactly what IMPACT measures. It's a 20-minute board and stakeholder impact assessment.",
            "L06_QUEST": "The positioning challenge you're describing — where you play and how you win — is exactly what QUEST diagnoses. It's a 20-minute strategic market positioning assessment.",
            "L07_BRIDGE": "The cross-cultural misalignment you're describing is exactly what BRIDGE measures. It's a 30-minute cross-cultural relational intelligence assessment.",
            "L08_MOSAIC": "The trust-building pattern you're describing — slow, effortful, harder than it should be — is exactly what MOSAIC diagnoses. It's a 30-minute institutional trust assessment.",
            "L09_DRIVE": "What you're describing — the gap between success and satisfaction — is exactly what DRIVE measures. It's a 20-minute motivational alignment assessment.",
            "L10_SPARK": "The AI leadership challenge you're describing — where to focus, how to lead through it — is exactly what SPARK diagnoses. It's a 30-minute AI leadership readiness assessment.",
            "L11_FORGE": "The revenue challenge you're describing — value that doesn't land, deals that stall — is exactly what FORGE measures. It's a 30-minute sales excellence assessment.",
        }

        body = body_templates.get(
            lens_id,
            f"What you're describing maps clearly to what {name} measures. It's a {duration} diagnostic instrument.",
        )

        return {
            "type": "lens_suggestion",
            "lens_id": lens_id,
            "title": f"Run {name} — {full}",
            "body": body,
            "action_label": "Run it now",
            "dismiss_label": "Not now",
        }


# =============================================================================
# R1 — RECOMMENDATION ENGINE
# =============================================================================

@dataclass
class RecommendationCard:
    id: str
    type: str  # lens_suggestion / lens_debrief / coaching_session / advisory_session / workshop / team
    title: str
    body: str
    action_label: str
    dismiss_label: str = "Not now"
    priority: int = 0  # higher = shown first
    lens_id: Optional[str] = None


class RecommendationEngine:
    """
    R1 Layer — Recommendation Engine
    Trust-aligned, card-based suggestion system
    6 recommendation types, gated by trust stage and cadence rules
    """

    # Priority ranking (higher = shown first)
    PRIORITY = {
        "lens_debrief": 100,
        "milestone_deadline": 90,
        "lens_suggestion": 50,
        "coaching_session": 40,
        "advisory_session": 30,
        "workshop": 20,
        "team_recommendation": 10,
    }

    # Cadence rules
    MAX_CARDS_PER_SESSION = 3
    MIN_TURNS_BETWEEN_CARDS = 3
    MAX_LENS_SUGGESTIONS_PER_SESSION = 2

    def __init__(self, user: UserIntelligence, lens_scorer: LensScorer):
        self.user = user
        self.lens_scorer = lens_scorer

    def evaluate_all(
        self,
        conversation_context: Dict,
        lens_signals: Dict[str, int],
    ) -> List[RecommendationCard]:
        """
        Evaluate all 6 recommendation types.
        Returns list of candidate cards (may be empty).
        Does NOT apply cadence rules — call select_card() for that.
        """
        candidates = []

        # Type 2: Lens debrief (highest priority)
        debrief_cards = self._check_lens_debrief()
        candidates.extend(debrief_cards)

        # Type 1: Lens suggestions
        lens_cards = self._check_lens_suggestions(lens_signals, conversation_context)
        candidates.extend(lens_cards)

        # Type 3: Executive coaching session
        if self.user.trust_stage >= TrustStage.WORKING:
            coaching_cards = self._check_coaching_session(conversation_context)
            candidates.extend(coaching_cards)

        # Type 4: Advisory working session
        if self.user.trust_stage >= TrustStage.DEEP:
            advisory_cards = self._check_advisory_session(conversation_context)
            candidates.extend(advisory_cards)

        # Type 5 & 6: Workshops + team recommendations
        if self.user.trust_stage >= TrustStage.PARTNER:
            workshop_cards = self._check_workshops(conversation_context)
            team_cards = self._check_team_recommendations(conversation_context)
            candidates.extend(workshop_cards)
            candidates.extend(team_cards)

        # Filter out dismissed recommendations
        candidates = [
            c for c in candidates
            if c.id not in self.user.dismissed_recommendations
        ]

        return candidates

    def select_card(
        self,
        candidates: List[RecommendationCard],
    ) -> Optional[RecommendationCard]:
        """
        Select at most one card to show.
        Applies cadence rules and priority ordering.
        """
        if not candidates:
            return None

        # Cadence: max cards per session
        if self.user.cards_shown_this_session >= self.MAX_CARDS_PER_SESSION:
            return None

        # Cadence: min turns between cards
        if self.user.turns_since_last_card < self.MIN_TURNS_BETWEEN_CARDS:
            return None

        # Sort by priority descending
        candidates.sort(key=lambda c: c.priority, reverse=True)

        # Return top candidate
        return candidates[0]

    def _check_lens_debrief(self) -> List[RecommendationCard]:
        """Type 2: Lens results are ready — offer debrief"""
        cards = []
        for lens_id in self.user.pending_lens_results:
            lens = self.lens_scorer.lens_canon[lens_id]
            card_id = f"debrief_{lens_id}"
            if card_id in self.user.dismissed_recommendations:
                continue

            cards.append(RecommendationCard(
                id=card_id,
                type="lens_debrief",
                lens_id=lens_id,
                title=f"{lens['name']} results are ready",
                body=(
                    f"Your {lens['name']} assessment is complete. "
                    f"Want to walk through what it shows — the patterns, "
                    f"the gaps, and what it means for what you're working on?"
                ),
                action_label="See results",
                dismiss_label="Later",
                priority=self.PRIORITY["lens_debrief"],
            ))
        return cards

    def _check_lens_suggestions(
        self,
        signals: Dict[str, int],
        conversation_context: Dict,
    ) -> List[RecommendationCard]:
        """Type 1: Lens suggestions based on signal strength"""
        cards = []
        suggestible = self.lens_scorer.get_suggestible_lenses(signals, self.user)

        # Limit lens suggestions per session
        lens_suggestions_shown = sum(
            1 for rec in self.user.accepted_recommendations + self.user.dismissed_recommendations
            if rec.startswith("lens_suggestion_")
        )
        remaining = self.MAX_LENS_SUGGESTIONS_PER_SESSION - lens_suggestions_shown

        for lens_id, signal in suggestible[:max(0, remaining)]:
            card_id = f"lens_suggestion_{lens_id}"
            if card_id in self.user.dismissed_recommendations:
                continue

            copy = self.lens_scorer.generate_lens_suggestion_copy(
                lens_id,
                conversation_context.get("last_user_message", ""),
            )
            cards.append(RecommendationCard(
                id=card_id,
                type="lens_suggestion",
                lens_id=lens_id,
                title=copy["title"],
                body=copy["body"],
                action_label=copy["action_label"],
                dismiss_label=copy["dismiss_label"],
                priority=self.PRIORITY["lens_suggestion"] + signal,  # higher signal = higher priority
            ))

        return cards

    def _check_coaching_session(self, context: Dict) -> List[RecommendationCard]:
        """Type 3: Executive coaching session suggestion"""
        # Trigger: deep conversation (5+ turns in scenario) + complex pattern (3+ patterns)
        turn_count = context.get("turn_count", 0)
        pattern_count = len(self.user.current_session_patterns)
        scenario_active = context.get("scenario_phase", "") in ("deepening", "synthesis")

        if turn_count >= 5 and pattern_count >= 3 and scenario_active:
            card_id = "coaching_session_main"
            if card_id not in self.user.dismissed_recommendations:
                return [RecommendationCard(
                    id=card_id,
                    type="coaching_session",
                    title="Dedicated coaching session",
                    body=(
                        "What you're working through is complex enough that a focused 45-minute "
                        "coaching session might move it faster than working through it piecemeal."
                    ),
                    action_label="Book a session",
                    priority=self.PRIORITY["coaching_session"],
                )]
        return []

    def _check_advisory_session(self, context: Dict) -> List[RecommendationCard]:
        """Type 4: Advisory working session"""
        # Trigger: specific deliverable milestone + deadline within 4 weeks + 2+ sessions on it
        active_milestones = self.user.get_active_milestones()
        has_deliverable = any(
            m.category in ("presentation", "strategy_doc", "deliverable")
            for m in active_milestones
        )
        sessions_on_topic = len([
            s for s in self.user.session_history
            if context.get("scenario", "") in s.scenario
        ])

        if has_deliverable and sessions_on_topic >= 2:
            card_id = "advisory_session_main"
            if card_id not in self.user.dismissed_recommendations:
                return [RecommendationCard(
                    id=card_id,
                    type="advisory_session",
                    title="Advisory working session",
                    body=(
                        "Your milestone is approaching and there's a lot to shape. "
                        "A 90-minute working session would let us structure the full narrative and approach."
                    ),
                    action_label="Book working session",
                    priority=self.PRIORITY["advisory_session"],
                )]
        return []

    def _check_workshops(self, context: Dict) -> List[RecommendationCard]:
        """Type 5: Workshops (Partner stage only)"""
        # Simplified: check if user mentions team dynamics and is at Partner stage
        team_mentions = context.get("team_mention_count", 0)
        if team_mentions >= 2:
            card_id = "workshop_trust"
            if card_id not in self.user.dismissed_recommendations:
                return [RecommendationCard(
                    id=card_id,
                    type="workshop",
                    title="Team workshop — Institutional Trust",
                    body=(
                        "The trust pattern you're describing isn't just individual — "
                        "it's systemic across your team. A half-day workshop on institutional "
                        "trust building would give you tools you can deploy immediately."
                    ),
                    action_label="Learn more",
                    priority=self.PRIORITY["workshop"],
                )]
        return []

    def _check_team_recommendations(self, context: Dict) -> List[RecommendationCard]:
        """Type 6: Team recommendations (Partner stage only)"""
        team_mentions = context.get("team_mention_count", 0)
        if team_mentions >= 3:
            card_id = "team_mosaic"
            if card_id not in self.user.dismissed_recommendations:
                return [RecommendationCard(
                    id=card_id,
                    type="team_recommendation",
                    title="Team assessment — MOSAIC",
                    body=(
                        "Based on what you've described about your team dynamics, "
                        "running MOSAIC across the team would give you a clear map of "
                        "where trust is strong and where it's creating friction."
                    ),
                    action_label="Discuss team assessment",
                    priority=self.PRIORITY["team_recommendation"],
                )]
        return []

    def on_card_shown(self, card: RecommendationCard):
        """Track that a card was shown"""
        self.user.cards_shown_this_session += 1
        self.user.turns_since_last_card = 0

    def on_card_accepted(self, card: RecommendationCard):
        """Handle recommendation acceptance"""
        self.user.accepted_recommendations.append(card.id)
        self.user.add_trust(2, f"Accepted recommendation: {card.type}")

    def on_card_dismissed(self, card: RecommendationCard):
        """Handle recommendation dismissal"""
        self.user.dismissed_recommendations.append(card.id)
        # No trust penalty — dismissal doesn't affect trust

    def on_new_turn(self):
        """Call at the start of each new turn"""
        self.user.turns_since_last_card += 1


# =============================================================================
# INTEGRATED ENGINE — combines all layers
# =============================================================================

class NexusLensMemoryEngine:
    """
    Integrated Wave 7 engine: U0 + L0 + R1
    Wraps UserIntelligence, LensScorer, and RecommendationEngine.
    Provides a clean API for the demo to use.
    """

    def __init__(self, user_id: str = "demo_user"):
        self.user = UserIntelligence(user_id)
        self.lens_scorer = LensScorer()
        self.recommender = RecommendationEngine(self.user, self.lens_scorer)

    def process_turn(
        self,
        activated_patterns: List[str],
        conversation_context: Dict,
    ) -> Dict:
        """
        Process a conversation turn:
        1. Update user with new patterns
        2. Calculate lens signals
        3. Evaluate recommendations
        4. Return signals + card (if any)
        """
        # Update turn counter for cadence
        self.recommender.on_new_turn()

        # Track patterns
        for p in activated_patterns:
            self.user.add_pattern(p)

        # Calculate lens signals
        signals = self.lens_scorer.calculate_signals(activated_patterns)

        # Get active lenses
        active_lenses = self.lens_scorer.get_active_lenses(signals)

        # Get suggestible lenses
        suggestible = self.lens_scorer.get_suggestible_lenses(signals, self.user)

        # Evaluate recommendations
        candidates = self.recommender.evaluate_all(conversation_context, signals)
        selected_card = self.recommender.select_card(candidates)

        if selected_card:
            self.recommender.on_card_shown(selected_card)

        return {
            "lens_signals": signals,
            "active_lenses": active_lenses,
            "suggestible_lenses": suggestible,
            "recommendation_card": {
                "id": selected_card.id,
                "type": selected_card.type,
                "title": selected_card.title,
                "body": selected_card.body,
                "action_label": selected_card.action_label,
                "dismiss_label": selected_card.dismiss_label,
                "lens_id": selected_card.lens_id,
            } if selected_card else None,
            "user_context": self.user.get_context_summary(),
            "trust_stage": self.user.trust_stage.name,
            "trust_score": self.user.trust_score,
        }

    def complete_lens(self, lens_id: str, key_findings: List[str]):
        """Mark a lens as completed and add results to user profile"""
        result = LensResult(
            lens_id=lens_id,
            date_completed="today",
            key_findings=key_findings,
        )
        self.user.lens_results[lens_id] = result
        self.user.pending_lens_results.append(lens_id)
        self.user.add_trust(3, f"Completed lens: {lens_id}")

    def debrief_lens(self, lens_id: str):
        """Mark a lens as debriefed (remove from pending)"""
        if lens_id in self.user.pending_lens_results:
            self.user.pending_lens_results.remove(lens_id)

    def accept_card(self, card_id: str):
        """User accepted a recommendation card"""
        card = RecommendationCard(id=card_id, type="", title="", body="", action_label="")
        self.recommender.on_card_accepted(card)

    def dismiss_card(self, card_id: str):
        """User dismissed a recommendation card"""
        card = RecommendationCard(id=card_id, type="", title="", body="", action_label="")
        self.recommender.on_card_dismissed(card)

    def add_session(self, summary: SessionSummary):
        """Add a completed session to history"""
        self.user.session_history.append(summary)
        self.user.total_sessions += 1
        self.user.add_trust(1, "Session completed")
        self.user.cards_shown_this_session = 0
        self.user.turns_since_last_card = 0
        self.user.current_session_patterns = []

    def get_status(self) -> Dict:
        """Get current engine status for display"""
        return {
            "trust_stage": self.user.trust_stage.name,
            "trust_score": self.user.trust_score,
            "lenses_completed": len(self.user.lens_results),
            "sessions_completed": self.user.total_sessions,
            "active_patterns_count": len(self.user.current_session_patterns),
        }


# =============================================================================
# DEMO — quick test
# =============================================================================

def run_demo():
    """Run a quick demonstration of the engine"""
    engine = NexusLensMemoryEngine("kevin_demo")

    # Simulate a conversation where several patterns are activated
    patterns_turn1 = [
        "Invisible Value Syndrome",
        "Stakeholder Map Blind Spot",
        "Executive Presence Mismatch",
    ]

    context = {
        "turn_count": 4,
        "scenario_phase": "deepening",
        "scenario": "S22 Deep Diagnostic",
        "last_user_message": "I just don't think they see the full scope of what I do.",
        "team_mention_count": 0,
    }

    print("=" * 60)
    print("NEXUS Lens + Memory + Recommendation Engine — Demo")
    print("=" * 60)

    result = engine.process_turn(patterns_turn1, context)

    print(f"\nTrust Stage: {result['trust_stage']} (score: {result['trust_score']})")
    print(f"Active patterns: {len(patterns_turn1)}")

    print(f"\n📊 Lens Signals:")
    for lens_id, signal in sorted(result['lens_signals'].items(), key=lambda x: x[1], reverse=True):
        if signal >= 3:
            level = engine.lens_scorer.get_signal_level(signal)
            lens_name = LENS_CANON[lens_id]['name']
            bar = "█" * min(signal, 10) + "░" * max(0, 10 - signal)
            print(f"  {lens_name:10s} {bar} {signal}/10 ({level})")

    print(f"\n🎯 Suggestible Lenses:")
    if result['suggestible_lenses']:
        for lens_id, signal in result['suggestible_lenses']:
            print(f"  ✅ {LENS_CANON[lens_id]['name']} — signal {signal}")
    else:
        print("  None yet")

    print(f"\n💳 Recommendation Card:")
    if result['recommendation_card']:
        card = result['recommendation_card']
        print(f"  Type: {card['type']}")
        print(f"  Title: {card['title']}")
        print(f"  Body: {card['body']}")
        print(f"  Action: {card['action_label']} / {card['dismiss_label']}")
    else:
        print("  No card shown this turn")

    # Simulate lens completion
    print("\n" + "=" * 60)
    print("Simulating: User completes PRISM lens")
    print("=" * 60)
    engine.complete_lens("L04_PRISM", [
        "Stakeholder perception gap: self-rating 22% higher than others' perception",
        "Strong on substance, weak on visibility",
        "Cross-cultural brand dimension is the biggest gap",
    ])

    context2 = {
        "turn_count": 7,
        "scenario_phase": "synthesis",
        "scenario": "S22 Deep Diagnostic",
        "last_user_message": "OK I'm done, what do the results show?",
        "team_mention_count": 0,
    }

    patterns_turn2 = [
        "Invisible Value Syndrome",
        "Reference Level Problem",
    ]
    result2 = engine.process_turn(patterns_turn2, context2)

    print(f"\nTrust Stage: {result2['trust_stage']} (score: {result2['trust_score']})")
    print(f"Pending lens results: {engine.user.pending_lens_results}")

    print(f"\n💳 Recommendation Card (after lens completion):")
    if result2['recommendation_card']:
        card = result2['recommendation_card']
        print(f"  Type: {card['type']}")
        print(f"  Title: {card['title']}")
        print(f"  Body: {card['body']}")
    else:
        print("  No card")

    print("\n✅ Engine demo complete.")


if __name__ == "__main__":
    run_demo()
