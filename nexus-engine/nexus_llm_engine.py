"""
NEXUS LLM Engine v1.0
Real LLM conversation with full 5-layer prompt architecture.

Wires the complete system prompt stack to a real LLM API,
with pattern retrieval, scenario routing, conversation memory,
and per-turn quality gate estimation.
"""

import json
import re
import os
import time
from pathlib import Path
from typing import List, Dict, Optional

try:
    import requests
except ImportError:
    requests = None

BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR.parent / "system_prompts"


class PromptAssembler:
    """Assembles the 5-layer system prompt stack at runtime."""

    def __init__(self):
        self._load_prompts()

    def _load_prompts(self):
        """Load all system prompt files from disk."""
        files = {
            "core": "01_core_master_prompt_v1.0.md",
            "quality": "02_quality_system_prompt_v1.0.md",
            "pattern_spec": "03_pattern_context_spec_v1.0.md",
            "scenarios": "04_scenario_controllers_v1.0.md",
            "turn_engine": "05_turn_engine_prompt_v1.0.md",
            "general_mode": "06_general_mode_prompt_v1.0.md",
        }
        self.prompts = {}
        for key, fname in files.items():
            path = PROMPTS_DIR / fname
            if path.exists():
                with open(path, "r", encoding="utf-8") as f:
                    self.prompts[key] = f.read()
            else:
                self.prompts[key] = f"[Missing: {fname}]"

    def build_system_prompt(self, scenario_id: str, patterns: List[Dict], 
                            persona: str = "Diagnostician") -> str:
        """Build full 5-layer system prompt for a given scenario and pattern set."""

        # Layer 1: Core Identity (with persona emphasis)
        l1 = self._build_layer1(persona)

        # Layer 2: Quality System (full)
        l2 = self.prompts["quality"]

        # Layer 3: Pattern Context (retrieved patterns)
        l3 = self._build_layer3(patterns)

        # Layer 4: Scenario Controller
        l4 = self._build_layer4(scenario_id)

        # Layer 5: Turn Engine (full)
        l5 = self.prompts["turn_engine"]

        # Assemble in order: L1 → L2 → L3 → L4 → L5
        full_prompt = f"""
{self._section_header("LAYER 1 — CORE IDENTITY", "Foundation")}
{l1}

{self._section_header("LAYER 2 — QUALITY SYSTEM", "Universal Constraints")}
{l2}

{self._section_header("LAYER 3 — PATTERN CONTEXT", "Retrieved Knowledge")}
{l3}

{self._section_header("LAYER 4 — SCENARIO CONTROLLER", "Active Scenario")}
{l4}

{self._section_header("LAYER 5 — TURN ENGINE", "Per-Turn Decision Logic")}
{l5}

---
INSTRUCTION: You are now NEXUS. Respond to the user's next message according to all five layers above.
Run the 12-gate quality check mentally before responding. If G12 Brand Voice is below 3.5, rewrite.
Do not reference your internal layers, patterns by name, or the quality system. Just be NEXUS.
"""
        return full_prompt.strip()

    def _build_layer1(self, persona: str) -> str:
        """Layer 1 with active persona emphasized."""
        core = self.prompts["core"]
        # Add persona emphasis note at the top
        persona_note = f"ACTIVE PERSONA MODE: {persona}\n\n"
        persona_note += "Your responses should carry the emphasis and angle of approach appropriate to this persona mode.\n"
        persona_note += "Do not announce or label the persona. Simply operate in that mode.\n\n"
        return persona_note + core

    def _build_layer3(self, patterns: List[Dict]) -> str:
        """Format retrieved patterns as Layer 3 context."""
        if not patterns:
            return "=== PATTERN CONTEXT ===\n\nNo patterns retrieved for this turn.\n\n=== END PATTERNS ==="

        lines = ["=== PATTERN CONTEXT ===\n"]
        for p in patterns:
            name = p.get("name", "Unnamed Pattern")
            cat = p.get("category", "Unknown")
            data = p.get("data_point", "")
            body = p.get("body", "")
            failure = p.get("failure_mode", "")
            activation = p.get("activation_trigger", "")

            # Compress body to 2 sentences
            body_sentences = re.split(r'(?<=[.!?])\s+', body.strip())
            body_compressed = ' '.join(body_sentences[:2])

            lines.append(f"[{name}] — {cat}")
            if activation:
                lines.append(f"Activation: {activation[:100]}")
            if data:
                lines.append(f"Data: {data[:120]}")
            lines.append(f"Core: {body_compressed[:200]}")
            if failure:
                lines.append(f"Failure mode: {failure[:100]}")
            lines.append("")

        lines.append("=== END PATTERNS ===")
        return '\n'.join(lines)

    def _build_layer4(self, scenario_id: str) -> str:
        """Extract the relevant scenario controller from the full file."""
        full = self.prompts["scenarios"]

        scenario_map = {
            "S1": "## GENERAL — S1: Career Crossroads",
            "S3": "## S3: Cross-Border Role",
            "S5": "## S5: Executive Isolation",
            "S7": "## S7: Boardroom Prep",
            "S9": "## S9: AI Transformation",
            "GENERAL": None,  # Use general mode file
        }

        if scenario_id == "GENERAL" or scenario_id not in scenario_map:
            return self.prompts["general_mode"]

        # Extract the scenario section
        marker = scenario_map[scenario_id]
        start = full.find(marker)
        if start == -1:
            return self.prompts["general_mode"]

        # Find the next scenario section marker
        next_section_pattern = re.compile(r'\n## (?:S\d+:|GENERAL —)')
        match = next_section_pattern.search(full, start + len(marker))
        if match:
            end = match.start()
        else:
            # Find "## Scenario Switching Rules"
            switch_idx = full.find("## Scenario Switching Rules", start)
            end = switch_idx if switch_idx != -1 else len(full)

        return full[start:end].strip()

    def _section_header(self, title: str, subtitle: str) -> str:
        line = "=" * 60
        return f"{line}\n{title}\n{subtitle.upper()}\n{line}"


