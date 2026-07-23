# Nexus Email Generator Engine — Specification v2.1

**Date:** 2026-07-23  
**Status:** Awaiting GitHub issue creation  
**Decisions locked:**
- **Headline font:** Crimson Pro (canonical across all assets)
- **Dark backgrounds:** Fully retired, all contexts

---

## 1. Design Principles

### 1.1 No Agent Names in Application Layer
All user-facing features, communications, and integrations present as **"Nexus"** — a single unified AI assistant. Internal multi-agent orchestration (Marcus, Maria, ECHO, Amélie, etc.) is invisible to end users.

### 1.2 Sender Identity
| Context | Sender Name | Email Address |
|---------|-------------|---------------|
| Standard outbound | Nexus | nexus@lyc-partners.ai |
| Executive communications | Kevin Hong | kevin.hong@lyc-partners.ai |
| Follow-ups / nurture | Nexus | nexus@lyc-partners.ai |

### 1.3 Brand Voice (from MASTER DOC 2 + ECHO Guidelines)
- Direct, calm, precise
- Teacher not salesperson
- Situation-first framing
- No emoji, no exclamation marks, no filler
- No invented statistics or commercial language
- Active voice, short sentences

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER-FACING LAYER                        │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐ │
│   │              NEXUS EMAIL ENGINE                      │ │
│   │                                                      │ │
│   │  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│   │  │   Request   │→│    Brand     │→│  Content   │ │ │
│   │  │   Intake    │  │ Lens Selector│  │ Generator  │ │ │
│   │  └─────────────┘  └──────────────┘  └────────────┘ │ │
│   │         ↓                ↓                 ↓        │ │
│   │  ┌─────────────────────────────────────────────┐   │ │
│   │  │         Quality Gate (10 checks)            │   │ │
│   │  └─────────────────────────────────────────────┘   │ │
│   │         ↓                                           │ │
│   │  ┌─────────────┐  ┌──────────────┐                │ │
│   │  │  Approval   │→│    Send /    │                │ │
│   │  │  Workflow   │  │    Log       │                │ │
│   │  └─────────────┘  └──────────────┘                │ │
│   └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│              INTERNAL ORCHESTRATION LAYER                   │
│              (invisible to end users)                       │
│                                                             │
│   Nexus ↔ Search Ops    Nexus ↔ Delivery Ops               │
│   Nexus ↔ CRM Sync      Nexus ↔ Analytics                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Input Parameter Schema

Every email request requires:

```yaml
email_request:
  type: string  # service_intro | podcast_invite | webinar_invite | workshop_invite | coaching_intro | advisory_intro | follow_up | cold_outreach
  brand_lens: string  # LYC Partners | Nexus | GRID | MERIDIAN | Valentina
  recipient:
    name: string
    email: string
    role: string  # optional
    company: string  # optional
  sender: string  # "Nexus" (default) or "Kevin Hong" (executive only)
  content:
    subject_override: string  # optional, else auto-generated
    key_message: string  # 1-2 sentences
    cta: string  # call-to-action
    context: string  # background / situation
  constraints:
    word_count_max: integer  # default 200
    tone_override: string  # optional
    urgency: string  # low | medium | high
  metadata:
    campaign_id: string  # optional
    template_id: string  # optional
    priority: string  # normal | high
```

---

## 4. Brand Governance Rules (Machine-Readable)

### 4.1 Banned Words & Replacements
```json
{
  "banned_patterns": [
    {"pattern": "architecture", "replacement": "structure|design"},
    {"pattern": "resonance", "replacement": "fit|alignment"},
    {"pattern": "calibration", "replacement": "alignment|adjustment"},
    {"pattern": "sovereignty gap", "replacement": "gap between HQ and local markets"},
    {"pattern": "leverage", "replacement": "use|apply"},
    {"pattern": "synergy", "replacement": "collaboration|partnership"},
    {"pattern": "disrupt", "replacement": "transform|reshape"},
    {"pattern": "revolutionary", "replacement": "innovative|novel"}
  ]
}
```

### 4.2 Structural Rules
- **Subject line:** 4-8 words, situation-first, no clickbait
- **Opening:** Context in first sentence (who/what/why now)
- **Body:** One idea per paragraph, max 3-4 paragraphs
- **Close:** Clear next step, no filler ("Let me know if you have any questions" → banned)
- **Sign-off:** "Best, [First Name]" or just "[First Name]"
- **Signature block:** ● ● ● + "Diagnose. Design. Deliver." (mandatory)
- **No-confusion rule:** Recipient can identify which LYC brand this is from within 3 seconds

### 4.3 Visual Standards
- **Headline font:** Crimson Pro (canonical)
- **Body font:** Inter or system sans-serif
- **Dark backgrounds:** Fully retired (all contexts)
- **Color palette:** LYC brand colors only (navy, white, accent gold)

---

## 5. Template Variable System

