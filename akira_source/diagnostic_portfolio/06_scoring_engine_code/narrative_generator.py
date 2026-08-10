"""
DRIVE v2 Narrative Generator — LYC Partners
Takes scored profile JSON → human-readable interpretation via DeepSeek API
"""
import json
import os
import requests

# Load DeepSeek config
with open("./主对话/SECRET.md") as f:
    for line in f:
        if "DEEPSEEK_API_KEY" in line:
            DS_KEY = line.split("=", 1)[1].strip()
            break

DS_URL = "https://api.deepseek.com/v1/chat/completions"

def generate_narrative(profile: dict) -> str:
    """Generate full narrative interpretation from scored profile."""
    
    archetype = profile["archetype"]
    band = profile["composite_band"]
    er = profile["engagement_risk"]
    mt = profile["motivation_type"]
    dims = profile["dimension_scores"]
    
    system_prompt = f"""You are a senior organisational psychologist writing a DRIVE v2 diagnostic narrative for an executive client. Your tone is direct, analytical, respectful — board-level language. No filler, no platitudes, no corporate clichés.

You have access to the following reference data for the {archetype['name']} archetype:
- Pattern: {archetype['pattern']}
- Risk: {archetype['risk']}
- Motivation Type: {archetype['motivation_type']}
- Engagement State: {er['state']}

Write in the voice of Kevin Hong — sharp, specific, APAC-cross-border aware. Never use phrases like "unlock your potential" or "journey of growth." Say what you mean."""

    user_prompt = f"""Generate a complete DRIVE diagnostic narrative for this executive. Structure it exactly as follows:

## 1. Executive Summary (3-4 sentences)
What the DRIVE profile reveals about this person's motivational architecture. Lead with the most important finding.

## 2. Archetype Assessment: {archetype['name']}
- What {archetype['name']} means: their core motivational pattern
- How this manifests in their current role
- The specific risk: {archetype['risk']}
- What this looks like in APAC cross-border contexts (if relevant to their scores)

## 3. Dimension-by-Dimension Analysis
For each of the 5 dimensions, write 2-3 sentences on:
- What their score means in plain language
- The specific sub-dimension that's strongest and weakest
- How this dimension interacts with their archetype

Dimension scores:
- D1 Intrinsic Motivation: {dims['D1']['normalised']}/100
- D2 Extrinsic Motivation: {dims['D2']['normalised']}/100  
- D3 Values Alignment: {dims['D3']['normalised']}/100
- D4 Confidence & Self-Efficacy: {dims['D4']['normalised']}/100
- D5 Growth Orientation: {dims['D5']['normalised']}/100

## 4. Engagement Risk Assessment
Score: {er['score']}/100 — State: {er['state']}
What this means concretely. What specific warning signs are present. What the trajectory looks like if nothing changes.

## 5. Key Tensions
Identify 2-3 specific tensions in their profile (e.g., "extremely high growth appetite but flickering engagement — this is someone who has outgrown their mandate").

## 6. Strategic Recommendations
5-7 specific, actionable recommendations based on their archetype and scores. Not generic coaching advice — concrete moves that address their specific motivational architecture.

## 7. What To Watch
Early warning signs specific to {archetype['name']} archetype. What would indicate they're moving toward Burned-Out vs. re-engaging.

Full profile data:
{json.dumps(profile, indent=2)}"""

    resp = requests.post(DS_URL, headers={
        "Authorization": f"Bearer {DS_KEY}",
        "Content-Type": "application/json"
    }, json={
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": 4000,
        "temperature": 0.4
    })
    
    result = resp.json()
    if "choices" in result:
        return result["choices"][0]["message"]["content"]
    else:
        return f"ERROR: {result}"


if __name__ == "__main__":
    # Load the test profile
    import sys
    sys.path.insert(0, os.path.dirname(__file__))
    from drive_v2_engine import score_responses
    
    test_responses = {
        "DRIVE_Q01": 5, "DRIVE_Q02": 4, "DRIVE_Q03": 2, "DRIVE_Q04": 5, "DRIVE_Q05": 4, "DRIVE_Q06": 5,
        "DRIVE_Q07": 3, "DRIVE_Q08": 3, "DRIVE_Q09": 4, "DRIVE_Q10": 3, "DRIVE_Q11": 3, "DRIVE_Q12": 3,
        "DRIVE_Q13": 4, "DRIVE_Q14": 5, "DRIVE_Q15": 2, "DRIVE_Q16": 4, "DRIVE_Q17": 5, "DRIVE_Q18": 4,
        "DRIVE_Q19": 5, "DRIVE_Q20": 4, "DRIVE_Q21": 2, "DRIVE_Q22": 5, "DRIVE_Q23": 4, "DRIVE_Q24": 4,
        "DRIVE_Q25": 5, "DRIVE_Q26": 5, "DRIVE_Q27": 1, "DRIVE_Q28": 5, "DRIVE_Q29": 4, "DRIVE_Q30": 5,
        "DRIVE_Q31": 3, "DRIVE_Q32": 3, "DRIVE_Q33": 3, "DRIVE_Q34": 4, "DRIVE_Q35": 3, "DRIVE_Q36": 2,
    }
    
    profile = score_responses(test_responses)
    
    print("Generating narrative via DeepSeek...")
    narrative = generate_narrative(profile)
    
    # Save narrative
    with open("LYC_Engine/test_narrative.md", "w") as f:
        f.write(f"# DRIVE v2 Diagnostic Narrative\n\n")
        f.write(f"**Archetype:** {profile['archetype']['name']}\n")
        f.write(f"**Composite:** {profile['composite_score']}/100 — {profile['composite_band']['band']}\n")
        f.write(f"**Engagement Risk:** {profile['engagement_risk']['score']}/100 — {profile['engagement_risk']['state']}\n")
        f.write(f"**Motivation Type:** {profile['motivation_type']}\n\n---\n\n")
        f.write(narrative)
    
    print("Narrative saved to LYC_Engine/test_narrative.md")
    print(f"\n{'='*80}")
    print(narrative)
