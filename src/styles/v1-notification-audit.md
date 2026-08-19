# V5.1 Notification System Audit

## DECISION
No notification bell. No notification center. No notifications page.

Why:
- Not present in any of the 8 design mockups.
- NEXUS positioning = quiet, always-on conversation — no pings.
- Sidebar singular "Conversation" — all context carries forward.

## Communication channels that DO exist:
1. **In-app conversation** — NEXUS talks directly to user inside single thread.
2. **Subtle InAppAlertBanner** — one-off banners above input bar, dismissible (rare).
3. **Email** — summaries, milestone reminders, session confirmations (handled by email system, not in-app UI).
4. **Toasts** — operational feedback (upload success, save confirmation, booking done). Not notifications per se.

## Files to REMOVE from route rendering (post-go-live cleanup):
- /pages/NotificationsPage.tsx — candidate/consultant/admin portals ONLY — not leader (NEXUS) portal.
- NotificationBell.tsx in client/ and notifications/ folders — consultants/clients only (keep, not part of V1 leader UX).

For go-live: LeaderNavV5 sidebar has NO "Notifications" entry. No bell in top bar. Correct.
