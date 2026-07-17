# 10 — Online Diagnostic Assessment Engine Spec

**Version:** 1.0 | **Phase:** 2.5 | **Author:** NEXUS | **Status:** Ready for Implementation  
**Depends on:** 09_SHIFT_Composite_Data_Model_Spec

---

## 1. Overview

Web-based interface for LYC's SHIFT Composite assessments. Executives complete assessments question-by-question, receive immediate composite scores, and compare against benchmarks.

### User Journeys
1. **Self-Assessment:** Link → briefing → 40-60 questions → instant composite + teaser insights
2. **360 Assessment:** Manager/peers rate → scores aggregated → multi-source composite
3. **Program Assessment:** Multiple executives in cohort → individual scores → cohort report

---

## 2. Assessment Flow

### 2.1 Pre-Assessment
- Landing page: instrument branding, time estimate, device check
- Briefing screen: purpose, confidentiality, estimated time
- Consent: GDPR-compliant data processing consent
- Language selection: English / 中文

### 2.2 Assessment UI
- **Question-by-question** (not survey grid)
- **5-point Likert scale** with labeled anchors
- **Progress bar** with count ("Question 23 of 48")
- **Save & Resume:** Auto-save every 5 responses; resume within 7 days
- **Timer:** Elapsed time display; warn at 80% estimated time
- **Navigation:** Back/Forward within same instrument; no skip
- **Mobile responsive:** Touch-optimized, min 44px tap targets

### 2.3 Post-Assessment
- Immediate composite score (0-100 gauge)
- Instrument breakdown (radar chart)
- 2-3 AI-generated teaser insights (locked behind full report)
- Download basic PDF
- Share with coach/consultant option

---

## 3. Results Dashboard

### 3.1 Individual Results
| Section | Content |
|---------|---------|
| Composite | Score 0-100, gauge visual, percentile vs benchmark |
| Instruments | 5 scores as horizontal bars or radar chart |
| APAC Translation | 5 sub-region scores with heatmap |
| Summary | Top strength, development area, engagement risk |
| Actions | View full report, download PDF, share |

### 3.2 Team/Group Results (Admin)
- Aggregate composite: mean, range, std dev
- Distribution histogram
- Instrument heat map
- Anonymized comparison (no names)
- Export: CSV + PDF

---

## 4. Frontend Components

| Component | Route | Description |
|-----------|-------|-------------|
| AssessmentLanding | /assessment/:id | Entry point, briefing |
| AssessmentConsent | /assessment/:id/consent | Data consent |
| AssessmentPlayer | /assessment/:id/play | Question-by-question |
| AssessmentProgress | /assessment/:id/progress | Save status |
| ResultsComposite | /assessment/:id/results | Score display |
| ResultsBreakdown | /assessment/:id/breakdown | Dimension scores |
| ResultsAPAC | /assessment/:id/apac | APAC scores |
| TeamResults | /team/:cohortId/results | Group view |

### State Management
```typescript
interface AssessmentState {
    assessmentId: string;
    currentQuestion: number;
    totalQuestions: number;
    responses: Map<string, ResponseValue>;
    timeElapsed: number;
    lastSavedAt: Date | null;
    isComplete: boolean;
}
```

---

## 5. API Integration

```
POST /api/shift/assessments     → Create session
GET  /api/shift/assessments/:id → Status + questions
POST .../respond                 → Submit responses (batch)
POST .../complete                → Finalize + trigger scoring
GET  .../scores                  → Get results
```

### Auto-Save
- Every 5 responses: batch POST to /respond
- On page unload: `navigator.sendBeacon()`
- Resume: GET assessment state from server

---

## 6. Scoring Trigger

On assessment complete:
1. Edge function `score-assessment` triggers
2. Load all responses
3. Compute dimension → instrument → composite scores
4. Compute APAC Translation scores
5. Compute percentiles vs benchmarks
6. Classify engagement risk
7. Store in score tables
8. Return to client

---

## 7. Accessibility
- WCAG 2.1 AA
- Keyboard navigation for Likert
- Screen reader labels
- High contrast mode
- Min 16px font

---

## 8. Exit Criteria
- [ ] Question-by-question UI with Likert scale
- [ ] Auto-save and resume
- [ ] Results dashboard: composite + instruments + APAC
- [ ] PDF export
- [ ] Mobile responsive
- [ ] WCAG 2.1 AA
