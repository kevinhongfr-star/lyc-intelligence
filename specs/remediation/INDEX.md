# Remediation Specs Index

All specs for fixing the UX audit findings. Each spec is self-contained and actionable by Trae.

| # | Spec | Priority | Effort | Key Issue |
|---|------|----------|--------|-----------|
| 01 | Auth Unification | P0 | 1-2 days | Dual auth systems (useAuth vs useAuthStore) |
| 02 | Client Portal | P0 | 3-5 days | Clients see consultant platform (data leak) |
| 03 | Candidate Portal | P0 | 3-4 days | Dead-end after assessment, no tracking |
| 04 | Role Navigation | P0 | 1-2 days | All users see same sidebar, no filtering |
| 05 | Consultant Experience | P1 | 4-6 days | No onboarding, no daily tasks, disconnected Nexus |
| 06 | BD Manager | P1 | 4-5 days | No BD experience at all |
| 07 | Team Lead | P1 | 4-5 days | No oversight, no approvals, no SLA |
| 08 | Design System | P2 | 1-2 days | DS duplicated in 12 files, TODOs |
| 09 | Admin Completion | P2 | 3-4 days | No user/credit management |

**Total estimated effort:** 24-35 days  
**Execution order:** 01 → 02+03+04 (parallel) → 05+06+07 (parallel) → 08+09
