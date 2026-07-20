# T-204: Webinar Data Model & Seed Content (24 Entries)

**Phase:** 2 | **Batch:** 2B | **Effort:** 1 day
**CD Source:** CD18 (6-Month Webinar Calendar)
**Depends On:** T-201 (needs to know data structure)
**Blocks:** T-202 (needs data to render pages)

---

## What to Build

Create the data layer for webinars and seed all 24 entries from CD18.

## Data Model

```typescript
interface Webinar {
  slug: string;
  title: string;
  date: string; // ISO date
  time: string; // e.g., "2:00 PM SGT"
  duration: string; // e.g., "60 minutes"
  theme: string;
  description: string; // 2-3 paragraphs
  learning_points: string[]; // 3-5 bullets
  speaker: {
    name: string;
    title: string;
    bio: string;
    photo_url?: string;
  };
  guest?: {
    name: string;
    title: string;
    bio: string;
    photo_url?: string;
  };
  linked_diagnostic: string[]; // instrument IDs
  linked_programme?: string; // route
  linked_workshop?: string; // route
  status: 'upcoming' | 'past' | 'cancelled';
  replay_url?: string;
  registration_count?: number;
}
```

## Seed Data

Read `../cd_docs/CD18_FW1_6Month_Webinar_Calendar*` for all 24 webinar entries.
Create 2 webinar per month for 12 months (Aug 2026 – Jul 2027).

For each webinar, the CD provides:
- Theme/title
- Linked diagnostic
- Description
- Speaker info

## Storage

- JSON file at `data/webinars.json` (for static generation)
- Also seed into Supabase `webinars` table (for dynamic features like registration count)

## Acceptance Criteria

- [ ] All 24 webinars seeded with complete data
- [ ] Data model matches TypeScript interface
- [ ] JSON file created and validated
- [ ] Supabase table created and populated
- [ ] Linked diagnostics/programmes/workshops use correct routes
- [ ] Dates are correct (2 per month, Aug 2026 – Jul 2027)
