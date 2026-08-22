"""
NEXUS Demo Engine v1.0
5-layer system prompt architecture simulation
with pattern retrieval and scenario routing
"""

import json
import re
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent


class PatternRetriever:
    """Simple keyword-based pattern retrieval system."""
    
    def __init__(self, patterns_path=None):
        if patterns_path is None:
            patterns_path = BASE_DIR / "pattern_db" / "patterns_v1.0.json"
        with open(patterns_path, "r") as f:
            data = json.load(f)
        self.patterns = data["patterns"]
        self.metadata = data["metadata"]
    
    def retrieve(self, user_input, scenario=None, top_k=5):
        """Retrieve top-k most relevant patterns for user input."""
        input_lower = user_input.lower()
        scored = []
        
        for pattern in self.patterns:
            score = 0
            
            # Scenario match boost
            if scenario and scenario in pattern.get("scenarios", []):
                score += 2.0
            
            # Keyword match in activation keywords
            for kw in pattern.get("activation_keywords", []):
                if kw.lower() in input_lower:
                    score += 1.5
            
            # Keyword match in pattern name
            name_words = pattern["name"].lower().split()
            for word in name_words:
                if len(word) > 4 and word in input_lower:
                    score += 0.8
            
            # Keyword match in body text
            body_lower = pattern["body"].lower()
            match_count = 0
            for kw in pattern.get("activation_keywords", []):
                if kw.lower() in body_lower and kw.lower() in input_lower:
                    match_count += 1
            score += match_count * 0.3
            
            if score > 0:
                scored.append((score, pattern))
        
        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        
        # Always include at least 1 constitutional pattern
        constitutional = [p for s, p in scored if p["category"] == "Constitutional"]
        result = [p for s, p in scored[:top_k]]
        
        if not any(p["category"] == "Constitutional" for p in result) and constitutional:
            result[-1] = constitutional[0]
        
        return result[:top_k]


class ScenarioRouter:
    """Routes user input to the most appropriate scenario."""
    
    SCENARIO_PROFILES = {
        "S1": {
            "name": "Career Crossroads",
            "persona": "Diagnostician",
            "keywords": [
                "career", "stuck", "bored", "plateau", "what next", "change", "pivot",
                "growth", "not growing", "stagnant", "options", "leave", "stay",
                "what should i do", "next step", "direction"
            ],
            "target_score": 3.5
        },
        "S3": {
            "name": "Cross-Border Role",
            "persona": "Cross-Border Specialist",
            "keywords": [
                "china", "shanghai", "beijing", "asia", "expat", "expatriate",
                "cross-border", "cross border", "overseas", "foreign", "international",
                "hq", "headquarters", "regional", "subsidiary", "local team",
                "decision making", "meetings", "culture", "head office"
            ],
            "target_score": 4.0
        },
        "S5": {
            "name": "Executive Isolation",
            "persona": "Reflector",
            "keywords": [
                "alone", "lonely", "isolation", "isolated", "distance", "removed",
                "no one to talk to", "can't tell", "can't share", "top", "ceolo",
                "board", "separate", "peer", "friends at work", "empty"
            ],
            "target_score": 4.0
        },
        "S7": {
            "name": "Boardroom Prep",
            "persona": "Strategist",
            "keywords": [
                "board", "board meeting", "boardroom", "presentation", "deck",
                "investor", "investors", "stakeholder", "strategy meeting",
                "prepare", "prep", "persuade", "convince", "directors",
                "governance", "committee"
            ],
            "target_score": 3.8
        },
        "S9": {
            "name": "AI Transformation",
            "persona": "Builder",
            "keywords": [
                "ai", "artificial intelligence", "machine learning", "llm",
                "chatgpt", "automation", "technology", "digital transformation",
                "rollout", "implementation", "adoption", "gen ai", "generative",
                "ai strategy", "tools"
            ],
            "target_score": 3.8
        }
    }
    
    def route(self, user_input):
        """Determine which scenario best matches the user input.
        Returns (scenario_id, confidence_score)."""
        input_lower = user_input.lower()
        scores = {}
        
        for sid, profile in self.SCENARIO_PROFILES.items():
            score = 0
            for kw in profile["keywords"]:
                if kw in input_lower:
                    score += 1
            scores[sid] = score
        
        # Find best match
        best_scenario = max(scores, key=scores.get)
        best_score = scores[best_scenario]
        
        # Threshold: if best score is 0 or all very low, return general mode
        total_score = sum(scores.values())
        if best_score < 1 or (total_score > 0 and best_score / total_score < 0.35):
            return ("GENERAL", 0.2)
        
        confidence = min(0.9, best_score / 5.0)
        return (best_scenario, round(confidence, 2))


