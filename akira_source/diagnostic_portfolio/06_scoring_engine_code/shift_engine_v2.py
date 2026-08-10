"""
SHIFT Suite — Generic Scoring Engine v2
Fixed archetype assignment: per-instrument logic instead of naive keyword matching.
"""

import json
import os
import re

ENGINE_DIR = os.path.dirname(os.path.abspath(__file__))


def reverse_code(raw_score):
    """Invert a 1-5 Likert score."""
    return 6 - raw_score


class ShiftScorer:
    """Generic scorer for any SHIFT suite instrument."""
    
    def __init__(self, instrument_name):
        config_path = os.path.join(ENGINE_DIR, f"{instrument_name.lower()}_config.json")
        with open(config_path) as f:
            self.config = json.load(f)
        self.instrument = self.config["instrument"]
    
    def score(self, responses: dict) -> dict:
        """Score a complete response set."""
        # Validate
        all_qids = []
        all_reverse = []
        for dim in self.config["dimensions"]:
            all_qids.extend(dim["question_ids"])
            all_reverse.extend(dim["reverse_coded"])
        
        missing = [q for q in all_qids if q not in responses]
        if missing:
            raise ValueError(f"Missing responses for: {missing}")
        
        # Step 1: Reverse-code
        scored = {}
        for qid, raw in responses.items():
            if raw < 1 or raw > 5:
                raise ValueError(f"Invalid score for {qid}: {raw} (must be 1-5)")
            scored[qid] = reverse_code(raw) if qid in all_reverse else raw
        
        # Step 2: Dimension scores
        dimension_scores = {}
        for dim in self.config["dimensions"]:
            raw_sum = sum(scored[qid] for qid in dim["question_ids"])
            normalised = round((raw_sum / dim["raw_max"]) * 20, 1)
            verdict = self._get_verdict(normalised)
            sub_scores = self._calc_sub_dimensions(dim, scored)
            
            dimension_scores[dim["id"]] = {
                "name": dim["name"],
                "raw": raw_sum,
                "normalised": normalised,
                "verdict": verdict,
                "sub_dimensions": sub_scores,
                "reverse_coded": dim["reverse_coded"]
            }
        
        # Step 3: Composite score
        total_raw = sum(dimension_scores[d["id"]]["raw"] for d in self.config["dimensions"])
        max_raw = sum(d["raw_max"] for d in self.config["dimensions"])
        composite = round((total_raw / max_raw) * 100, 1)
        
        # Step 4: Band
        band = self._get_composite_band(composite)
        
        # Step 5: Archetype — NOW USES PER-INSTRUMENT LOGIC
        archetype = self._assign_archetype_v2(dimension_scores, band)
        
        # Step 6: Development priorities
        dev_priorities = self._get_development_priorities(dimension_scores)
        
        return {
            "instrument": self.instrument,
            "version": self.config["version"],
            "dimension_scores": dimension_scores,
            "composite": {
                "score": composite,
                "band": band["band"] if band else "Unknown",
                "interpretation": band["interpretation"] if band else ""
            },
            "archetype": archetype,
            "development_priorities": dev_priorities,
            "total_questions": self.config["total_questions"]
        }
    
    def _get_verdict(self, normalised_score):
        for v in self.config.get("dimension_verdicts", []):
            if v["min"] <= normalised_score <= v["max"]:
                return {"verdict": v["verdict"], "meaning": v["meaning"]}
        return {"verdict": "", "meaning": ""}
    
    def _get_composite_band(self, composite_score):
        for b in self.config["composite_bands"]:
            if b["min"] <= composite_score <= b["max"]:
                return {"band": b["band"], "interpretation": b["interpretation"]}
        return None
    
    def _calc_sub_dimensions(self, dim, scored):
        sub_scores = {}
        if dim["sub_dimensions"]:
            qs_per_sub = len(dim["question_ids"]) // len(dim["sub_dimensions"])
            for si, sub_name in enumerate(dim["sub_dimensions"]):
                start = si * qs_per_sub
                end = start + qs_per_sub
                if si == len(dim["sub_dimensions"]) - 1:
                    end = len(dim["question_ids"])
                sub_qids = dim["question_ids"][start:end]
                sub_raw = sum(scored[qid] for qid in sub_qids)
                sub_max = len(sub_qids) * 5
                sub_norm = round((sub_raw / sub_max) * 20, 1) if sub_max > 0 else 0
                sub_scores[sub_name] = {"raw": sub_raw, "normalised": sub_norm}
        return sub_scores

    # ═══════════════════════════════════════════════════════════
    # ARCHETYPE ASSIGNMENT v2 — Per-instrument logic
    # ═══════════════════════════════════════════════════════════
    
    def _assign_archetype_v2(self, dimension_scores, band):
        """Route to instrument-specific archetype assignment."""
        if self.instrument == "LEAP":
            return self._archetype_leap(dimension_scores)
        elif self.instrument == "QUEST":
            return self._archetype_quest(dimension_scores, band)
        elif self.instrument == "IMPACT":
            return self._archetype_impact(dimension_scores, band)
        elif self.instrument == "PRISM":
            return self._archetype_prism(dimension_scores)
        else:
            return self._archetype_fallback(dimension_scores)
    
    def _get_dim_ranking(self, dimension_scores):
        """Return dimensions sorted by score descending."""
        return sorted(dimension_scores.items(), key=lambda x: x[1]["normalised"], reverse=True)
    
    # ─── LEAP: Dimension-pair matching ───────────────────────
    # Each archetype has "X-Y dominant" in description.
    # Match top-2 dimensions to the archetype's dimension pair.
    
    def _archetype_leap(self, dimension_scores):
        ranked = self._get_dim_ranking(dimension_scores)
        top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
        top2_set = set(d.lower() for d in top2)
        
        # Filter out non-archetype entries (like "LEAP Instrument")
        archetypes = [a for a in self.config["archetypes"] 
                      if "description" in a and a.get("description", "").endswith(("",)) 
                      and a["name"] != "LEAP Instrument"]
        # Actually just filter by having a dim-pair pattern in description
        archetypes = [a for a in self.config["archetypes"]
                      if re.search(r'[A-Z][a-z]+-[A-Z][a-z]+\s+dominant', a.get("description", ""))]
        
        best = None
        best_matches = 0
        
        for arch in archetypes:
            desc = arch["description"]
            # Extract the dimension pair from "X-Y dominant"
            match = re.match(r'(\w+)-(\w+)\s+dominant', desc)
            if match:
                dim_a, dim_b = match.group(1).lower(), match.group(2).lower()
                pair = {dim_a, dim_b}
                overlap = len(pair & top2_set)
                if overlap > best_matches:
                    best_matches = overlap
                    best = arch
        
        if best:
            return {
                "name": best["name"],
                "description": best["description"],
                "dominant_dimensions": top2
            }
        return {"name": "Unmapped", "description": "No matching archetype pattern", "dominant_dimensions": top2}
    
    # ─── QUEST: Profile-based with band filtering ────────────
    # Each archetype has a "profile" field like:
    # "High Execution Excellence + High Commercial Acumen, Advanced band"
    # Parse required dims and band, check against actual scores.
    
    def _archetype_quest(self, dimension_scores, band_info):
        ranked = self._get_dim_ranking(dimension_scores)
        dim_names = {d["name"]: d["normalised"] for d in dimension_scores.values()}
        composite_band = band_info["band"] if band_info else "Unknown"
        
        # Map composite bands to archetype band categories
        # Archetypes use "Advanced" and "Developing"
        # Config bands: Executive Ready (80+), Near-Ready (60-79), Capability Building (40-59), 
        #               Early Executive (20-39), Pre-Executive (0-19)
        def band_matches(arch_band_str):
            arch_band_str = arch_band_str.lower().strip()
            if "any band" in arch_band_str or "any" in arch_band_str:
                return True
            if "advanced" in arch_band_str:
                return composite_band in ["Executive Ready", "Near-Ready"]
            if "developing" in arch_band_str:
                return composite_band in ["Near-Ready", "Capability Building", "Early Executive"]
            if "emerging" in arch_band_str:
                return composite_band in ["Capability Building", "Early Executive", "Pre-Executive"]
            return True  # default: allow
        
        archetypes = [a for a in self.config["archetypes"] if "profile" in a]
        
        scored_archetypes = []
        
        for arch in archetypes:
            profile = arch["profile"]
            score = 0
            
            # Parse required dimensions from profile text
            # Pattern: "High X + High Y, Z band" or "High X, Z band" or "One dimension dominant..."
            dim_requirements = re.findall(r'High\s+([A-Z][a-zA-Z\s]+?)(?:\s*\+|\s*,)', profile)
            
            if "One dimension dominant" in profile:
                # Specialist: check if any dim is >15 pts above all others
                scores_sorted = sorted(dim_names.values(), reverse=True)
                if len(scores_sorted) >= 2 and (scores_sorted[0] - scores_sorted[1]) > 7.5:
                    score = 10
                else:
                    score = 0
            elif "Multiple low dimensions" in profile:
                # Seedling: check if composite < 50
                avg = sum(dim_names.values()) / len(dim_names)
                if avg < 10:  # normalised < 10/20 ≈ composite < 50
                    score = 10
                else:
                    score = 0
            else:
                # Standard: parse dimension requirements
                if not band_matches(profile.split(",")[-1] if "," in profile else ""):
                    score = 0
                else:
                    # Check how many required dims are actually high
                    for req_dim in dim_requirements:
                        req_dim = req_dim.strip()
                        if req_dim in dim_names:
                            if dim_names[req_dim] >= 13:  # "High" threshold ≈ 13/20
                                score += 3
                            elif dim_names[req_dim] >= 10:
                                score += 1
                        else:
                            # Try partial match (e.g., "Execution Excellence" matches dim name)
                            for actual_name in dim_names:
                                if req_dim.lower() in actual_name.lower():
                                    if dim_names[actual_name] >= 13:
                                        score += 3
                                    elif dim_names[actual_name] >= 10:
                                        score += 1
                                    break
            
            scored_archetypes.append((arch, score))
        
        scored_archetypes.sort(key=lambda x: x[1], reverse=True)
        
        if scored_archetypes and scored_archetypes[0][1] > 0:
            best = scored_archetypes[0][0]
            top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
            return {
                "name": best["name"],
                "description": best.get("core_strength", best.get("profile", "")),
                "dominant_dimensions": top2
            }
        
        top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
        return {"name": "Unmapped", "description": "No matching archetype", "dominant_dimensions": top2}
    
    # ─── IMPACT: Orientation + mandate band ──────────────────
    # Map each archetype's orientation to dimension pairs.
    # orientation: "Governance + Strategy dominant" → Governance Rigour + Strategic Oversight
    # Check which orientation matches candidate's top dims.
    
    # Dimension-to-orientation mapping for IMPACT
    IMPACT_ORIENTATION_MAP = {
        "governance": "Governance Rigour",
        "strategy": "Strategic Oversight",
        "relationship": "Stakeholder Intelligence",
        "legacy": "Mandate Legacy",
    }
    
    def _archetype_impact(self, dimension_scores, band_info):
        ranked = self._get_dim_ranking(dimension_scores)
        dim_names = {d["name"]: d["normalised"] for _, d in dimension_scores.items()}
        composite_band = band_info["band"] if band_info else "Unknown"
        
        # Map mandate band names
        def mandate_band_matches(arch_mandate):
            arch_mandate = arch_mandate.lower()
            if "high" in arch_mandate:
                return composite_band in ["Full Mandate", "Established"]
            if "building" in arch_mandate:
                return composite_band in ["Building Mandate", "Developing Mandate"]
            if "fragile" in arch_mandate:
                return composite_band in ["Fragile Mandate", "Building Mandate", "Early Mandate"]
            return True
        
        archetypes = [a for a in self.config["archetypes"] if "orientation" in a]
        
        scored_archetypes = []
        
        for arch in archetypes:
            orientation = arch["orientation"].lower()
            score = 0
            
            # Skip generic catch-all archetypes
            if "any profile" in orientation or "all dims" in orientation:
                # Handle Nominee and Passenger separately
                if "any profile" in orientation:
                    # Nominee: at least one dim >= 10/20
                    if any(v >= 10 for v in dim_names.values()):
                        score = 3
                elif "all dims low" in orientation:
                    if all(v < 8 for v in dim_names.values()):
                        score = 5
                scored_archetypes.append((arch, score))
                continue
            
            # Parse orientation for dimension keywords
            for keyword, dim_name in self.IMPACT_ORIENTATION_MAP.items():
                if keyword in orientation:
                    if dim_name in dim_names:
                        if dim_names[dim_name] >= 13:
                            score += 4
                        elif dim_names[dim_name] >= 10:
                            score += 2
                        else:
                            score += 0
            
            # Check mandate band compatibility
            if not mandate_band_matches(arch.get("mandate_band", "")):
                score = max(0, score - 3)
            
            scored_archetypes.append((arch, score))
        
        scored_archetypes.sort(key=lambda x: x[1], reverse=True)
        
        if scored_archetypes and scored_archetypes[0][1] > 0:
            best = scored_archetypes[0][0]
            top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
            return {
                "name": best["name"],
                "description": best.get("core_dynamic", best.get("orientation", "")),
                "dominant_dimensions": top2
            }
        
        top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
        return {"name": "Unmapped", "description": "No matching archetype", "dominant_dimensions": top2}
    
    # ─── PRISM: 2-axis model (Foundation × Visibility) ───────
    # Foundation = avg(Brand Clarity, Identity Consistency) → Strong/Developing/Weak
    # Visibility = avg(Narrative Power, Visibility Level, Market Legibility) → High/Medium/Low
    # Look up the archetype matching (Foundation, Visibility) pair.
    
    PRISM_FOUNDATION_DIMS = ["Brand Clarity", "Identity Consistency"]
    PRISM_VISIBILITY_DIMS = ["Narrative Power", "Visibility Level", "Market Legibility"]
    
    def _archetype_prism(self, dimension_scores):
        dim_names = {d["name"]: d["normalised"] for _, d in dimension_scores.items()}
        
        # Compute foundation axis score
        foundation_scores = [dim_names.get(d, 0) for d in self.PRISM_FOUNDATION_DIMS]
        foundation_avg = sum(foundation_scores) / len(foundation_scores) if foundation_scores else 0
        
        # Compute visibility axis score
        visibility_scores = [dim_names.get(d, 0) for d in self.PRISM_VISIBILITY_DIMS]
        visibility_avg = sum(visibility_scores) / len(visibility_scores) if visibility_scores else 0
        
        # Map to categories
        # Foundation: Strong (≥14), Developing (8-13.9), Weak (<8)
        if foundation_avg >= 14:
            foundation_cat = "Strong"
        elif foundation_avg >= 8:
            foundation_cat = "Developing"
        else:
            foundation_cat = "Weak"
        
        # Visibility: High (≥14), Medium (9-13.9), Low (<9)
        if visibility_avg >= 14:
            visibility_cat = "High"
        elif visibility_avg >= 9:
            visibility_cat = "Medium"
        else:
            visibility_cat = "Low"
        
        # Look up archetype by (foundation, visibility) pair
        archetypes = [a for a in self.config["archetypes"] if "foundation" in a and "visibility" in a]
        
        for arch in archetypes:
            arch_foundation = arch["foundation"].lower()
            arch_visibility = arch["visibility"].lower()
            
            # Handle "Low-Medium" visibility
            vis_match = False
            if arch_visibility == visibility_cat.lower():
                vis_match = True
            elif "low-medium" in arch_visibility and visibility_cat in ["Low", "Medium"]:
                vis_match = True
            
            if arch_foundation == foundation_cat.lower() and vis_match:
                ranked = self._get_dim_ranking(dimension_scores)
                top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
                return {
                    "name": arch["name"],
                    "description": arch.get("core_dynamic", ""),
                    "dominant_dimensions": top2
                }
        
        # Fallback: find closest match by distance
        best = None
        best_dist = float('inf')
        foundation_order = {"strong": 3, "developing": 2, "weak": 1}
        visibility_order = {"high": 3, "medium": 2, "low-medium": 1.5, "low": 1}
        
        target_f = foundation_order.get(foundation_cat.lower(), 0)
        target_v = visibility_order.get(visibility_cat.lower(), 0)
        
        for arch in archetypes:
            af = foundation_order.get(arch["foundation"].lower(), 0)
            av = visibility_order.get(arch["visibility"].lower(), 0)
            dist = abs(af - target_f) + abs(av - target_v)
            if dist < best_dist:
                best_dist = dist
                best = arch
        
        if best:
            ranked = self._get_dim_ranking(dimension_scores)
            top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
            return {
                "name": best["name"],
                "description": best.get("core_dynamic", ""),
                "dominant_dimensions": top2
            }
        
        ranked = self._get_dim_ranking(dimension_scores)
        top2 = [ranked[0][1]["name"], ranked[1][1]["name"]]
        return {"name": "Unmapped", "description": "No matching archetype", "dominant_dimensions": top2}
    
    def _archetype_fallback(self, dimension_scores):
        """Generic fallback: keyword match (old behavior)."""
        ranked = self._get_dim_ranking(dimension_scores)
        top_dims = [ranked[0][1]["name"], ranked[1][1]["name"]]
        top_dim_words = set()
        for td in top_dims:
            for word in td.lower().replace("-", " ").split():
                if len(word) > 3:
                    top_dim_words.add(word)
        
        best_match = None
        best_score = 0
        
        for arch in self.config["archetypes"]:
            arch_text = " ".join(str(v).lower() for v in arch.values() if v)
            match_count = sum(1 for w in top_dim_words if w in arch_text)
            for td in top_dims:
                dim_key = td.lower().split()[0]
                if dim_key in arch_text:
                    match_count += 2
            if match_count > best_score:
                best_score = match_count
                best_match = arch
        
        if best_match and best_score > 0:
            return {
                "name": best_match["name"],
                "description": best_match.get("core_dynamic", best_match.get("description", "")),
                "dominant_dimensions": top_dims
            }
        return {"name": "Unmapped", "description": "No matching archetype", "dominant_dimensions": top_dims}
    
    def _get_development_priorities(self, dimension_scores):
        ranked = sorted(dimension_scores.items(), key=lambda x: x[1]["normalised"])
        priorities = []
        for dim_id, data in ranked[:3]:
            priorities.append({
                "priority": len(priorities) + 1,
                "dimension": data["name"],
                "score": data["normalised"],
                "verdict": data["verdict"].get("verdict", "")
            })
        return priorities


