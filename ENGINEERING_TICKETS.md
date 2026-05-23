# LYC Intelligence — Engineering Tickets (Priority Fix)

## TICKET 1: Assessment Page — Lost Interactivity

### Title
Implement Interactive PHI Assessment Flow with Clickable Ratings, Style Selector, Progress Indicators, and PDF Export

### Problem
The current `AssessmentPage.tsx` is a basic email-gate followed by a static self-rate page. It lacks:
- Clickable multiple-choice options for the 5 PHI dimensions (Performance, Health, Influence, Innovation, Alignment)
- Descriptions and tooltips for each rating level
- A writing style selector (Analytical, Visionary, Pragmatic, Empathetic)
- Progress indicators to guide users through the multi-step flow
- An interactive flow leading to a combined PHI score and archetype result
- PDF export of results

### Solution
Redesign the assessment page as a multi-step interactive wizard:

1. **Step 1 – Email Gate**: Capture user email (store in Supabase). Basic validation.
2. **Step 2 – Dimension Self-Assessment**: For each of the 5 PHI dimensions, present:
   - Dimension name and short description
   - Clickable rating buttons (1–5 or Low–High) with labels and brief descriptions
   - Visual feedback (selected state, hover)
3. **Step 3 – Writing Style Selector**: Show 4 cards for Analytical, Visionary, Pragmatic, Empathetic. User picks one.
4. **Step 4 – Result Display**: Calculate PHI composite score + determine archetype. Show score breakdown, archetype name/description, "Download PDF" button.
5. **PDF Export**: Use `html2canvas` + `jspdf` to generate styled PDF.

**Component Structure**:
```
AssessmentPage
├── AssessmentLayout (wrapper with step indicator)
├── Step1_EmailGate (form with email input + validation)
├── Step2_DimensionRating
│   ├── DimensionCard (repeated 5 times)
│   └── RatingOptions (clickable buttons)
├── Step3_StyleSelector
│   └── StyleCard (repeated 4 times)
├── Step4_Result
│   ├── ScoreBreakdown (radar chart or bar chart)
│   ├── ArchetypeCard
│   └── PdfExportButton
└── ProgressBar
```

### Files to Modify
- `src/pages/AssessmentPage.tsx` — complete rewrite into multi-step component
- `src/services/assessmentEngine.ts` — add `calculatePHIScore(ratings, style)`, `determineArchetype(score, style)`
- `src/assessments/catalog.ts` — update dimension definitions, archetype descriptions, style definitions
- (New) `src/components/assessment/` — `EmailGate.tsx`, `DimensionCard.tsx`, `RatingOptions.tsx`, `StyleSelector.tsx`, `ResultPanel.tsx`, `ProgressBar.tsx`, `PdfExport.tsx`
- (Install) `html2canvas`, `jspdf` (already in project)