Standardized placeholders across all email types:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{recipient_name}}` | First name | "Sarah" |
| `{{recipient_role}}` | Job title | "Head of Talent" |
| `{{recipient_company}}` | Organization | "Acme Corp" |
| `{{sender_name}}` | "Nexus" or "Kevin Hong" | "Nexus" |
| `{{brand_name}}` | Active brand lens | "LYC Partners" |
| `{{key_message}}` | Core content | "We're launching a new..." |
| `{{cta_text}}` | Call-to-action | "Register here" |
| `{{cta_link}}` | URL | "https://..." |
| `{{follow_up_context}}` | Previous interaction | "Following our conversation on..." |
| `{{date}}` | Event/meeting date | "March 15, 2026" |
| `{{time}}` | Event time | "14:00 CST" |
| `{{location}}` | Venue or link | "Shanghai / Zoom" |

---

## 6. Quality Gate (10 Automated Checks)

| ID | Check | Pass Criteria |
|----|-------|---------------|
| QG-01 | Banned word scan | 0 matches in banned_patterns list |
| QG-02 | Emoji detection | 0 emoji characters |
| QG-03 | Exclamation mark count | 0 exclamation marks |
| QG-04 | Subject line length | 4-8 words |
| QG-05 | Total word count | ≤ 200 words (or custom max) |
| QG-06 | Paragraph structure | Max 1 idea per paragraph, ≤ 4 paragraphs |
| QG-07 | Filler phrase detection | 0 instances of banned closings |
| QG-08 | No-confusion check | Brand lens identifier present in first 3 lines |
| QG-09 | Signature block validation | ● ● ● + tagline present |
| QG-10 | CTA clarity | Single clear call-to-action, no ambiguity |

**Gate logic:** All 10 checks must pass. If any fail → return to generator with specific error messages. No manual override allowed (Kevin approval required for exceptions).

---

## 7. Integration Points

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| SMTP / SendCloud | Outbound | Email delivery |
| CRM (Notion / Airtable) | Write-back | Log sent emails, track responses |
| Feishu | Notification | Approval workflow (Kevin review) |
| Analytics | Event stream | Track open rates, reply rates, CTA clicks |
| Search Ops | Internal | Retrieve recipient context, company info |
| Delivery Ops | Internal | Handle bounces, retries, scheduling |

---

## 8. GitHub Issue Breakdown

**EPIC:** Nexus Email Generator Engine  
**Total tickets:** 20  
**Estimated effort:** ~82 hours  
**P0 critical path:** A1-A4, B1, C1, D1, E1 (~40 hours)

### Module A: Core Engine (5 tickets, ~28h)

**A1: Email Request Schema Validator** — 4h  
Validate incoming requests against YAML schema. Reject malformed inputs with specific error messages.  
*Labels:* `backend`, `schema`, `P0`

**A2: Brand Lens Selector** — 6h  
Route requests to correct brand voice profile (LYC Partners, Nexus, GRID, MERIDIAN, Valentina). Load brand-specific templates, CTAs, and signature blocks.  
*Labels:* `backend`, `brand-governance`, `P0`

**A3: LLM Voice Engine** — 8h  
Generate email drafts using DeepSeek API. Apply brand voice rules (direct, calm, precise, teacher-not-salesperson). Enforce situation-first framing.  
*Labels:* `backend`, `llm`, `P0`

**A4: Content Generator** — 6h  
Assemble final email from template + variables + generated content. Handle dynamic sections (recipient context, CTAs, signatures).  
*Labels:* `backend`, `P0`

**A5: Template Variable System** — 4h  
Implement `{{variable}}` substitution engine. Support conditional blocks (e.g., `{{#if follow_up_context}}...{{/if}}`).  
*Labels:* `backend`, `templates`

### Module B: Brand Governance (3 tickets, ~14h)

**B1: Banned Word Scanner** — 6h  
Scan generated content against banned_patterns list. Auto-replace or flag violations. Return specific error messages (e.g., "Replace 'architecture' with 'structure' or 'design'").  
*Labels:* `brand-governance`, `quality-gate`, `P0`

**B2: Structure Validator** — 4h  
Validate email structure: subject line length, paragraph count, word count, no-confusion rule.  
*Labels:* `brand-governance`, `quality-gate`

**B3: Signature Block Enforcer** — 4h  
Ensure every email includes ● ● ● + "Diagnose. Design. Deliver." in signature block.  
*Labels:* `brand-governance`, `quality-gate`

### Module C: Templates (3 tickets, ~10h)

**C1: Machine-Readable Template Library** — 4h  
Convert 8 email templates (service_intro, podcast_invite, etc.) to JSON/YAML format with variable placeholders.  
*Labels:* `templates`, `P0`

**C2: Template Selection Logic** — 3h  
Auto-select template based on `email_request.type`. Allow manual override with justification.  
*Labels:* `templates`

**C3: Lens-Specific CTA Library** — 3h  
Define CTAs per brand lens (e.g., LYC Partners → "Schedule a diagnostic", Nexus → "Explore the platform").  
*Labels:* `templates`, `brand-governance`

### Module D: Quality Gate (2 tickets, ~8h)

**D1: Pre-Send Quality Gate** — 6h  
Implement QG-01 through QG-10 checks. Block send if any fail. Return detailed error report.  
*Labels:* `quality-gate`, `P0`

**D2: Kevin Approval Workflow** — 2h  
Route flagged emails to Feishu for Kevin review. Support approve/reject/edit actions.  
*Labels:* `approval`, `feishu`

### Module E: Delivery + Logging (3 tickets, ~12h)

**E1: SMTP / SendCloud Integration** — 6h  
Configure email delivery via SMTP or SendCloud API. Handle authentication, TLS, rate limiting.  
*Labels:* `delivery`, `P0`

**E2: CRM Write-Back** — 4h  
Log sent emails to CRM (Notion/Airtable). Include: recipient, subject, timestamp, campaign_id, response status.  
*Labels:* `crm`, `logging`

**E3: Delivery Tracking** — 2h  
Track delivery status (sent, delivered, bounced, opened, replied). Update CRM records.  
*Labels:* `delivery`, `analytics`

### Module F: Agent Integration (2 tickets, ~6h)

**F1: Nexus ↔ Search Ops Pipeline** — 3h  
Internal routing: Nexus requests recipient/company context from Search Ops. Returns structured data for personalization.  
*Labels:* `integration`, `internal`

**F2: Nexus ↔ Delivery Ops Pipeline** — 3h  
Internal routing: Nexus hands off approved emails to Delivery Ops for sending. Receives delivery confirmations.  
*Labels:* `integration`, `internal`

### Module G: Consistency Fixes (2 tickets, ~4h)

**G1: Patch ECHO Guidelines Gaps** — 2h  
Add missing items to ECHO Email Guidelines: explicit banned word replacements, no-confusion checklist item, signature block requirement.  
*Labels:* `documentation`, `brand-governance`

**G2: Cross-Agent Audit** — 2h  
Audit all existing email templates across internal agents. Ensure alignment with new engine rules. Migrate or deprecate as needed.  
*Labels:* `audit`, `brand-governance`

---

## 9. GitHub Issue Markdown Template

```markdown
---
name: A1 - Email Request Schema Validator
about: Validate incoming email requests against YAML schema
title: '[A1] Email Request Schema Validator'
labels: backend, schema, P0
assignees: ''
milestone: 'Email Generator Engine'
---

## Description
Implement a schema validator for incoming email requests. All requests must conform to the YAML schema defined in `docs/email_request_schema.yaml`.

## Acceptance Criteria
- [ ] Validate all required fields: `type`, `brand_lens`, `recipient`, `sender`, `content`
- [ ] Reject malformed inputs with specific error messages
- [ ] Support optional fields: `constraints`, `metadata`
- [ ] Return structured error report (JSON) on validation failure
- [ ] Unit tests cover all edge cases

## Technical Notes
- Use JSON Schema or Pydantic for validation
- Error messages must be actionable (e.g., "Missing required field: recipient.email")
- Log validation failures for debugging

## Dependencies
- None (foundational component)

## Estimated Effort
4 hours

## Related Issues
- A2 (Brand Lens Selector)
- A3 (LLM Voice Engine)
```

---

## 10. Implementation Sequence

**Phase 1 (P0, ~40h, Weeks 1-2):**
1. A1: Schema Validator
2. A2: Brand Lens Selector
3. B1: Banned Word Scanner
4. C1: Template Library (machine-readable)
5. D1: Quality Gate
6. A3: LLM Voice Engine
7. A4: Content Generator
8. E1: SMTP Integration

**Phase 2 (Weeks 3-4):**
9. A5: Template Variable System
10. B2: Structure Validator
11. B3: Signature Block Enforcer
12. C2: Template Selection Logic
13. C3: Lens-Specific CTAs
14. D2: Approval Workflow
15. E2: CRM Write-Back

**Phase 3 (Week 5):**
16. E3: Delivery Tracking
17. F1: Search Ops Pipeline
18. F2: Delivery Ops Pipeline
19. G1: Patch ECHO Guidelines
20. G2: Cross-Agent Audit

---

## 11. Open Questions

- [ ] **Email provider:** SendCloud vs. direct SMTP? (Kevin to decide based on cost/volume)
- [ ] **CRM target:** Notion database or Airtable? (Kevin to confirm)
- [ ] **Approval workflow:** All emails require Kevin approval, or only high-priority/executive comms?

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Quality gate pass rate | ≥ 85% first-pass |
| Average generation time | < 10 seconds |
| Banned word violations | 0 in production |
| Email deliverability | ≥ 98% |
| Response rate (outbound) | Baseline → +15% after 3 months |

---

**Version:** 2.1  
**Last updated:** 2026-07-23 18:16  
**Author:** Nexus (LYC Partners)
