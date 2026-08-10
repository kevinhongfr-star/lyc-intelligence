#!/usr/bin/env python3
"""LYC Partners — Diagnostic Report Generator (Group 4)
Team diagnostics, member insights, deviation analysis, outlier detection."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from lyc_components import *

OUTPUT_DIR = Path(__file__).parent / "reports" / "diagnostics"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE = {
    "diagnostic_type": "team",
    "subject": {"name": "Engineering Leadership Team", "size": 8, "context": "TechCorp Asia — Post-acquisition integration"},
    "diagnostic_scores": [
        {"dimension": "Dominance", "mean": 72, "median": 74, "std_dev": 12, "min": 48, "max": 92},
        {"dimension": "Influence", "mean": 58, "median": 60, "std_dev": 15, "min": 32, "max": 78},
        {"dimension": "Steadiness", "mean": 65, "median": 67, "std_dev": 10, "min": 45, "max": 82},
        {"dimension": "Conscientiousness", "mean": 55, "median": 52, "std_dev": 18, "min": 28, "max": 85}
    ],
    "deviations": [
        {"dimension": "Dominance", "team_mean": 72, "benchmark_mean": 58, "deviation": +14, "significant": True},
        {"dimension": "Influence", "team_mean": 58, "benchmark_mean": 55, "deviation": +3, "significant": False},
        {"dimension": "Steadiness", "team_mean": 65, "benchmark_mean": 52, "deviation": +13, "significant": True},
        {"dimension": "Conscientiousness", "team_mean": 55, "benchmark_mean": 62, "deviation": -7, "significant": True}
    ],
    "patterns": {
        "strength_cluster": ["Dominance", "Steadiness"],
        "risk_cluster": ["Conscientiousness"],
        "outlier_count": 2,
        "coherence_score": 0.78
    },
    "outliers": [
        {"member": "Member A", "dimension": "Steadiness", "value": 82, "team_mean": 65, "direction": "elevated"},
        {"member": "Member B", "dimension": "Conscientiousness", "value": 28, "team_mean": 55, "direction": "below"}
    ],
    "recommendations": [
        "Team shows significantly elevated Dominance (+14 vs benchmark) — high-agency culture but risk of internal friction during integration",
        "Below-benchmark Conscientiousness (-7) suggests need for structured processes, especially post-acquisition",
        "High Steadiness (+13) is an asset for retention — leverage this for team cohesion messaging",
        "Address outlier Member B's low Conscientiousness through targeted coaching or role adjustment"
    ]
}

def generate_diagnostic(data):
    subj = data["subject"]
    dims = [d["dimension"] for d in data["diagnostic_scores"]]
    means = [d["mean"] for d in data["diagnostic_scores"]]
    devs = [d["deviation"] for d in data["deviations"]]
    
    parts = []
    parts.append(build_header(client=subj["name"], date="2026-07-22"))
    parts.append('<div class="section">')
    parts.append(f'<h2 class="section-title">{subj["name"]} Diagnostic</h2>')
    parts.append(f'<p style="color:{B["muted"]};font-size:9pt">Team size: {subj["size"]} | Context: {subj["context"]}</p>')
    
    # Gauge Row — team means
    parts.append('<h3>Team Mean Scores</h3>')
    parts.append(svg_gauge_row(dims, means, width=560))
    
    # Deviation from Mean
    parts.append('<h3>Deviation from Benchmark</h3>')
    parts.append(svg_deviation_chart(dims, devs, width=560))
    
    # Pattern callout
    p = data["patterns"]
    parts.append(build_callout(f"""Team coherence score: <strong>{p['coherence_score']:.2f}</strong>. 
    Strength cluster: <strong>{', '.join(p['strength_cluster'])}</strong>. 
    Risk cluster: <strong>{', '.join(p['risk_cluster'])}</strong>. 
    {p['outlier_count']} outlier(s) detected."""))
    
    # Radar
    bench_means = [d["benchmark_mean"] for d in data["deviations"]]
    parts.append(svg_radar(dims, means, bench_means, width=350, height=300))
    
    # Outlier analysis
    parts.append('<h3>Outlier Analysis</h3>')
    headers = ["Member", "Dimension", "Value", "Team Mean", "Direction"]
    rows = []
    for o in data["outliers"]:
        dir_color = B["danger"] if o["direction"] == "below" else B["warning"]
        rows.append([o["member"], o["dimension"], str(o["value"]), str(o["team_mean"]),
                     f'<span style="color:{dir_color}">{o["direction"].upper()}</span>'])
    parts.append(build_table(headers, rows))
    
    # Recommendations
    parts.append('<h3>Recommendations</h3>')
    for rec in data["recommendations"]:
        parts.append(build_callout(rec))
    
    # Distribution stats table
    parts.append('<h3>Distribution Statistics</h3>')
    d_headers = ["Dimension", "Mean", "Median", "Std Dev", "Min", "Max"]
    d_rows = []
    for d in data["diagnostic_scores"]:
        d_rows.append([d["dimension"], str(d["mean"]), str(d["median"]), f"±{d['std_dev']}", str(d["min"]), str(d["max"])])
    parts.append(build_table(d_headers, d_rows))
    
    parts.append('</div>')
    parts.append(build_footer("1", "1"))
    return wrap_page("\n".join(parts), title=f"Diagnostic — {subj['name']}")

def main():
    html = generate_diagnostic(SAMPLE)
    out = OUTPUT_DIR / "Team_Diagnostic.html"
    out.write_text(html, encoding="utf-8")
    print(f"✅ Generated: {out} ({out.stat().st_size / 1024:.0f}KB)")

if __name__ == "__main__":
    main()