class NexusDemoEngine:
    """Main demo engine — simulates the 5-layer NEXUS system."""
    
    def __init__(self):
        self.retriever = PatternRetriever()
        self.router = ScenarioRouter()
        self.conversation_history = []
        self.current_scenario = None
        self.scenario_confidence = 0.0
    
    def process_turn(self, user_input):
        """Process a single conversation turn.
        Returns dict with analysis, patterns, scenario, and quality gates."""
        
        # Layer 4: Scenario routing (on first turn)
        if self.current_scenario is None:
            self.current_scenario, self.scenario_confidence = self.router.route(user_input)
        
        # Layer 3: Pattern retrieval
        patterns = self.retriever.retrieve(
            user_input, 
            scenario=self.current_scenario if self.current_scenario != "GENERAL" else None,
            top_k=4
        )
        
        # Quality estimation
        quality = self._estimate_quality(user_input, patterns)
        
        # Save to history
        self.conversation_history.append({
            "user": user_input,
            "scenario": self.current_scenario,
            "scenario_confidence": self.scenario_confidence,
            "patterns_retrieved": len(patterns),
            "quality_estimate": quality
        })
        
        return {
            "scenario": self.current_scenario,
            "scenario_name": self._get_scenario_name(),
            "scenario_confidence": self.scenario_confidence,
            "persona_mode": self._get_persona_mode(),
            "patterns_retrieved": patterns,
            "quality_estimate": quality,
            "turn_number": len(self.conversation_history)
        }
    
    def _get_scenario_name(self):
        if self.current_scenario == "GENERAL":
            return "General Diagnostician"
        return self.router.SCENARIO_PROFILES.get(self.current_scenario, {}).get("name", "Unknown")
    
    def _get_persona_mode(self):
        if self.current_scenario == "GENERAL":
            return "Diagnostician"
        return self.router.SCENARIO_PROFILES.get(self.current_scenario, {}).get("persona", "Diagnostician")
    
    def _estimate_quality(self, user_input, patterns):
        """Rough quality estimation based on system state."""
        scores = {}
        
        # G3 Pattern Activation — based on number & relevance of retrieved patterns
        g3 = min(5.0, 2.0 + len(patterns) * 0.7)
        scores["G3"] = round(g3, 1)
        
        # G9 Pillar Alignment
        g9 = 3.5 if patterns else 2.5
        if any(p["category"] == "Constitutional" for p in patterns):
            g9 += 0.5
        scores["G9"] = round(min(5.0, g9), 1)
        
        # G12 Brand Voice (estimate based on pattern coverage)
        g12 = 3.0
        if len(patterns) >= 3:
            g12 = 3.5
        if len(patterns) >= 4:
            g12 = 4.0
        if any(p["priority"] == "P0" for p in patterns):
            g12 += 0.2
        scores["G12"] = round(min(5.0, g12), 1)
        
        # Average for overall
        overall = round(sum(scores.values()) / len(scores), 1)
        scores["overall"] = overall
        
        return scores
    
    def reset(self):
        """Reset conversation state."""
        self.conversation_history = []
        self.current_scenario = None
        self.scenario_confidence = 0.0
    
    def get_stats(self):
        """Get engine statistics."""
        return {
            "total_patterns": len(self.retriever.patterns),
            "scenarios_supported": 5,
            "conversation_turns": len(self.conversation_history),
            "current_scenario": self.current_scenario,
            "current_persona": self._get_persona_mode()
        }


if __name__ == "__main__":
    # Quick test
    engine = NexusDemoEngine()
    print(f"NEXUS Demo Engine v1.0 — {engine.get_stats()['total_patterns']} patterns loaded")
    
    test_inputs = [
        "I'm bored in my job and thinking about leaving but I don't know what's next.",
        "I just moved to Shanghai to run the China business and nothing gets decided the way I expect.",
        "I'm the CEO and I feel completely isolated, I can't talk to anyone about it.",
        "I have a board meeting in two weeks and I need to present the annual strategy.",
        "I need to build an AI strategy for my company but I don't know where to start."
    ]
    
    for inp in test_inputs:
        result = engine.process_turn(inp)
        print(f"\nInput: {inp[:60]}...")
        print(f"  Scenario: {result['scenario']} ({result['scenario_name']}) — conf: {result['scenario_confidence']}")
        print(f"  Persona: {result['persona_mode']}")
        print(f"  Patterns retrieved: {len(result['patterns_retrieved'])}")
        print(f"  Quality est: {result['quality_estimate']['overall']}")
        engine.reset()