### Acceptance Criteria
- User can enter email and proceed; email is saved to Supabase
- Each dimension displays name, description, and 5 clickable rating buttons with hover/selected states
- Writing style selector shows 4 labeled cards; selection required to proceed
- Progress bar accurately reflects current step (1–4)
- Final result shows: composite PHI score (0–100), breakdown per dimension, archetype name + description
- "Download PDF" generates well-formatted PDF
- Dark theme compatible (#0A0A0A bg, #E5E5E5 text, #C108AB accent)

---

## TICKET 2: Funnel & Lead Generation Missing

### Title
Implement Email Capture and Lead Gating for B2B and B2C Landing Pages

### Problem
Both landing pages display value propositions but lack any mechanism to capture leads. Users can browse without providing contact info, resulting in zero conversion tracking or ability to gate high-value features.

### Solution

1. **Add email capture forms to both landing pages**
   - B2B form: Name, Work Email, Company → Supabase `b2b_leads` with source='b2b_landing' → redirect to `/match?email=<encoded>`
   - B2C form: Name, Email → `b2b_leads` with source='b2c_landing' → redirect to `/assessment?email=<encoded>`

2. **Free-credit gating logic**
   - On `/match` and `/assessment`, read `email` from URL param
   - Check remaining free credits (3 TRIDENT matches / 1 assessment)
   - If credits = 0, show sticky banner: "You've used all your free credits. Upgrade for unlimited — $29/mo"
   - Decrement credit count via Supabase

3. **Form component**
   - Reusable `LeadCaptureForm.tsx` with props: `flow: 'b2b' | 'b2c'`, `onSuccess: (email: string) => void`
   - Validate email, show loading state, inline errors
   - Styled: `bg-gray-800/50 border border-gray-700 rounded-xl p-6`
   - CTA button: `bg-[#C108AB] hover:bg-purple-700 text-white font-semibold`

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/B2BLanding.tsx` | Insert LeadCaptureForm with flow="b2b" |
| `src/pages/B2CLanding.tsx` | Insert LeadCaptureForm with flow="b2c" |
| `src/components/LeadCaptureForm.tsx` | New — form with validation, Supabase insert |
| `src/services/supabaseApi.ts` | Add `insertLead(email, name, company, source)` and `checkCredits(email)` |
| `src/pages/MatchPage.tsx` | Add credit check + upgrade banner |
| `src/pages/AssessmentPage.tsx` | Add credit check + upgrade banner |

### Acceptance Criteria
- B2B: Submit form → data in `b2b_leads` → redirects to `/match?email=...`
- B2C: Submit form → data in `b2b_leads` → redirects to `/assessment?email=...`
- Invalid email → inline error message
- After 3 free matches, upgrade banner appears
- Banner stays at top, doesn't block content
- Dark theme compatible

---

## TICKET 3: Nexus Chat Markdown/Table Formatting

### Title
Replace Custom Markdown Renderer with react-markdown + remark-gfm for Proper Table and List Rendering

### Problem
The NexusLanding.tsx chat renders markdown poorly — tables are broken, spacing is weird, lists don't render properly. Current approach uses a basic custom renderer.

### Solution

1. **Install dependencies**
   ```bash
   npm install react-markdown remark-gfm rehype-raw @tailwindcss/typography
   ```

2. **Integrate into NexusLanding.tsx**
   Replace existing text rendering with:
   ```tsx
   <ReactMarkdown
     remarkPlugins={[remarkGfm]}
     rehypePlugins={[rehypeRaw]}
     components={customComponents}
     className="prose prose-invert max-w-none"
   >
     {message.content}
   </ReactMarkdown>
   ```

3. **Custom table rendering** (dark theme):
   ```tsx
   const customComponents = {
     table: ({ children }) => (
       <div className="overflow-x-auto">
         <table className="min-w-full border-collapse border border-gray-700">
           {children}
         </table>
       </div>
     ),
     th: ({ children }) => (
       <th className="border border-gray-600 bg-gray-800 px-4 py-2 font-bold text-gray-200">
         {children}
       </th>
     ),
     td: ({ children }) => (
       <td className="border border-gray-600 px-4 py-2 text-gray-300">
         {children}
       </td>
     ),
     tr: ({ children }) => (
       <tr className="even:bg-[#1a1a1a] odd:bg-[#0a0a0a]">
         {children}
       </tr>
     ),
     code: ({ inline, className, children, ...props }) => {
       if (inline) return <code className="bg-gray-800 rounded px-1 text-sm text-[#C108AB]" {...props}>{children}</code>;
       return (
         <pre className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
           <code className={className} {...props}>{children}</code>
         </pre>
       );
     },
     ul: ({ children }) => <ul className="list-disc pl-6 space-y-1 text-gray-300">{children}</ul>,
     ol: ({ children }) => <ol className="list-decimal pl-6 space-y-1 text-gray-300">{children}</ol>,
     a: ({ href, children }) => <a href={href} className="text-[#C108AB] underline hover:text-purple-400" target="_blank">{children}</a>,
   };
   ```

4. **Add typography plugin to tailwind.config.js**
   ```js
   plugins: [require('@tailwindcss/typography')]
   ```

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/NexusLanding.tsx` | Replace custom renderer with ReactMarkdown + customComponents |
| `src/pages/NexusPage.tsx` | Same — internal chat also needs fix |
| `tailwind.config.js` | Add @tailwindcss/typography plugin |

### Acceptance Criteria
- Markdown tables render with borders, bold headers, alternating row colors
- Ordered and unordered lists render properly with indentation
- Code blocks render with dark background
- Inline code has accent color (#C108AB)
- Bold, italic, links work correctly
- No text overflow or broken layout
- Dark theme compatible (#0A0A0A bg, #E5E5E5 text, #C108AB accent)

---

## Architecture Context

- **Tech Stack**: React 18 + Vite + Tailwind CSS + Supabase + DeepSeek API
- **Design System**: Georgia serif headings, #0A0A0A bg, #E5E5E5 text, #C108AB CTA accent, 44px touch targets
- **Supabase**: URL in .env.example, anon key in .env.example
- **Dark theme only** — no light mode needed
- **Client-safe**: NEVER expose TRIDENT weights (40/35/25), internal stage names (SWEEP/CANVA/GRID/LENS/PLACED), or backend infrastructure (Notion/Supabase) in user-facing UI
- **English ONLY** on the platform
- **LYC Partners info**: Must match lyc-partners.ai — D3 Framework (Diagnose·Design·Deliver), 47 markets, 92% retention, 4 services, 5 sectors, Leaders in Motion podcast
