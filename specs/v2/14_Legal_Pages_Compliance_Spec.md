# 14 — Legal Pages & Compliance Spec

**Version:** 1.0 | **Phase:** Go-Live Prerequisite | **Author:** NEXUS | **Status:** Ready for Implementation

---

## 1. Overview

Legal pages are a mandatory prerequisite before collecting any user data. DEX AI processes personal data (executive profiles, assessment responses, company information) across multiple jurisdictions (PRC, EU, APAC). This spec defines the pages, compliance flows, and technical implementation.

---

## 2. Required Pages

### 2.1 Terms of Service (`/terms`)
| Section | Content |
|---------|---------|
| Acceptance | By using DEX AI, you agree to these terms |
| Service Description | Platform capabilities, AI-powered advisory |
| User Accounts | Registration, security, account termination |
| Payment & Credits | Credit packs, Council subscriptions, refund policy |
| AI-Generated Content | Disclaimer: AI outputs are advisory, not professional advice |
| Intellectual Property | User content ownership, LYC IP protection |
| Data Processing | Reference to Privacy Policy |
| Limitation of Liability | Cap on damages, no warranty on AI outputs |
| Governing Law | PRC law + arbitration clause (Shanghai) |
| Amendments | How terms changes are communicated |

### 2.2 Privacy Policy (`/privacy`)
| Section | Content |
|---------|---------|
| Data Controller | LYC Partners (Shanghai) |
| Data Collected | Account data, assessment responses, usage analytics |
| Processing Purpose | Service delivery, intelligence reports, analytics |
| Legal Basis | Consent, contract performance, legitimate interest |
| Data Retention | Account data: duration of account + 3 years; Assessments: 5 years |
| Third Parties | DeepSeek (AI processing), Supabase (hosting), Stripe (payments) |
| Cross-Border Transfers | Data stored in Singapore (Supabase); AI processing via DeepSeek |
| User Rights | Access, rectify, delete, port, object, restrict |
| Cookies | Reference to Cookie Policy |
| Contact | DPO contact information |

### 2.3 Cookie Policy (`/cookies`)
- Essential cookies (auth session)
- Analytics cookies (Vercel Analytics)
- Consent mechanism with granular controls

---

## 3. Compliance Flows

### 3.1 GDPR Compliance (EU Users)
| Right | Implementation |
|-------|---------------|
| Access | API endpoint: GET /api/user/data-export |
| Rectify | Profile edit + assessment re-take |
| Erasure | Account deletion flow (soft delete → 30-day hard delete) |
| Portability | JSON/CSV export of all user data |
| Object | Toggle off analytics processing |
| Restrict | Freeze account without deletion |

### 3.2 China PIPL Compliance (PRC Users)
| Requirement | Implementation |
|-------------|---------------|
| Separate consent | Explicit checkbox for assessment data (sensitive personal info) |
| Cross-border | Disclosure that data processed outside mainland China |
| Data localization | Option to store PRC user data on domestic Supabase instance |
| DPO appointment | Named data protection officer |
| Impact assessment | Documented DPIA for assessment processing |

### 3.3 Cookie Consent Banner
```
┌──────────────────────────────────────────────────────┐
│  🔒 We use cookies to improve your experience.      │
│                                                      │
│  [Essential Only]  [Accept All]  [Customize]        │
│                                                      │
│  Essential: Authentication, security (always on)     │
│  Analytics: Usage statistics (optional)              │
│                                                      │
│  See our Cookie Policy | Privacy Policy              │
└──────────────────────────────────────────────────────┘
```

---

## 4. Technical Implementation

### 4.1 Database Tables
```sql
-- Consent tracking
CREATE TABLE v2_user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    consent_type VARCHAR(30) NOT NULL,  -- terms, privacy, cookies_essential, cookies_analytics, assessment_data, marketing
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    version VARCHAR(20) NOT NULL,  -- Policy version at time of consent
    ip_address INET,
    user_agent TEXT
);

-- Data export requests (GDPR portability)
CREATE TABLE v2_data_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, processing, completed, failed
    format VARCHAR(10) DEFAULT 'json',  -- json, csv
    file_url TEXT,
    expires_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Account deletion requests
CREATE TABLE v2_deletion_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES v2_user_profiles(id),
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, cancelled, completed
    scheduled_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
```

### 4.2 Frontend Components
| Component | Route | Description |
|-----------|-------|-------------|
| TermsPage | /terms | Static legal page |
| PrivacyPage | /privacy | Static legal page |
| CookiePolicyPage | /cookies | Static legal page |
| CookieConsentBanner | (global) | First-visit banner |
| DataExportForm | /settings/data | Request data export |
| DeleteAccountForm | /settings/account | Request account deletion |
| ConsentSettings | /settings/consent | Manage consent preferences |

### 4.3 API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/user/consent | Record consent |
| GET | /api/user/consent | Get consent history |
| POST | /api/user/data-export | Request data export |
| GET | /api/user/data-export/:id | Download exported data |
| POST | /api/user/delete-account | Request account deletion |
| POST | /api/user/delete-account/cancel | Cancel deletion request |

---

## 5. Content Requirements

### Bilingual
- English version: primary
- Chinese version (中文): required for PRC PIPL compliance
- Language toggle on each legal page

### Review & Approval
- Legal text must be reviewed by LYC legal counsel
- Kevin approves before publishing
- Version-controlled (each change creates new version)
- Users re-consent when material changes occur

---

## 6. Exit Criteria
- [ ] Terms of Service page live (EN + ZH)
- [ ] Privacy Policy page live (EN + ZH)
- [ ] Cookie Policy page live
- [ ] Cookie consent banner functional on first visit
- [ ] Account deletion flow: request → 30-day wait → hard delete
- [ ] Data export flow: request → generate → download (within 72h)
- [ ] Consent preferences manageable in settings
- [ ] Assessment data consent checkbox before starting assessment
- [ ] Legal text reviewed by counsel and approved by Kevin