def demo_all():
    """Run demo scoring for all 4 instruments with v2 archetype logic."""
    import random
    
    for name in ["LEAP", "QUEST", "IMPACT", "PRISM"]:
        scorer = ShiftScorer(name)
        random.seed(42)
        
        responses = {}
        for dim in scorer.config["dimensions"]:
            for qid in dim["question_ids"]:
                responses[qid] = random.randint(2, 5)
        
        result = scorer.score(responses)
        
        print(f"\n{'='*60}")
        print(f"{name}: {scorer.config['full_name']}")
        print(f"Composite: {result['composite']['score']}/100 ({result['composite']['band']})")
        print(f"Archetype: {result['archetype']['name']}")
        if result['archetype'].get('dominant_dimensions'):
            print(f"  Dominant: {', '.join(result['archetype']['dominant_dimensions'])}")
        print(f"  Description: {result['archetype'].get('description', '')[:120]}")
        print(f"Dimensions:")
        for dim_id, data in result["dimension_scores"].items():
            v = data["verdict"].get("verdict", "")
            print(f"  {data['name']}: {data['normalised']}/20 {v}")
        print(f"Development Priorities:")
        for p in result["development_priorities"]:
            print(f"  {p['priority']}. {p['dimension']} ({p['score']}/20)")


if __name__ == "__main__":
    demo_all()