class LLMClient:
    """LLM API client with support for multiple providers."""

    def __init__(self, api_key: str = None, base_url: str = None, model: str = None):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY", "")
        self.base_url = base_url or "https://api.deepseek.com/v1"
        self.model = model or "deepseek-chat"
        self.last_error = None

    def chat(self, messages: List[Dict], temperature: float = 0.7,
             max_tokens: int = 1024, stream: bool = False) -> Dict:
        """Send a chat completion request.

        Args:
            messages: List of {"role": "system"/"user"/"assistant", "content": "..."}
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum output tokens
            stream: Whether to stream tokens

        Returns:
            Dict with "content", "usage", "model" keys
        """
        if requests is None:
            return {"content": "[Error: requests library not available]", "error": "no_requests"}

        if not self.api_key:
            return {"content": "[Error: No API key configured. Set DEEPSEEK_API_KEY environment variable.]",
                    "error": "no_api_key"}

        try:
            url = f"{self.base_url}/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": stream,
            }

            if stream:
                return self._chat_stream(url, headers, payload)
            else:
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                response.raise_for_status()
                data = response.json()

                return {
                    "content": data["choices"][0]["message"]["content"],
                    "usage": data.get("usage", {}),
                    "model": data.get("model", self.model),
                    "finish_reason": data["choices"][0].get("finish_reason", "stop"),
                }

        except requests.exceptions.Timeout:
            self.last_error = "Request timed out"
            return {"content": "[Error: Request timed out. The LLM service may be busy.]",
                    "error": "timeout"}
        except requests.exceptions.HTTPError as e:
            self.last_error = f"HTTP error: {e}"
            return {"content": f"[Error: LLM service returned an error: {e}]",
                    "error": "http_error", "status_code": e.response.status_code if e.response else None}
        except Exception as e:
            self.last_error = f"Unknown error: {e}"
            return {"content": f"[Error: {e}]", "error": "unknown"}

    def _chat_stream(self, url: str, headers: str, payload: dict) -> Dict:
        """Handle streaming response (basic implementation)."""
        try:
            response = requests.post(url, headers=headers, json=payload,
                                    stream=True, timeout=120)
            response.raise_for_status()

            full_content = []
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_str = line_str[6:]
                        if data_str == '[DONE]':
                            break
                        try:
                            data = json.loads(data_str)
                            if "choices" in data and len(data["choices"]) > 0:
                                delta = data["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    full_content.append(content)
                        except json.JSONDecodeError:
                            pass

            return {
                "content": ''.join(full_content),
                "usage": {},
                "model": self.model,
                "finish_reason": "stop",
                "streamed": True,
            }
        except Exception as e:
            self.last_error = f"Stream error: {e}"
            return {"content": f"[Error: {e}]", "error": "stream_error"}


class NexusLLMEngine:
    """Full NEXUS engine with real LLM conversation.

    Combines pattern retrieval, scenario routing, 5-layer prompt assembly,
    and LLM API calls into a single conversation interface.
    """

    # Final safety net: server-side banned word enforcement
    # Applied to every LLM response before it reaches the user
    HARD_BAN_REPLACEMENTS = [
        # (pattern, replacement) — ordered from most specific to least
        (r'\bdisrupt\b', 'reshape'),
        (r'\bdisruption\b', 'upheaval'),
        (r'\bdisruptive\b', 'transformative'),
        (r'\bleverage\b', 'use'),
        (r'\bleveraging\b', 'drawing on'),
        (r'\bnavigate\b', 'steer through'),
        (r'\bnavigating\b', 'working through'),
        (r'\bframework\b', 'structure'),
        (r'\bframeworks\b', 'structures'),
        (r'\bplatform\b', 'system'),
        (r'\bplatforms\b', 'systems'),
        (r'\bseamless\b', 'consistent'),
        (r'\bempower\b', 'enable'),
        (r'\bempowering\b', 'enabling'),
        (r'\bstreamline\b', 'simplify'),
        (r'\bfunnel\b', 'pipeline'),
        (r'\bfunnels\b', 'pipelines'),
        (r'\bflywheel\b', 'cycle'),
        (r'\bflywheels\b', 'cycles'),
        (r'\bsignals\b', 'indicators'),
        (r'\bstages\b', 'phases'),
        (r'\barchitect\b', 'design'),
        (r'\barchitecting\b', 'designing'),
        (r'\bquiet\b', 'subtle'),
        (r'\bburn\b', 'consume'),
        (r'\bburned\b', 'consumed'),
        (r'\bburning\b', 'consuming'),
        (r'\bwar\b', 'conflict'),
        (r'\bwarrior\b', 'practitioner'),
        (r'\bhunt\b', 'seek'),
        (r'\bhunting\b', 'seeking'),
        (r'\bforce\b', 'drive'),
        (r'\bforced\b', 'driven'),
        (r'\bforcing\b', 'driving'),
        (r'\barc\b', 'trajectory'),
        (r'\bcancel anytime\b', 'cancel at any time'),
        (r'\bassessment\b', 'evaluation'),
        (r'\bassessments\b', 'evaluations'),
    ]

    def __init__(self, api_key: str = None, model: str = None):
        # Import pattern retriever and scenario router from nexus_engine
        from nexus_engine import PatternRetriever, ScenarioRouter

        self.retriever = PatternRetriever()
        self.router = ScenarioRouter()
        self.prompt_assembler = PromptAssembler()
        self.llm = LLMClient(api_key=api_key, model=model)

        # Conversation state
        self.conversation_history: List[Dict] = []  # LLM messages format
        self.full_history: List[Dict] = []  # Rich history with metadata
        self.current_scenario = None
        self.scenario_confidence = 0.0
        self.current_persona = "Diagnostician"
        self.turn_count = 0

    def chat(self, user_message: str, stream: bool = False) -> Dict:
        """Process a user message and return the full response.

        Returns:
            Dict with:
            - response: NEXUS response text
            - scenario: active scenario ID
            - persona: active persona
            - confidence: scenario confidence
            - patterns_retrieved: list of pattern names
            - pattern_count: number of patterns retrieved
            - quality_estimate: dict of gate scores
            - turn_number: current turn number
            - usage: token usage info
            - error: error message if any
        """
        self.turn_count += 1

        # Step 1: Route scenario (on first turn)
        if self.current_scenario is None:
            self.current_scenario, self.scenario_confidence = self.router.route(user_message)
            self.current_persona = self._get_persona_for_scenario(self.current_scenario)

        # Step 2: Retrieve patterns
        scenario_key = self.current_scenario if self.current_scenario != "GENERAL" else None
        patterns = self.retriever.retrieve(user_message, scenario=scenario_key, top_k=4)

        # Step 3: Build system prompt
        system_prompt = self.prompt_assembler.build_system_prompt(
            scenario_id=self.current_scenario,
            patterns=patterns,
            persona=self.current_persona
        )

        # Step 4: Build messages array
        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history (previous turns, limited to last 6 to save context)
        history_to_include = self.conversation_history[-6:] if len(self.conversation_history) > 6 else self.conversation_history
        messages.extend(history_to_include)

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Step 5: Call LLM
        result = self.llm.chat(
            messages=messages,
            temperature=0.7,
            max_tokens=800,
            stream=stream
        )

        # Step 6: Server-side banned word enforcement (final safety net)
        raw_response = result.get("content", "")
        clean_response, ban_fixes = self._enforce_writing_discipline(raw_response)
        result["content"] = clean_response
        result["banned_word_fixes"] = ban_fixes

        # Step 7: Estimate quality (after cleanup)
        quality = self._estimate_quality(user_message, clean_response, patterns)

        # Step 8: Save to history
        assistant_response = clean_response
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": assistant_response})

        self.full_history.append({
            "turn": self.turn_count,
            "user": user_message,
            "assistant": assistant_response,
            "scenario": self.current_scenario,
            "persona": self.current_persona,
            "patterns": [p.get("name", "") for p in patterns],
            "quality": quality,
            "usage": result.get("usage", {}),
        })

        return {
            "response": assistant_response,
            "scenario": self.current_scenario,
            "scenario_name": self._get_scenario_name(),
            "persona": self.current_persona,
            "confidence": self.scenario_confidence,
            "patterns_retrieved": [p.get("name", "") for p in patterns],
            "pattern_details": [{"name": p.get("name", ""), "category": p.get("category", "")} for p in patterns],
            "pattern_count": len(patterns),
            "quality_estimate": quality,
            "turn_number": self.turn_count,
            "usage": result.get("usage", {}),
            "error": result.get("error", None),
        }

    def reset(self):
        """Reset conversation state for a new session."""
        self.conversation_history = []
        self.full_history = []
        self.current_scenario = None
        self.scenario_confidence = 0.0
        self.current_persona = "Diagnostician"
        self.turn_count = 0

    def _get_persona_for_scenario(self, scenario_id: str) -> str:
        """Map scenario ID to persona mode."""
        mapping = {
            "S1": "Diagnostician",
            "S3": "Cross-Border Specialist",
            "S5": "Reflector",
            "S7": "Strategist",
            "S9": "Builder",
            "GENERAL": "Diagnostician",
        }
        return mapping.get(scenario_id, "Diagnostician")

    def _get_scenario_name(self) -> str:
        if self.current_scenario == "GENERAL":
            return "General Diagnostician"
        return self.router.SCENARIO_PROFILES.get(self.current_scenario, {}).get("name", "Unknown")

    def _enforce_writing_discipline(self, text: str) -> tuple:
        """Apply server-side banned word enforcement as a final safety net.

        Returns (clean_text, list_of_fixes_applied).
        """
        fixes = []
        clean = text

        for pattern, replacement in self.HARD_BAN_REPLACEMENTS:
            # Find all matches before replacing
            matches = re.findall(pattern, clean, re.IGNORECASE)
            if matches:
                # Track what was fixed
                for m in matches:
                    fixes.append({"original": m, "replacement": replacement})
                # Apply replacement (case-insensitive, preserving case where possible)
                clean = re.sub(pattern, replacement, clean, flags=re.IGNORECASE)

        # Fix capitalization at sentence starts after replacement
        # (simple heuristic: if replacement starts lowercase but follows ". ")
        clean = re.sub(r'\. ([a-z])', lambda m: '. ' + m.group(1).upper(), clean)

        return clean, fixes

    def _estimate_quality(self, user_input: str, response: str, patterns: List[Dict]) -> Dict:
        """Estimate quality gate scores based on response characteristics.

        This is a heuristic estimation — the real quality check happens
        inside the LLM via the G12 hard gate in the system prompt.
        """
        scores = {}
        resp_lower = response.lower()
        resp_len = len(response)

        # G1 Contextual Precision — response length and specificity
        g1 = 3.0
        if resp_len > 100: g1 += 0.3
        if resp_len > 200: g1 += 0.3
        if '?' in response: g1 += 0.3  # NEXUS asks questions
        scores["G1"] = round(min(5.0, g1), 1)

        # G2 Writing Discipline — check for banned words
        hard_bans = ["platform", "assessment", "free ", "framework", "architect",
                     "navigate", "disrupt", "leverage", "funnel", "flywheel",
                     "signals", "stages", "seamless", "empower", "streamline",
                     "warrior", "hunt", "war", "force", "quiet", "burn",
                     "cancel anytime", "arc"]
        ban_count = sum(1 for w in hard_bans if w in resp_lower)
        g2 = 5.0 - ban_count * 0.8
        scores["G2"] = round(max(1.0, g2), 1)

        # G3 Pattern Activation — number of retrieved patterns
        g3 = min(5.0, 2.0 + len(patterns) * 0.6)
        scores["G3"] = round(g3, 1)

        # G4 Deliverable Quality — response substance
        g4 = 3.0
        if resp_len > 150: g4 += 0.5
        if resp_len > 300: g4 += 0.3
        scores["G4"] = round(min(5.0, g4), 1)

        # G5 Perspective vs Dump — sentence structure diversity
        sentences = re.split(r'(?<=[.!?])\s+', response.strip())
        avg_sentence_len = resp_len / max(1, len(sentences))
        g5 = 3.0
        if 15 < avg_sentence_len < 40: g5 += 0.5  # Good balance
        scores["G5"] = round(min(5.0, g5), 1)

        # G6 Question Precision — question quality (heuristic)
        question_count = response.count('?')
        g6 = 2.5
        if 1 <= question_count <= 2: g6 += 1.0  # 1-2 focused questions
        elif question_count > 2: g6 += 0.5
        scores["G6"] = round(min(5.0, g6), 1)

        # G7 White Space / Iceberg — brevity + density
        g7 = 3.0
        if resp_len < 400: g7 += 0.5
        if resp_len < 250: g7 += 0.3
        # Conciseness bonus: high information per word
        if resp_len > 50 and avg_sentence_len > 20:
            g7 += 0.3
        scores["G7"] = round(min(5.0, g7), 1)

        # G8 Continuity & Thread — builds on prior (approximate)
        g8 = 3.5 if self.turn_count > 1 else 3.0
        scores["G8"] = round(min(5.0, g8), 1)

        # G9 Pillar Alignment
        g9 = 3.5 if patterns else 2.5
        if any(p.get("category") == "Constitutional" for p in patterns):
            g9 += 0.5
        scores["G9"] = round(min(5.0, g9), 1)

        # G10 Tone & Register — FT/Economist level check
        g10 = 3.5
        # Check for hedging language (negative)
        hedging = ["i think", "it could be", "maybe", "sort of", "kind of"]
        if not any(h in resp_lower for h in hedging):
            g10 += 0.5
        # Check for confident structure
        if sentences and sentences[0][0].isupper():
            g10 += 0.2
        scores["G10"] = round(min(5.0, g10), 1)

        # G11 Safety & Boundary — no therapy/medical/legal/financial language
        therapy_terms = ["depression", "anxiety", "therapy", "counseling",
                          "mental health", "therapist", "psychologist",
                          "self-care", "wellness"]
        medical_legal = ["medical advice", "legal advice", "lawyer", "doctor",
                         "prescription", "diagnosis"]
        risk_count = sum(1 for t in therapy_terms + medical_legal if t in resp_lower)
        g11 = 5.0 - risk_count * 1.5
        scores["G11"] = round(max(1.0, g11), 1)

        # G12 Brand Voice — overall NEXUS feel (composite)
        # Weighted combination of key gates + NEXUS-specific markers
        g12_components = [
            scores["G2"] * 0.15,   # Writing discipline
            scores["G3"] * 0.20,   # Pattern activation
            scores["G7"] * 0.20,   # White space
            scores["G9"] * 0.15,   # Pillar alignment
            scores["G10"] * 0.15,  # Tone
            scores["G6"] * 0.15,   # Question quality
        ]
        g12 = sum(g12_components)
        # Bonus for question-led structure
        if 1 <= question_count <= 2:
            g12 += 0.2
        # Penalty for lists
        if re.search(r'\d+\.\s', response) or response.count('-') > 3:
            g12 -= 0.4
        scores["G12"] = round(max(1.0, min(5.0, g12)), 1)

        # Overall
        gate_keys = [f"G{i}" for i in range(1, 13)]
        existing = [scores[k] for k in gate_keys if k in scores]
        scores["overall"] = round(sum(existing) / len(existing), 1) if existing else 3.0

        return scores

    def get_conversation_summary(self) -> Dict:
        """Get summary of current conversation state."""
        return {
            "turns": self.turn_count,
            "scenario": self.current_scenario,
            "scenario_name": self._get_scenario_name(),
            "persona": self.current_persona,
            "confidence": self.scenario_confidence,
            "total_patterns_in_db": len(self.retriever.patterns),
            "api_configured": bool(self.llm.api_key),
        }


if __name__ == "__main__":
    # Quick test
    engine = NexusLLMEngine()
    print(f"NEXUS LLM Engine v1.0")
    print(f"Patterns: {engine.retriever and len(engine.retriever.patterns)}")
    print(f"API configured: {bool(engine.llm.api_key)}")
    print(f"Prompts loaded: {list(engine.prompt_assembler.prompts.keys())}")
