# Trae Next Steps — Post-Audit Execution Plan

## Current Status
✅ Audit phase in progress — identified existing implementations
✅ Found key files for SHIFT, Assessment, Cohort, Legal, Nexus, Intelligence
🔄 Need to complete gap analysis and begin implementation

---

## Immediate Next Actions

### 1. Complete the Audit (Finish Today)
- [ ] Document what EXISTS vs what's MISSING for each of the 120 tickets
- [ ] Create a gap analysis spreadsheet with columns:
  - Ticket # | Title | Status (Exists/Partial/Missing) | Gap Description | Priority
- [ ] Identify dependencies between tickets (what blocks what)

### 2. Start Batch 1: Remediation Items (REM_05–09)
These are cleanup/fix items — do them first to stabilize the codebase:

**REM_05: Consultant Experience**
- Check: `/workspace/src/components/dashboard/ConsultantDashboard.tsx`
- Missing: onboarding flow, daily tasks widget, Nexus integration
- Action: Build missing components, wire up to existing dashboard

**REM_06: BD Manager Experience**
- Check: `/workspace/src/components/bd/` directory
- Missing: BD-specific dashboard, pipeline view
- Action: Create BD dashboard page, connect to existing data

**REM_07: Team Lead Experience**
- Check: `/workspace/src/components/dashboard/TeamLeadDashboard.tsx`
- Missing: oversight panels, approval workflows, SLA tracking
- Action: Add approval queue, SLA monitoring widgets

**REM_08: Design System Dedup**
- Check: `/workspace/src/components/design-system/` (9 files) + `/workspace/src/shared/` + `/workspace/src/ui/`
- Missing: consolidation of duplicate tokens/components
- Action: Merge duplicates, update imports across codebase, delete old files

**REM_09: Admin Completion**
- Check: `/workspace/src/pages/admin/` (multiple pages exist)
- Missing: user management, credit management
- Action: Build user admin page, credit allocation system

### 3. Move to Batch 2: Core Portal Features (#8–#12)
Once Batch 1 is done, tackle these in order:

1. **#8 Intelligence Layer Data Pipeline** — Wire up data ingestion
2. **#9 Council Portal Public Pages** — Build public-facing council pages
3. **#10 Council Dashboard & Community** — Add community features
4. **#11 Council Admin Management** — Council member admin tools
5. **#12 Internal Portal** — Complete `/app/` routes (currently missing)

### 4. Batch 3–5: Extended Portals (#13–#38)
- Client Portal (#13) → Candidate Portal (#14) → Performance (#16) → Academy (#17) → Student Dashboard (#19)
- SHIFT Model (#18) → Assessment Engine (#20) → Cohort Analytics (#21) → Reports (#22–#24)
- Custom Domain (#27) → Legal Pages (#30) → Onboarding (#32) → Analytics (#38) → Activation (#35)

### 5. Batch 6–7: Nexus & Intelligence (#39–#48)
- Nexus Conversation Engine (#39) → Memory System (#40) → Context Assembly (#41) → RAG Library (#42) → Proactive Suggestions (#43)
- Journey Dashboard (#44) → Stripe Integration (#45) → Nexus Phase 1 Master (#46) → Sprints (#47–#48)

### 6. Batch 8–31: Report Engine & Email (#49–#120)
- Sprint tickets S2–S12 (#49–#59)
- Report Engine Epic (#60–#100) — 41 tickets, massive
- Email Admin Engine (#101–#120) — 20 tickets

---

## Execution Strategy

### For Each Batch:
1. **Read the spec** — Click the spec link in the build instructions
2. **Check what exists** — Search codebase for existing implementations
3. **Identify gaps** — What's missing vs spec requirements
4. **Implement missing pieces** — Write code, create components, wire up
5. **Test locally** — Run `npm run dev`, verify functionality
6. **Commit & push** — `git add . && git commit -m "Fix #XX: description" && git push`
7. **Close ticket** — Update GitHub issue status

### Key Principles:
- **Don't rebuild what exists** — Enhance, don't replace
- **Follow the specs** — Each ticket links to a spec document
- **Test incrementally** — Don't batch 20 changes before testing
- **Commit often** — Small, atomic commits per ticket
- **Ask if blocked** — If spec is unclear, ask Kevin before guessing

---

## What I (NEXUS) Will Handle After Trae Finishes

### Troubleshooting:
- Review Trae's commits for bugs/issues
- Test all portals end-to-end
- Fix any broken integrations
- Verify Supabase RLS policies work correctly
- Check Vercel deployment succeeds

### Cleanup:
- Remove any debug/test code
- Ensure all console.log statements are removed
- Verify no hardcoded secrets in code
- Update README with new features
- Close all completed GitHub issues
- Update project documentation

### Deployment:
- Trigger Vercel production deployment
- Verify www.lyc-intelligence.app is live
- Test all portals on production
- Confirm domain routing works

---

## Timeline Estimate

| Phase | Tickets | Estimated Time |
|-------|---------|----------------|
| Audit completion | — | 1–2 hours |
| Batch 1 (Remediation) | 5 tickets | 2–3 hours |
| Batch 2 (Core Portals) | 5 tickets | 3–4 hours |
| Batch 3–5 (Extended) | 15 tickets | 6–8 hours |
| Batch 6–7 (Nexus) | 10 tickets | 4–5 hours |
| Batch 8–31 (Reports/Email) | 60 tickets | 12–15 hours |
| **Total Trae work** | **~95 tickets** | **28–37 hours** |
| NEXUS troubleshooting | — | 3–4 hours |
| NEXUS cleanup | — | 2–3 hours |
| **Total to go-live** | — | **33–44 hours** |

**Target:** Live within 24 hours as requested → Trae needs to work fast, prioritize P0 items first.

---

## Priority Order (If Time-Constrained)

If 24 hours is tight, focus on this order:
1. **P0 (Must have):** REM_01–04 (Auth, Design System, Public Site, Backend)
2. **P1 (Core portals):** #8–#12 (Council, Internal, Intelligence)
3. **P2 (Extended portals):** #13–#14, #16–#19 (Client, Candidate, Academy)
4. **P3 (Nice to have):** #20–#46 (Assessments, Reports, Nexus)
5. **P4 (Can defer):** #47–#120 (Sprints, advanced features)

---

## Questions for Kevin (If Blocked)

Trae should ask Kevin if:
- Spec is ambiguous or contradictory
- Found conflicting implementations
- Need product decisions (UI/UX choices)
- Unclear about data model relationships
- Need API keys or external service config

Otherwise, proceed with best judgment and document decisions.
