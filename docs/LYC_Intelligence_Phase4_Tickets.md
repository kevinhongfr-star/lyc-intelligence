# LYC Intelligence — Phase 4 Tickets (GRID Integration)

**Version:** 1.0
**Date:** 2026-07-10
**Scope:** 6 modules | 114-156h | Weeks 16-22
**Dependencies:** Phase 1 (T1-T6) + Phase 2 (T7-T16) + Phase 3 (T17-T22) must be complete
**Prerequisite:** All P0, P1, P2 features operational

---

## Phase 4 Overview

Phase 4 integrates the **GRID Intelligence Platform** — LYC's proprietary executive search intelligence engine — into LYC Intelligence. GRID transforms raw market, company, candidate, and compensation data into actionable deliverables: market maps, target company lists, candidate tiering/grading, go/no-go analysis, compensation benchmarking, and branded PDF reports.

**Production-validated:** All algorithms are proven against the Yacoo mandate (169 candidates, ~100 companies, 5 countries). Scoring dimensions, weight configurations, go/no-go thresholds, and tier boundaries are not theoretical — they are derived from live delivery outcomes.

**Three integration layers:**
1. **Schema Merge** — GRID tables extend the LYC Intelligence Supabase schema (new tables: `industries`, `companies`, `salary_benchmarks`, `talent_markets`, `target_companies`, `candidates`, `mandate_candidates`, `pipeline_metrics`, `grid_deliverables`; extended tables: `mandates`)
2. **Intelligence Engine** — Modules 2-5 implement the scoring, analysis, and recommendation logic
3. **Deliverable Engine** — Module 6 produces client-facing PDFs, CSVs, and Notion DEX pages

| Ticket | Scope | Hours | Dependencies |
|--------|-------|-------|-------------|
| T23 | GRID Data Foundation & Schema (Module 1) | 18-24h | T1, T6 |
| T24 | Market Map Generator (Module 2) | 20-28h | T23 |
| T25 | Target Company Builder (Module 3) | 16-22h | T23, T24 |
| T26 | Candidate Analytics Engine (Module 4) | 24-32h | T23, T25 |
| T27 | Compensation Intelligence (Module 5) | 16-22h | T23, T24 |
| T28 | Deliverable Generator & Report Engine (Module 6) | 20-28h | T23-T27 |

**Parallel execution window:** T23 is critical-path (all others depend on it). After T23: T24 starts Week 16. T25 starts mid-Week 17 (needs T24 company universe). T26 starts Week 18 (needs T25 target list). T27 can parallel with T25 (only needs T24 compensation landscape). T28 starts Week 20 (needs all modules functional).

---

## T23 — GRID Data Foundation & Schema (Module 1)

**Estimate:** 18-24h
**Dependencies:** T1 (Schema), T6 (Data Sync)
**Blocks:** T24, T25, T26, T27, T28

### Scope

Create the Supabase schema that stores all structured data GRID uses. Every other module queries these tables. No module can function without this. Includes: 7 new tables, 1 extended table, relationships, indexes, RLS policies, and seed data population.

### 23.1 Schema: `industries`

```sql
CREATE TABLE industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sector TEXT NOT NULL,
  sub_sectors TEXT[] DEFAULT '{}',
  market_size_usd BIGINT,
  growth_rate NUMERIC,
  key_trends TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_industries_sector ON industries(sector);
CREATE INDEX idx_industries_name ON industries USING gin(name gin_trgm_ops);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read industries" ON industries
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify industries" ON industries
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.2 Schema: `companies`

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  sub_sector TEXT,
  hq_country TEXT NOT NULL,
  hq_region TEXT NOT NULL CHECK (hq_region IN ('Europe', 'APAC', 'Americas', 'MENA')),
  revenue_usd_m NUMERIC,
  employee_count INTEGER,
  org_structure_notes TEXT,
  key_talent_names TEXT[] DEFAULT '{}',
  talent_quality_score INTEGER CHECK (talent_quality_score BETWEEN 1 AND 5),
  competitor_ids UUID[] DEFAULT '{}',
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_companies_industry ON companies(industry_id);
CREATE INDEX idx_companies_region ON companies(hq_region);
CREATE INDEX idx_companies_hq_country ON companies(hq_country);
CREATE INDEX idx_companies_name ON companies USING gin(name gin_trgm_ops);
CREATE INDEX idx_companies_talent_quality ON companies(talent_quality_score);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read companies" ON companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify companies" ON companies
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.3 Schema: `salary_benchmarks`

```sql
CREATE TABLE salary_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  seniority TEXT NOT NULL CHECK (seniority IN ('C-suite', 'VP', 'Director', 'Manager', 'Senior Manager')),
  country TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Europe', 'APAC', 'Americas', 'MENA')),
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  base_min_usd NUMERIC NOT NULL,
  base_max_usd NUMERIC NOT NULL,
  bonus_pct NUMERIC,
  total_comp_min_usd NUMERIC,
  total_comp_max_usd NUMERIC,
  data_date DATE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_salary_role ON salary_benchmarks(role_title);
CREATE INDEX idx_salary_region ON salary_benchmarks(region);
CREATE INDEX idx_salary_seniority ON salary_benchmarks(seniority);
CREATE INDEX idx_salary_industry ON salary_benchmarks(industry_id);
CREATE INDEX idx_salary_country ON salary_benchmarks(country);
CREATE INDEX idx_salary_date ON salary_benchmarks(data_date DESC);

ALTER TABLE salary_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read salary_benchmarks" ON salary_benchmarks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify salary_benchmarks" ON salary_benchmarks
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.4 Schema: `talent_markets`

```sql
CREATE TABLE talent_markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL CHECK (region IN ('Europe', 'APAC', 'Americas', 'MENA')),
  industry_id UUID REFERENCES industries(id) ON DELETE SET NULL,
  pool_size_estimate INTEGER,
  availability_pct NUMERIC,
  mobility_score INTEGER CHECK (mobility_score BETWEEN 1 AND 5),
  hotspot_cities TEXT[] DEFAULT '{}',
  competition_density TEXT CHECK (competition_density IN ('Low', 'Medium', 'High')),
  notes TEXT,
  data_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_talent_markets_role ON talent_markets(role_title);
CREATE INDEX idx_talent_markets_region ON talent_markets(region);
CREATE INDEX idx_talent_markets_industry ON talent_markets(industry_id);
CREATE INDEX idx_talent_markets_country ON talent_markets(country);

ALTER TABLE talent_markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read talent_markets" ON talent_markets
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify talent_markets" ON talent_markets
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.5 Schema: Extend `mandates` Table

```sql
-- Add GRID-specific columns to existing mandates table
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS industry_id UUID REFERENCES industries(id) ON DELETE SET NULL;
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS fee_pct NUMERIC;
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS fee_min_usd NUMERIC;
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS stage TEXT
  CHECK (stage IN ('GRID Research', 'Sourcing', 'Active', 'Offer', 'Closed', 'Lost'));
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS priority_rank INTEGER;
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS assigned_consultants TEXT[] DEFAULT '{}';
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS grid_status TEXT
  DEFAULT 'Not Started' CHECK (grid_status IN ('Not Started', 'In Progress', 'Delivered'));
ALTER TABLE mandates ADD COLUMN IF NOT EXISTS go_signal_date DATE;

CREATE INDEX idx_mandates_industry ON mandates(industry_id);
CREATE INDEX idx_mandates_stage ON mandates(stage);
CREATE INDEX idx_mandates_grid_status ON mandates(grid_status);
CREATE INDEX idx_mandates_priority ON mandates(priority_rank);
```

### 23.6 Schema: `grid_deliverables`

```sql
CREATE TABLE grid_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  deliverable_type TEXT NOT NULL CHECK (deliverable_type IN (
    'Market Map', 'Target List', 'Full Report', 'Salary Brief', 'Pipeline Update', 'Executive Summary'
  )),
  pdf_path TEXT,
  csv_path TEXT,
  notion_dex_page_id TEXT,
  candidate_pool_size INTEGER,
  t1_connected INTEGER,
  t1_not_connected INTEGER,
  t2_count INTEGER,
  connection_rate_pct NUMERIC,
  go_no_go_result TEXT CHECK (go_no_go_result IN ('GO', 'NO-GO', 'CONDITIONAL')),
  top_candidates JSONB DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_grid_deliverables_mandate ON grid_deliverables(mandate_id);
CREATE INDEX idx_grid_deliverables_type ON grid_deliverables(deliverable_type);
CREATE INDEX idx_grid_deliverables_date ON grid_deliverables(generated_at DESC);

ALTER TABLE grid_deliverables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read grid_deliverables" ON grid_deliverables
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify grid_deliverables" ON grid_deliverables
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.7 Schema: `target_companies`

```sql
CREATE TABLE target_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  fit_score INTEGER CHECK (fit_score BETWEEN 0 AND 100),
  tier TEXT CHECK (tier IN ('Primary', 'Secondary', 'Stretch', 'Exclude')),
  rationale TEXT,
  known_talent_count INTEGER,
  dimension_scores JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_target_companies_mandate ON target_companies(mandate_id);
CREATE INDEX idx_target_companies_company ON target_companies(company_id);
CREATE INDEX idx_target_companies_tier ON target_companies(tier);
CREATE INDEX idx_target_companies_fit ON target_companies(fit_score DESC);

ALTER TABLE target_companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read target_companies" ON target_companies
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify target_companies" ON target_companies
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.8 Schema: `candidates`

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  current_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  current_company_name TEXT,
  current_title TEXT,
  current_country TEXT,
  current_region TEXT CHECK (current_region IN ('Europe', 'APAC', 'Americas', 'MENA')),
  seniority TEXT CHECK (seniority IN ('C-suite', 'VP', 'Director', 'Manager', 'Senior Manager')),
  industry_experience_years INTEGER,
  linkedin_url TEXT,
  profile_summary TEXT,
  source TEXT CHECK (source IN ('SWEEP', 'GRID', 'Manual', 'Referral')),
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_candidates_company ON candidates(current_company_id);
CREATE INDEX idx_candidates_region ON candidates(current_region);
CREATE INDEX idx_candidates_seniority ON candidates(seniority);
CREATE INDEX idx_candidates_name ON candidates USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_candidates_source ON candidates(source);

ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read candidates" ON candidates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify candidates" ON candidates
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.9 Schema: `mandate_candidates`

```sql
CREATE TABLE mandate_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tier TEXT CHECK (tier IN ('T1', 'T2', 'Excluded')),
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D')),
  is_connected BOOLEAN DEFAULT false,
  connected_to TEXT,
  fit_score INTEGER CHECK (fit_score BETWEEN 0 AND 100),
  pipeline_stage TEXT CHECK (pipeline_stage IN (
    'Sourced', 'Contacted', 'Screened', 'Interested',
    'Interview', 'Offer', 'Delivered', 'Rejected', 'Withdrawn'
  )) DEFAULT 'Sourced',
  pipeline_stage_date TIMESTAMPTZ DEFAULT now(),
  assigned_consultant TEXT,
  notes TEXT,
  rejection_reason TEXT,
  dual_a_grade BOOLEAN GENERATED ALWAYS AS (
    (tier = 'T1') AND (grade = 'A') AND (is_connected = true)
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandate_id, candidate_id)
);

CREATE INDEX idx_mc_mandate ON mandate_candidates(mandate_id);
CREATE INDEX idx_mc_candidate ON mandate_candidates(candidate_id);
CREATE INDEX idx_mc_tier ON mandate_candidates(tier);
CREATE INDEX idx_mc_grade ON mandate_candidates(grade);
CREATE INDEX idx_mc_pipeline ON mandate_candidates(pipeline_stage);
CREATE INDEX idx_mc_dual_a ON mandate_candidates(dual_a_grade) WHERE dual_a_grade = true;

ALTER TABLE mandate_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read mandate_candidates" ON mandate_candidates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify mandate_candidates" ON mandate_candidates
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.10 Schema: `pipeline_metrics`

```sql
CREATE TABLE pipeline_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID NOT NULL REFERENCES mandates(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_sourced INTEGER DEFAULT 0,
  contacted INTEGER DEFAULT 0,
  screened INTEGER DEFAULT 0,
  interested INTEGER DEFAULT 0,
  interview INTEGER DEFAULT 0,
  offered INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  withdrawn INTEGER DEFAULT 0,
  conversion_contacted_to_screened NUMERIC,
  conversion_screened_to_interested NUMERIC,
  conversion_interested_to_interview NUMERIC,
  conversion_interview_to_delivered NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(mandate_id, snapshot_date)
);

CREATE INDEX idx_pipeline_mandate ON pipeline_metrics(mandate_id);
CREATE INDEX idx_pipeline_date ON pipeline_metrics(snapshot_date DESC);

ALTER TABLE pipeline_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read pipeline_metrics" ON pipeline_metrics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin users can modify pipeline_metrics" ON pipeline_metrics
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
```

### 23.11 Seed Data

```python
# seed_grid_data.py

# 1. Industries (~50 LYC core industries)
INDUSTRIES = [
    {"name": "Specialty Chemicals", "sector": "Chemicals & Materials", "sub_sectors": ["Coatings", "Adhesives", "Polymers", "Agrochemicals"], "market_size_usd": 580000000000, "growth_rate": 4.2, "key_trends": ["Sustainability transformation", "Digital supply chain", "M&A consolidation"]},
    {"name": "Consumer Electronics", "sector": "Technology", "sub_sectors": ["Mobile Devices", "Wearables", "Smart Home"], "market_size_usd": 1050000000000, "growth_rate": 6.8, "key_trends": ["AI integration", "Premiumization", "Supply chain diversification"]},
    {"name": "Pharmaceuticals", "sector": "Healthcare", "sub_sectors": ["Innovative Drugs", "Generics", "Biologics"], "market_size_usd": 1500000000000, "growth_rate": 5.5, "key_trends": ["AI drug discovery", "Biosimilar competition", "Regulatory complexity"]},
    # ... ~47 more from LYC coverage map
]

# 2. Companies (~500 from past GRID deliverables + public data)
# Source: Yacoo mandate alone had 169 candidates across ~100+ companies
# Each company: name, industry, sub_sector, hq_country, hq_region, revenue, employees, talent_quality

# 3. Salary Benchmarks (~200 across core roles × regions)
# Format: role_title, seniority, country, region, base_min, base_max, bonus_pct, total_comp_min, total_comp_max, data_date, source

# 4. Talent Markets (~100 entries covering key role × region × industry combinations)

# 5. Historical GRID deliverables (all past GRID output indexed for reference + pattern matching)

def seed_industries(client):
    for ind in INDUSTRIES:
        client.table('industries').upsert(ind, on_conflict='name').execute()

def seed_companies(client):
    # Bulk insert from CSV or JSON
    # Fuzzy match against existing mandate data to link industry_id
    pass

def seed_salary_benchmarks(client):
    # From LYC comp database + public sources (Robert Half, Michael Page, Hays surveys)
    pass

def seed_talent_markets(client):
    # From GRID research database
    pass
```

### 23.12 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/industries` | GET | List all industries (filterable by sector) |
| `/api/v1/grid/industries/{id}` | GET | Get industry detail + related companies count |
| `/api/v1/grid/companies` | GET | List companies (filterable by industry, region, revenue range) |
| `/api/v1/grid/companies/{id}` | GET | Get company detail + talent quality + competitor list |
| `/api/v1/grid/companies/search` | POST | Fuzzy search companies by name |
| `/api/v1/grid/salary-benchmarks` | GET | Query benchmarks (role, seniority, region, country) |
| `/api/v1/grid/salary-benchmarks` | POST | Add new benchmark data point |
| `/api/v1/grid/talent-markets` | GET | Query talent markets (role, region, industry) |
| `/api/v1/grid/mandates/{id}/grid-status` | GET | Get GRID-specific mandate status |
| `/api/v1/grid/mandates/{id}/grid-status` | PATCH | Update GRID status, stage, go_signal_date |
| `/api/v1/grid/seed/status` | GET | Check seed data population progress |

### 23.13 Acceptance Criteria

- [ ] All 9 tables created with correct columns, types, constraints, and indexes
- [ ] `mandates` table extended with GRID columns (no data loss)
- [ ] RLS policies: read for authenticated, write for admin only
- [ ] `mandate_candidates.dual_a_grade` computed column works correctly
- [ ] Fuzzy search (pg_trgm) works on `companies.name`, `candidates.full_name`, `industries.name`
- [ ] Seed script successfully populates: ≥50 industries, ≥500 companies, ≥200 salary benchmarks, ≥100 talent markets
- [ ] All foreign key relationships enforced
- [ ] All API endpoints return correct data with proper auth
- [ ] Backfill existing mandates with `industry_id` where possible

---

## T24 — Market Map Generator (Module 2)

**Estimate:** 20-28h
**Dependencies:** T23 (Data Foundation)
**Blocks:** T25, T27

### Scope

Generate structured talent landscape intelligence for a given industry × region combination. This is the foundational intelligence output — every GRID deliverable starts with a market map. Implements 5-step intelligence pipeline: Company Landscape → Talent Market Assessment → Compensation Landscape → Market Context → Synthesis & Scoring.

### 24.1 Core Algorithm: Market Map Generation

```python
def generate_market_map(industry_id: str, region: str, countries: list[str] = None,
                         role_title: str = None, seniority: str = None) -> dict:
    """
    5-step market intelligence pipeline.
    Production-validated against Yacoo mandate (Specialty Chemicals, Europe).
    """

    # Step 1: Company Landscape
    companies = query_companies(industry_id=industry_id, region=region)
    if countries:
        companies = [c for c in companies if c.hq_country in countries]

    company_landscape = {
        'total_companies': len(companies),
        'by_sub_sector': group_count(companies, 'sub_sector'),
        'revenue_distribution': {
            'min_usd_m': min(c.revenue_usd_m for c in companies),
            'median_usd_m': median([c.revenue_usd_m for c in companies]),
            'max_usd_m': max(c.revenue_usd_m for c in companies)
        },
        'size_distribution': bucket_count(companies, 'employee_count',
            bins=[(0, 500), (500, 5000), (5000, 50000), (50000, float('inf'))],
            labels=['<500', '500-5K', '5K-50K', '50K+']),
        'top_10_by_revenue': sorted(companies, key=lambda c: c.revenue_usd_m, reverse=True)[:10],
        'talent_quality_distribution': {
            'average': mean([c.talent_quality_score for c in companies if c.talent_quality_score]),
            'histogram': histogram_count(companies, 'talent_quality_score', range(1, 6))
        }
    }

    # Step 2: Talent Market Assessment
    talent_records = query_talent_markets(region=region, industry_id=industry_id, role_title=role_title)
    total_pool = sum(t.pool_size_estimate for t in talent_records)
    weighted_avail = sum(t.pool_size_estimate * t.availability_pct for t in talent_records) / total_pool

    talent_market_assessment = {
        'total_pool_estimate': total_pool,
        'weighted_availability_pct': round(weighted_avail, 1),
        'mobility_index': mean([t.mobility_score for t in talent_records]),
        'hotspot_ranking': aggregate_rank(talent_records, 'hotspot_cities'),
        'competition_index': mean([{'Low': 1, 'Medium': 2, 'High': 3}[t.competition_density] for t in talent_records]),
        'talent_pressure_score': round(
            (total_pool * weighted_avail / 100) /
            mean([{'Low': 1, 'Medium': 2, 'High': 3}[t.competition_density] for t in talent_records]),
            2
        ),
        'by_country': summarize_by_country(talent_records)
    }

    # Step 3: Compensation Landscape
    comp_records = query_salary_benchmarks(region=region, industry_id=industry_id,
                                            role_title=role_title, seniority=seniority)
    midpoints = [(r.base_min_usd + r.base_max_usd) / 2 for r in comp_records]
    total_midpoints = [(r.total_comp_min_usd + r.total_comp_max_usd) / 2 for r in comp_records if r.total_comp_min_usd]

    compensation_landscape = {
        'base_range': {'min_usd': min(r.base_min_usd for r in comp_records),
                       'max_usd': max(r.base_max_usd for r in comp_records)},
        'base_median_usd': int(median(midpoints)),
        'total_comp_range': {'min_usd': min(r.total_comp_min_usd for r in comp_records if r.total_comp_min_usd),
                             'max_usd': max(r.total_comp_max_usd for r in comp_records if r.total_comp_max_usd)},
        'by_country': group_comp_by_country(comp_records),
        'by_seniority': group_comp_by_seniority(comp_records),
        'data_freshness': {
            'most_recent': max(r.data_date for r in comp_records).isoformat(),
            'stale_flag': (date.today() - max(r.data_date for r in comp_records)).days > 365
        }
    }

    # Step 4: Market Context
    industry = get_industry(industry_id)
    talent_implications = derive_talent_implications(industry)
    risk_flags = derive_risk_flags(industry, talent_market_assessment, compensation_landscape)

    market_context = {
        'market_size_usd': industry.market_size_usd,
        'growth_rate_pct': industry.growth_rate,
        'key_trends': industry.key_trends,
        'talent_implications': talent_implications,
        'risk_flags': risk_flags
    }

    # Step 5: Synthesis & Scoring
    attractiveness = compute_market_attractiveness(
        pool_size=total_pool,
        availability=weighted_avail,
        mobility=talent_market_assessment['mobility_index'],
        competition=talent_market_assessment['competition_index'],
        growth_rate=industry.growth_rate
    )

    market_synthesis = {
        'market_attractiveness_score': attractiveness,
        'sourcing_difficulty': classify_sourcing_difficulty(attractiveness),
        'recommended_focus_countries': rank_focus_countries(talent_records),
        'recommended_focus_companies': rank_focus_companies(companies),
        'data_gaps': identify_data_gaps(industry_id, region, countries, comp_records, talent_records)
    }

    return {
        'industry_id': industry_id,
        'region': region,
        'countries_scope': countries,
        'generated_at': datetime.utcnow().isoformat(),
        'company_landscape': company_landscape,
        'talent_market_assessment': talent_market_assessment,
        'compensation_landscape': compensation_landscape,
        'market_context': market_context,
        'market_synthesis': market_synthesis
    }
```

### 24.2 Market Attractiveness Scoring

```python
def compute_market_attractiveness(pool_size, availability, mobility, competition, growth_rate) -> int:
    """
    Composite 1-100 score.
    Weights: 30% pool size, 25% availability, 20% mobility, 15% competition (inverse), 10% growth rate.
    Production-validated: Yacoo Specialty Chemicals Europe scored 68 (Medium).
    """
    # Normalize each dimension to 0-100
    pool_score = min(100, (pool_size / 20000) * 100)  # 20K pool = 100
    avail_score = min(100, (availability / 30) * 100)  # 30% avail = 100
    mob_score = (mobility / 5) * 100  # 5/5 = 100
    comp_score = ((4 - competition) / 3) * 100  # Low=1 → 100, High=3 → 33
    # Growth sweet spot: 5-8% is ideal, too high = war zone, too low = stagnant
    if 5 <= growth_rate <= 8:
        growth_score = 100
    elif 3 <= growth_rate < 5 or 8 < growth_rate <= 12:
        growth_score = 70
    else:
        growth_score = 40

    raw = (pool_score * 0.30 + avail_score * 0.25 + mob_score * 0.20 +
           comp_score * 0.15 + growth_score * 0.10)

    return max(0, min(100, int(raw)))

def classify_sourcing_difficulty(score: int) -> str:
    if score >= 80: return "Easy"
    if score >= 60: return "Medium"
    if score >= 40: return "Hard"
    return "Very Hard"
```

### 24.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/market-map/generate` | POST | Generate market map for industry × region |
| `/api/v1/grid/market-map/{id}` | GET | Retrieve stored market map output |
| `/api/v1/grid/market-map/mandate/{mandate_id}` | GET | Market map for a specific mandate |
| `/api/v1/grid/market-map/compare` | POST | Compare two market maps side-by-side |

### 24.4 Acceptance Criteria

- [ ] 5-step pipeline returns complete market map for any industry × region with seed data
- [ ] Company landscape aggregates correctly: sub-sector groups, revenue distribution, size buckets
- [ ] Talent market assessment computes weighted availability, mobility index, talent pressure score
- [ ] Compensation landscape calculates percentiles, groups by country and seniority
- [ ] Market context derives talent implications from growth rate + trends
- [ ] Market attractiveness score (1-100) and sourcing difficulty classification match Yacoo validation
- [ ] Data gaps correctly identified when benchmarks or talent data missing for a country
- [ ] API returns full JSON output within 3 seconds for typical queries
- [ ] Stale data flags fire when benchmark data_date > 12 months old

---

## T25 — Target Company Builder (Module 3)

**Estimate:** 16-22h
**Dependencies:** T23 (Data Foundation), T24 (Market Map — company universe)
**Blocks:** T26

### Scope

Given a mandate's parameters, identify and rank 15-25 target companies where the ideal candidate profile is most likely to exist. Implements 6-dimension fit scoring with configurable weights, tier classification (Primary/Secondary/Stretch), and auto-generated rationales.

### 25.1 Core Algorithm: Target Company Scoring

```python
def build_target_list(mandate_id: str, market_map_output: dict = None,
                       custom_criteria: dict = None,
                       min_companies: int = 15, max_companies: int = 25) -> dict:
    """
    5-step target company builder.
    6-dimension scoring: Sub-Sector (25%), Role Relevance (20%),
    Geographic (20%), Size (15%), Talent Quality (10%), Competitive (10%).
    Production-validated against Yacoo mandate target list.
    """

    mandate = get_mandate(mandate_id)

    # Step 1: Company Universe Assembly
    universe = get_companies_for_mandate(mandate, market_map_output)
    if custom_criteria:
        universe = apply_custom_filters(universe, custom_criteria)

    # Step 2: Fit Scoring (6 Dimensions)
    scored_companies = []
    for company in universe:
        dimensions = {
            'sub_sector_alignment': {
                'score': score_sub_sector(company, mandate),
                'weight': 0.25,
                'reason': explain_sub_sector(company, mandate)
            },
            'role_relevance': {
                'score': score_role_relevance(company, mandate),
                'weight': 0.20,
                'reason': explain_role_relevance(company, mandate)
            },
            'geographic_match': {
                'score': score_geographic(company, mandate),
                'weight': 0.20,
                'reason': explain_geographic(company, mandate)
            },
            'size_appropriateness': {
                'score': score_size(company, mandate),
                'weight': 0.15,
                'reason': explain_size(company, mandate)
            },
            'talent_quality': {
                'score': score_talent_quality(company),
                'weight': 0.10,
                'reason': explain_talent_quality(company)
            },
            'competitive_positioning': {
                'score': score_competitive(company, mandate),
                'weight': 0.10,
                'reason': explain_competitive(company, mandate)
            }
        }

        # Compute weighted composite
        fit_score = sum(
            d['score'] * d['weight'] for d in dimensions.values()
        )
        fit_score = max(0, min(100, int(fit_score)))

        scored_companies.append({
            'company_id': company.id,
            'company_name': company.name,
            'fit_score': fit_score,
            'dimensions': dimensions,
            'sub_sector': company.sub_sector,
            'hq_country': company.hq_country,
            'revenue_usd_m': company.revenue_usd_m,
            'employee_count': company.employee_count
        })

    # Step 3: Composite Score & Ranking
    scored_companies.sort(key=lambda c: c['fit_score'], reverse=True)

    # Step 4: Tier Classification
    for company in scored_companies:
        if company['fit_score'] >= 75:
            company['tier'] = 'Primary'
        elif company['fit_score'] >= 50:
            company['tier'] = 'Secondary'
        elif company['fit_score'] >= 30:
            company['tier'] = 'Stretch'
        else:
            company['tier'] = 'Exclude'

    # Apply constraints
    target_list = [c for c in scored_companies if c['tier'] != 'Exclude']
    if len([c for c in target_list if c['tier'] == 'Primary']) < 5:
        target_list.insert(0, {'flag': 'thin_primary',
            'message': 'Primary tier has <5 companies — consider expanding criteria'})

    # Trim to max_companies
    target_list = target_list[:max_companies]
    if len(target_list) < min_companies:
        target_list.append({'flag': 'insufficient_targets',
            'message': f'Only {len(target_list)} companies meet criteria (min: {min_companies})'})

    # Step 5: Rationale & Talent Estimation
    for rank, company in enumerate(target_list, 1):
        if isinstance(company, dict) and 'flag' in company:
            continue
        company['rank'] = rank
        company['rationale'] = generate_rationale(company)
        company['known_talent_count'] = estimate_talent_count(company)
        company['known_talent_count_source'] = (
            'key_talent_names (verified)' if company.get('verified_talent') else
            'pool_size_estimate (derived)'
        )

    # Store results in target_companies table
    store_target_list(mandate_id, target_list)

    return {
        'mandate_id': mandate_id,
        'generated_at': datetime.utcnow().isoformat(),
        'input_summary': summarize_inputs(mandate, universe, custom_criteria),
        'target_list': target_list,
        'tier_summary': compute_tier_summary(target_list),
        'weight_config': get_weight_config(),
        'flags': extract_flags(target_list)
    }
```

### 25.2 Dimension Scoring Functions

```python
def score_sub_sector(company, mandate) -> int:
    """Exact sub-sector match = 100, adjacent = 70, same sector = 40, different = 10"""
    if company.sub_sector in mandate.industry.sub_sectors:
        return 100
    if company.industry_id == mandate.industry_id:
        return 70
    if company.industry and company.industry.sector == mandate.industry.sector:
        return 40
    return 10

def score_geographic(company, mandate) -> int:
    """HQ in target country = 100, ops in all = 80, some = 50, region only = 30, outside = 0"""
    if company.hq_country in mandate.countries:
        return 100
    # Check operations coverage (would need company_operations table or inference)
    return 50  # Default: some overlap

def score_size(company, mandate) -> int:
    """Ideal size band derived from mandate seniority + client size"""
    ideal_band = derive_ideal_size_band(mandate.seniority, mandate.client_revenue)
    if company.employee_count in ideal_band:
        return 100
    # Check adjacent bands
    return 60 if is_adjacent_band(company.employee_count, ideal_band) else 20

def score_talent_quality(company) -> int:
    """Direct mapping: talent_quality_score × 20 → 0-100. Null = 50 (neutral)."""
    if company.talent_quality_score is None:
        return 50
    return company.talent_quality_score * 20

def score_competitive(company, mandate) -> int:
    """Known competitor/peer of client = 100, adjacent market = 60, tangential = 30, none = 10"""
    if company.id in (mandate.client_competitor_ids or []):
        return 100
    if is_adjacent_market(company, mandate):
        return 60
    if is_tangential(company, mandate):
        return 30
    return 10
```

### 25.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/target-list/generate` | POST | Build target list for a mandate |
| `/api/v1/grid/target-list/{mandate_id}` | GET | Retrieve stored target list |
| `/api/v1/grid/target-list/{mandate_id}/recompute` | POST | Recompute with updated data or weights |
| `/api/v1/grid/target-list/{mandate_id}/weights` | PATCH | Adjust dimension weights |
| `/api/v1/grid/target-list/{mandate_id}/override` | POST | Manual tier override with reason |

### 25.4 Acceptance Criteria

- [ ] 6-dimension scoring produces fit_score 0-100 for each company
- [ ] Default weights (25/20/20/15/10/10) produce results matching Yacoo target list
- [ ] Tier classification: Primary ≥75, Secondary ≥50, Stretch ≥30, Exclude <30
- [ ] Auto-generated rationales are coherent 2-3 sentence narratives
- [ ] Known talent count: uses `key_talent_names` if present, derives from `pool_size_estimate` otherwise
- [ ] Flags fire when Primary tier < 5 companies or total < min_companies
- [ ] Custom criteria filters (exclude_competitors, min_revenue, required_countries) work correctly
- [ ] Weight adjustment via API changes scoring without requiring full recomputation
- [ ] Manual tier overrides logged with timestamp + reason

---

## T26 — Candidate Analytics Engine (Module 4)

**Estimate:** 24-32h
**Dependencies:** T23 (Data Foundation), T25 (Target Company list)
**Blocks:** T28

### Scope

The most complex GRID module. Analyze the candidate pool for a mandate — classify into T1/T2 tiers, score individuals on 6 dimensions (A/B/C/D grades), calculate connection rates, identify dual A-grade candidates, run go/no-go analysis, and track the sourcing pipeline through all stages.

### 26.1 Candidate Intake & Enrichment

```python
def ingest_candidates(mandate_id: str, candidate_data: list[dict], source: str = 'SWEEP') -> dict:
    """
    Bulk import candidates from SWEEP CSV, LinkedIn export, or manual entry.
    Runs Steps 1-2: intake + tier classification.
    """

    results = {'enriched': 0, 'orphaned': 0, 'tier_t1': 0, 'tier_t2': 0, 'excluded': 0}
    mandate = get_mandate(mandate_id)
    target_company_ids = get_target_company_ids(mandate_id)

    for raw in candidate_data:
        # Step 1: Enrichment — fuzzy match company name to companies table
        company_match = fuzzy_match_company(raw.get('current_company_name', ''))
        if company_match:
            raw['current_company_id'] = company_match.id
            raw['inherited_talent_quality'] = company_match.talent_quality_score
            results['enriched'] += 1
        else:
            raw['current_company_id'] = None
            results['orphaned'] += 1

        # Normalize seniority from raw title
        raw['seniority'] = normalize_seniority(raw.get('current_title', ''))

        # Create candidate record
        candidate = create_candidate(raw, source=source)

        # Step 2: Tier Classification
        tier = classify_tier(candidate, mandate, target_company_ids)
        if tier:
            create_mandate_candidate(
                mandate_id=mandate_id,
                candidate_id=candidate.id,
                tier=tier
            )
            results[f'tier_{tier.lower()}'] += 1
        else:
            results['excluded'] += 1

    return results
```

### 26.2 Tier Classification

```python
def classify_tier(candidate, mandate, target_company_ids: set) -> str:
    """
    T1 criteria (ALL must be met):
    - Seniority matches mandate (exact or one level below)
    - Company in target list OR company fit_score ≥ 50
    - Region matches mandate region
    - Industry experience ≥ threshold (5yr VP+, 8yr C-suite)

    T2 criteria (meets SOME but not all T1):
    - Right seniority, wrong company
    - Right company, wrong seniority
    - Right seniority + industry, wrong geography
    - Right profile overall, < minimum experience
    """
    seniority_match = is_seniority_match(candidate.seniority, mandate.seniority)
    company_match = (candidate.current_company_id in target_company_ids or
                     get_company_fit_score(candidate.current_company_id, mandate.id) >= 50)
    region_match = candidate.current_region == mandate.region
    exp_threshold = 8 if mandate.seniority == 'C-suite' else 5
    experience_match = (candidate.industry_experience_years or 0) >= exp_threshold

    if seniority_match and company_match and region_match and experience_match:
        return 'T1'
    elif seniority_match or company_match or (region_match and seniority_match):
        return 'T2'
    return None  # Excluded
```

### 26.3 Individual Candidate Grading (6 Dimensions)

```python
def grade_candidates(mandate_id: str) -> dict:
    """
    Score each T1/T2 candidate 0-100 on 6 dimensions, then map to A/B/C/D grade.
    T2 candidates capped at grade B.
    """
    mandate_candidates = get_mandate_candidates(mandate_id)
    mandate = get_mandate(mandate_id)
    target_company_ids = get_target_company_ids(mandate_id)

    graded = {'T1': {'A': 0, 'B': 0, 'C': 0, 'D': 0},
              'T2': {'A': 0, 'B': 0, 'C': 0, 'D': 0}}

    for mc in mandate_candidates:
        candidate = get_candidate(mc.candidate_id)
        company = get_company(candidate.current_company_id) if candidate.current_company_id else None

        scores = {
            'company_prestige': score_company_prestige(company, target_company_ids),       # 20%
            'title_scope_alignment': score_title_scope(candidate, mandate),                # 25%
            'industry_depth': score_industry_depth(candidate, mandate),                    # 20%
            'geographic_fit': score_geographic_fit(candidate, mandate),                    # 15%
            'career_trajectory': score_career_trajectory(candidate),                       # 10%
            'differentiation': score_differentiation(candidate)                            # 10%
        }

        fit_score = int(
            scores['company_prestige'] * 0.20 +
            scores['title_scope_alignment'] * 0.25 +
            scores['industry_depth'] * 0.20 +
            scores['geographic_fit'] * 0.15 +
            scores['career_trajectory'] * 0.10 +
            scores['differentiation'] * 0.10
        )

        # Grade mapping
        if fit_score >= 85: grade = 'A'
        elif fit_score >= 65: grade = 'B'
        elif fit_score >= 45: grade = 'C'
        else: grade = 'D'

        # T2 cap: max grade B
        if mc.tier == 'T2' and grade == 'A':
            grade = 'B'
            # Flag for potential T1 reclassification
            flag_t1_reclassification(mc.candidate_id, mandate_id, fit_score)

        update_mandate_candidate(mc.id, grade=grade, fit_score=fit_score)
        graded[mc.tier][grade] += 1

    return graded
```

### 26.4 Connection Analysis & Dual A-Grade

```python
def compute_connection_analysis(mandate_id: str) -> dict:
    """
    Compute T1 connection rate and identify dual A-grade candidates.
    Dual A-grade = T1 + Grade A + Connected.
    Connection rate thresholds:
      ≥60% → 🟢 Strong | 40-59% → 🟡 Adequate | 20-39% → 🟠 Below | <20% → 🔴 Critical
    """
    mc_list = get_mandate_candidates(mandate_id, tier='T1')
    t1_connected = sum(1 for mc in mc_list if mc.is_connected)
    t1_total = len(mc_list)
    connection_rate = (t1_connected / t1_total * 100) if t1_total > 0 else 0

    # Connection status
    if connection_rate >= 60: status = '🟢 Strong'
    elif connection_rate >= 40: status = '🟡 Adequate'
    elif connection_rate >= 20: status = '🟠 Below threshold'
    else: status = '🔴 Critical'

    # Dual A-grade
    dual_a = [mc for mc in mc_list if mc.grade == 'A' and mc.is_connected]

    return {
        't1_total': t1_total,
        't1_connected': t1_connected,
        't1_not_connected': t1_total - t1_connected,
        'connection_rate_t1_pct': round(connection_rate, 1),
        'connection_status': status,
        'dual_a_grade_count': len(dual_a),
        'dual_a_grade_candidates': [
            {
                'name': get_candidate(mc.candidate_id).full_name,
                'company': get_candidate(mc.candidate_id).current_company_name,
                'title': get_candidate(mc.candidate_id).current_title,
                'connected_to': mc.connected_to,
                'fit_score': mc.fit_score
            } for mc in sorted(dual_a, key=lambda x: x.fit_score, reverse=True)
        ]
    }
```

### 26.5 Go/No-Go Analysis

```python
def run_go_no_go(mandate_id: str) -> dict:
    """
    5-metric mandate viability evaluation.
    GO: ≥70 | CONDITIONAL: 40-69 | NO-GO: <40
    Production-validated: Yacoo scored 74 (GO).
    """
    conn = compute_connection_analysis(mandate_id)
    grades = get_grade_distribution(mandate_id)
    target_coverage = compute_target_coverage(mandate_id)

    metrics = [
        {'name': 'connection_rate_t1', 'value': conn['connection_rate_t1_pct'],
         'threshold': 40, 'weight': 0.30},
        {'name': 't1_total_count', 'value': conn['t1_total'],
         'threshold': 30, 'weight': 0.20},
        {'name': 'dual_a_grade_count', 'value': conn['dual_a_grade_count'],
         'threshold': 5, 'weight': 0.25},
        {'name': 'grade_a_count', 'value': grades.get('A', 0),
         'threshold': 10, 'weight': 0.15},
        {'name': 'target_company_coverage', 'value': target_coverage,
         'threshold': 60, 'weight': 0.10}
    ]

    # Score each metric 0-100 based on distance from threshold
    for m in metrics:
        if m['value'] >= m['threshold']:
            m['score'] = min(100, 50 + (m['value'] / m['threshold'] - 1) * 50)
        else:
            m['score'] = max(0, (m['value'] / m['threshold']) * 50)
        m['status'] = 'ABOVE' if m['value'] >= m['threshold'] else 'BELOW'

    go_score = sum(m['score'] * m['weight'] for m in metrics)

    if go_score >= 70: result = 'GO'
    elif go_score >= 40: result = 'CONDITIONAL'
    else: result = 'NO-GO'

    recommendation = generate_go_no_go_recommendation(result, go_score, metrics)

    return {
        'result': result,
        'go_score': round(go_score, 1),
        'metric_breakdown': metrics,
        'recommendation': recommendation,
        'risk_factors': extract_risk_factors(metrics)
    }
```

### 26.6 Pipeline Stage Tracking

```python
def update_pipeline_stage(mandate_id: str, candidate_id: str, new_stage: str) -> dict:
    """
    Move candidate through sourcing funnel.
    Stages: Sourced → Contacted → Screened → Interested → Interview → Offer → Delivered
    Auto-updates pipeline_metrics snapshot.
    Cannot go backwards without explicit reclassification.
    """
    mc = get_mandate_candidate(mandate_id, candidate_id)

    # Enforce forward-only progression
    stage_order = ['Sourced', 'Contacted', 'Screened', 'Interested',
                   'Interview', 'Offer', 'Delivered', 'Rejected', 'Withdrawn']
    if stage_order.index(new_stage) < stage_order.index(mc.pipeline_stage):
        raise ValueError(f"Cannot move backwards from {mc.pipeline_stage} to {new_stage}. Use reclassify_candidate().")

    update_mandate_candidate(mc.id, pipeline_stage=new_stage, pipeline_stage_date=datetime.utcnow())

    # Auto-update pipeline metrics snapshot
    refresh_pipeline_metrics(mandate_id)

    # Check for auto-flags
    check_pipeline_flags(mandate_id)

    return {'status': 'updated', 'new_stage': new_stage}
```

### 26.7 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/candidates/ingest` | POST | Bulk import candidates (SWEEP CSV, manual) |
| `/api/v1/grid/candidates/{mandate_id}/grade` | POST | Run grading on all candidates |
| `/api/v1/grid/candidates/{mandate_id}/connection-analysis` | GET | Connection rates + dual A-grade |
| `/api/v1/grid/candidates/{mandate_id}/go-no-go` | POST | Run go/no-go analysis |
| `/api/v1/grid/candidates/{mandate_id}/pipeline` | GET | Current pipeline snapshot + conversions |
| `/api/v1/grid/candidates/{mandate_id}/{candidate_id}/stage` | PATCH | Update pipeline stage |
| `/api/v1/grid/candidates/{mandate_id}/{candidate_id}/reclassify` | POST | Manual tier/grade override with reason |
| `/api/v1/grid/candidates/{mandate_id}/export` | GET | CSV export filtered by tier/grade |

### 26.8 Acceptance Criteria

- [ ] Candidate intake from CSV: fuzzy company matching ≥90% accuracy for known companies
- [ ] T1/T2 classification matches manual GRID tiering from Yacoo mandate
- [ ] 6-dimension grading produces scores 0-100 with correct A/B/C/D grade mapping
- [ ] T2 candidates capped at grade B; T2 scoring ≥85 flagged for T1 reclassification
- [ ] Dual A-grade computed correctly (T1 + Grade A + Connected)
- [ ] Go/No-Go score (0-100) with GO/CONDITIONAL/NO-GO classification
- [ ] Pipeline stage tracking: forward-only, auto-metrics refresh, benchmark comparison
- [ ] Auto-flags fire when: connection rate <40%, conversion below benchmark, stalled pipeline
- [ ] CSV export includes all tier/grade/connection/pipeline columns
- [ ] All manual overrides logged with timestamp + reason (audit trail)

---

## T27 — Compensation Intelligence (Module 5)

**Estimate:** 16-22h
**Dependencies:** T23 (Data Foundation), T24 (Market Map — compensation landscape)
**Blocks:** T28

### Scope

Provide structured compensation intelligence for mandates — benchmark queries with percentile computation, market positioning analysis against client budget, candidate affordability cross-reference, geographic arbitrage insights, and trend analysis with forecasting.

### 27.1 Core Algorithm: Compensation Analysis

```python
def analyze_market_positioning(mandate_id: str = None,
                                role_title: str = None, seniority: str = None,
                                region: str = None, countries: list[str] = None,
                                industry_id: str = None,
                                client_budget_min_usd: float = None,
                                client_budget_max_usd: float = None) -> dict:
    """
    7-step compensation intelligence pipeline.
    Steps: Benchmark Assembly → Range Computation → Market Positioning →
    Candidate Affordability → Geographic Arbitrage → Trend Analysis → Synthesis
    """

    # Step 1: Benchmark Data Assembly
    benchmarks = query_salary_benchmarks(
        role_title=role_title, seniority=seniority,
        region=region, countries=countries, industry_id=industry_id
    )
    # Also include cross-industry benchmarks (industry_id is null)
    cross_industry = query_salary_benchmarks(
        role_title=role_title, seniority=seniority,
        region=region, countries=countries, industry_id=None
    )
    all_benchmarks = benchmarks + cross_industry

    benchmark_dataset = {
        'total_data_points': len(all_benchmarks),
        'date_range': get_date_range(all_benchmarks),
        'countries_covered': list(set(b.country for b in all_benchmarks)),
        'data_quality': assess_data_quality(all_benchmarks)
    }

    # Step 2: Compensation Range Computation (per country)
    country_benchmarks = []
    for country in set(b.country for b in all_benchmarks):
        country_data = [b for b in all_benchmarks if b.country == country]
        midpoints = [(b.base_min_usd + b.base_max_usd) / 2 for b in country_data]
        total_midpoints = [(b.total_comp_min_usd + b.total_comp_max_usd) / 2
                          for b in country_data if b.total_comp_min_usd]

        country_benchmarks.append({
            'country': country,
            'base_min': min(b.base_min_usd for b in country_data),
            'base_p25': percentile(midpoints, 25),
            'base_median': int(median(midpoints)),
            'base_p75': percentile(midpoints, 75),
            'base_max': max(b.base_max_usd for b in country_data),
            'total_comp_min': min(b.total_comp_min_usd for b in country_data if b.total_comp_min_usd),
            'total_comp_median': int(median(total_midpoints)) if total_midpoints else None,
            'total_comp_max': max(b.total_comp_max_usd for b in country_data if b.total_comp_max_usd),
            'bonus_typical_pct': int(median([b.bonus_pct for b in country_data if b.bonus_pct])),
            'data_points': len(country_data),
            'most_recent_date': max(b.data_date for b in country_data).isoformat(),
            'confidence': 'High' if len(country_data) >= 10 else 'Medium' if len(country_data) >= 5 else 'Low'
        })

    # Step 3: Market Positioning (if client budget provided)
    market_positioning = None
    if client_budget_min_usd or client_budget_max_usd:
        market_positioning = compute_market_positioning(
            country_benchmarks, client_budget_min_usd, client_budget_max_usd
        )

    # Step 4: Candidate Affordability (if mandate_id provided)
    candidate_affordability = None
    if mandate_id:
        candidate_affordability = compute_candidate_affordability(
            mandate_id, client_budget_min_usd, client_budget_max_usd, country_benchmarks
        )

    # Step 5: Geographic Arbitrage
    geographic_arbitrage = compute_geographic_arbitrage(country_benchmarks, all_benchmarks)

    # Step 6: Trend Analysis
    trend_analysis = compute_comp_trends(all_benchmarks)

    # Step 7: Synthesis & Recommendations
    compensation_synthesis = synthesize_compensation(
        country_benchmarks, market_positioning, candidate_affordability,
        geographic_arbitrage, trend_analysis,
        role_title, seniority, region,
        client_budget_min_usd, client_budget_max_usd
    )

    return {
        'query_params': {'role_title': role_title, 'seniority': seniority,
                        'region': region, 'countries': countries},
        'generated_at': datetime.utcnow().isoformat(),
        'benchmark_dataset': benchmark_dataset,
        'country_benchmarks': country_benchmarks,
        'market_positioning': market_positioning,
        'candidate_affordability': candidate_affordability,
        'geographic_arbitrage': geographic_arbitrage,
        'trend_analysis': trend_analysis,
        'compensation_synthesis': compensation_synthesis
    }
```

### 27.2 Market Positioning Computation

```python
def compute_market_positioning(country_benchmarks, budget_min, budget_max) -> dict:
    """
    Determine where client budget lands in the market distribution.
    Below P25 → "will struggle" | P25-P50 → "competitive for B-grade"
    P50-P75 → "competitive" | Above P75 → "premium" | Above MAX → "verify scope"
    """
    all_medians = [cb['total_comp_median'] for cb in country_benchmarks if cb['total_comp_median']]
    if not all_medians:
        return None

    overall_median = median(all_medians)
    p25 = percentile(all_medians, 25)
    p75 = percentile(all_medians, 75)

    budget_mid = (budget_min + budget_max) / 2 if budget_min and budget_max else budget_max or budget_min
    budget_pct = sum(1 for m in all_medians if m <= budget_mid) / len(all_medians) * 100

    if budget_mid < p25:
        positioning = "Below market — will struggle to attract quality candidates"
    elif budget_mid < overall_median:
        positioning = "Competitive for B-grade candidates, may lose A-grade"
    elif budget_mid < p75:
        positioning = "Competitive — attracts strong pool"
    elif budget_mid < max(all_medians):
        positioning = "Above market — premium positioning, attracts top talent"
    else:
        positioning = "Significantly above market — verify if budget is realistic"

    # Affordability coverage estimate
    coverage_pct = min(100, budget_pct)

    return {
        'client_budget_min_usd': budget_min,
        'client_budget_max_usd': budget_max,
        'budget_vs_market': positioning,
        'budget_percentile': round(budget_pct, 1),
        'affordability_coverage_pct': round(coverage_pct, 1),
        'narrative': generate_positioning_narrative(positioning, budget_mid, overall_median, coverage_pct)
    }
```

### 27.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/compensation/benchmark` | GET | Core benchmark query (role, seniority, region) |
| `/api/v1/grid/compensation/positioning` | POST | Full market positioning analysis (requires mandate_id or budget) |
| `/api/v1/grid/compensation/affordability` | GET | Candidate affordability check for a mandate |
| `/api/v1/grid/compensation/arbitrage` | GET | Geographic cost-efficiency ranking |
| `/api/v1/grid/compensation/trends` | GET | Historical trend analysis with forecasting |
| `/api/v1/grid/compensation/compare` | POST | Side-by-side comp analysis for two mandates |
| `/api/v1/grid/compensation/benchmark` | POST | Add new benchmark data point |
| `/api/v1/grid/compensation/report` | GET | Full compensation brief for Module 6 |

### 27.4 Acceptance Criteria

- [ ] Benchmark queries return correct percentiles (P25, P50, P75) per country
- [ ] Market positioning classification accurate: Below/P25-P50/P50-P75/Above P75/Above MAX
- [ ] Affordability coverage estimate within ±10% of actual distribution
- [ ] Candidate affordability cross-reference: affordable/stretch/out_of_range per candidate
- [ ] Geographic arbitrage ranks countries by value_score (talent_availability / cost_index)
- [ ] Trend analysis computes annualized comp inflation when ≥2 data points exist
- [ ] "Low confidence" flag when <5 data points for a country
- [ ] "Stale data" flag when most recent benchmark >12 months old
- [ ] All benchmark additions require source + data_date (no unsourced data)
- [ ] Compensation synthesis generates actionable 2-3 sentence narrative

---

## T28 — Deliverable Generator & Report Engine (Module 6)

**Estimate:** 20-28h
**Dependencies:** T23-T27 (all GRID modules functional)
**Blocks:** None (terminal module)

### Scope

Transform structured intelligence output from Modules 2-5 into polished, branded deliverables — PDF reports (12-16 pages), CSV exports (target list, candidate pool, compensation), Notion DEX page creation, and optional visual market maps. Template system supports GRID standard + client-specific branding overrides.

### 28.1 Core Algorithm: Deliverable Generation

```python
def generate_deliverable(mandate_id: str, deliverable_type: str,
                          include_sections: list[str] = None,
                          template_id: str = 'grid_standard',
                          output_formats: list[str] = None,
                          custom_branding: dict = None) -> dict:
    """
    8-step deliverable generation pipeline.
    Steps: Data Assembly → Template Selection → Content Rendering → PDF Generation →
    CSV Generation → Notion DEX Creation → Visual Maps (optional) → Metadata Storage
    """

    if output_formats is None:
        output_formats = ['pdf', 'csv']

    # Step 1: Data Assembly
    payload = assemble_deliverable_payload(mandate_id, include_sections)

    # Step 2: Template Selection & Layout
    template = load_template(template_id)
    layout = template.get_layout(deliverable_type)

    # Step 3: Content Rendering (section-by-section)
    rendered_sections = {}
    for section in layout.sections:
        if section.id == 'executive_summary':
            rendered_sections[section.id] = render_executive_summary(payload)
        elif section.id == 'market_landscape':
            rendered_sections[section.id] = render_market_landscape(payload)
        elif section.id == 'target_companies':
            rendered_sections[section.id] = render_target_companies(payload)
        elif section.id == 'candidate_pool':
            rendered_sections[section.id] = render_candidate_pool(payload)
        elif section.id == 'pipeline_status':
            rendered_sections[section.id] = render_pipeline_status(payload)
        elif section.id == 'compensation_brief':
            rendered_sections[section.id] = render_compensation_brief(payload)
        elif section.id == 'go_no_go':
            rendered_sections[section.id] = render_go_no_go(payload)

    outputs = {}

    # Step 4: PDF Generation
    if 'pdf' in output_formats:
        html = compose_html(rendered_sections, template, custom_branding)
        pdf_path = html_to_pdf(html, mandate_id, deliverable_type)
        outputs['pdf'] = {
            'file_path': pdf_path,
            'page_count': count_pages(pdf_path),
            'file_size_bytes': os.path.getsize(pdf_path)
        }

    # Step 5: CSV Generation
    if 'csv' in output_formats:
        csv_outputs = generate_csvs(mandate_id, payload)
        outputs['csv'] = csv_outputs

    # Step 6: Notion DEX Page Creation
    if 'notion_dex' in output_formats:
        notion_result = create_notion_dex_page(mandate_id, payload, rendered_sections)
        outputs['notion_dex'] = notion_result

    # Step 7: Visual Market Maps (optional)
    if 'visuals' in output_formats:
        visuals = generate_visual_charts(payload)
        outputs['visuals'] = visuals

    # Step 8: Metadata Storage
    deliverable = store_deliverable(mandate_id, deliverable_type, outputs, payload)

    return {
        'mandate_id': mandate_id,
        'deliverable_type': deliverable_type,
        'generated_at': datetime.utcnow().isoformat(),
        'outputs': outputs,
        'deliverable_metadata': extract_metadata(payload),
        'data_completeness': check_data_completeness(payload),
        'flags': extract_deliverable_flags(payload)
    }
```

### 28.2 Executive Summary Template

```python
def render_executive_summary(payload: dict) -> str:
    """
    1-page executive summary combining market, candidate, go/no-go, and comp insights.
    """
    m = payload['market_synthesis']
    p = payload['pool_summary']
    g = payload['go_no_go']
    c = payload['compensation_synthesis']

    return f"""
MANDATE: {payload['mandate_title']}
CLIENT: {payload['client_name']}
DATE: {datetime.now().strftime('%Y-%m-%d')}

EXECUTIVE SUMMARY

Market Assessment: {m['sourcing_difficulty']} (Score: {m['market_attractiveness_score']}/100)
The {payload['industry']} talent market in {payload['region']} presents {m['sourcing_difficulty'].lower()} conditions for this mandate.
{m.get('narrative', '')}

Candidate Pool: {p['total_candidates']} candidates identified ({p['t1_total']} T1, {p['t2_total']} T2)
Connection rate: {p['connection_rate_t1_pct']}% ({p['t1_connected']} connected / {p['t1_total']} T1)
Dual A-Grade candidates: {p['dual_a_grade_count']} (highest-probability placements)

Go/No-Go Recommendation: {g['result']} (Score: {g['go_score']}/100)
{g['recommendation']}

Compensation Positioning: {c.get('budget_vs_market', 'N/A')}
{c.get('market_summary', '')}

KEY FLAGS:
{format_flags(g.get('risk_factors', []) + m.get('risk_flags', []))}
"""
```

### 28.3 PDF Generation Pipeline

```python
def html_to_pdf(html: str, mandate_id: str, deliverable_type: str) -> str:
    """
    HTML → PDF with GRID branding.
    Specs: A4, 20mm margins, Inter font, header/footer on every page.
    Cover page: GRID logo, mandate title, client, date.
    """
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"GRID_{deliverable_type}_{mandate_id[:8]}_{date_str}.pdf"
    output_path = f"/grid_reports/{filename}"

    # Use Playwright or WeasyPrint for HTML→PDF conversion
    # Apply CSS: GRID branding (B/W + fuchsia #C108AB, Inter font)
    # Header: "GRID Intelligence Report | {mandate_title}" (except cover)
    # Footer: "LYC Partners | Confidential | Page X of Y"

    # ... conversion logic ...

    return output_path
```

### 28.4 CSV Generation

```python
def generate_csvs(mandate_id: str, payload: dict) -> dict:
    """Generate 3 CSV exports: target list, candidate pool, compensation."""

    # Target List CSV
    target_csv = generate_target_csv(payload['target_list'])

    # Candidate Pool CSV
    candidate_csv = generate_candidate_csv(payload)

    # Compensation CSV
    comp_csv = generate_compensation_csv(payload['country_benchmarks'])

    return {
        'target_list': f'/grid_reports/target_list_{mandate_id[:8]}_{date_str}.csv',
        'candidate_pool': f'/grid_reports/candidates_{mandate_id[:8]}_{date_str}.csv',
        'compensation': f'/grid_reports/compensation_{mandate_id[:8]}_{date_str}.csv'
    }
```

### 28.5 Notion DEX Page Creation

```python
def create_notion_dex_page(mandate_id: str, payload: dict, rendered: dict) -> dict:
    """
    Create Notion page under DEX database.
    Page title: [Mandate Title] - GRID Report - [Date]
    Properties: Mandate, Type=GRID Report, Status=Delivered, Date, Consultant
    """
    # Use Notion API to create page under DEX database
    # Database ID from config (matches LYC Notion workspace)
    page = notion_client.pages.create(
        parent={'database_id': NOTION_DEX_DATABASE_ID},
        properties={
            'title': {'title': [{'text': {
                'content': f"{payload['mandate_title']} - GRID Report - {date.today().isoformat()}"
            }}]},
            'Type': {'select': {'name': 'GRID Report'}},
            'Status': {'select': {'name': 'Delivered'}},
            'Date': {'date': {'start': date.today().isoformat()}},
            'Consultant': {'rich_text': [{'text': {
                'content': ', '.join(payload.get('assigned_consultants', []))
            }}]}
        },
        children=convert_to_notion_blocks(rendered)
    )

    return {
        'page_id': page['id'],
        'page_url': page['url']
    }
```

### 28.6 Template System

| Template ID | Name | Use Case | Sections |
|-------------|------|----------|----------|
| `grid_standard` | GRID Intelligence Report | Default full report for mandates | All sections (12-16 pages) |
| `grid_market_map` | Market Map Brief | Market-only deliverable (no candidates) | Market Landscape + Context |
| `grid_target_list` | Target Company Export | Target list for SWEEP handoff | Target Companies only |
| `grid_salary_brief` | Compensation Brief | Salary-only for client | Compensation Brief only |
| `grid_executive_summary` | Executive Summary | 2-page condensed for Kevin | Executive Summary + Go/No-Go |
| `grid_pipeline_update` | Pipeline Status Update | Pipeline snapshot for team meetings | Pipeline Status only |

### 28.7 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/grid/deliverables/generate` | POST | Generate deliverable (PDF/CSV/Notion) |
| `/api/v1/grid/deliverables/{id}` | GET | Retrieve deliverable metadata + file paths |
| `/api/v1/grid/deliverables/{id}/regenerate` | POST | Re-generate with fresh data or updated sections |
| `/api/v1/grid/deliverables/{id}/download` | GET | Download PDF/CSV/visual file |
| `/api/v1/grid/deliverables/mandate/{mandate_id}` | GET | List all deliverables for a mandate |
| `/api/v1/grid/deliverables/{id}/notion-sync` | POST | Re-push to Notion if initial push failed |
| `/api/v1/grid/deliverables/templates` | GET | List available templates |
| `/api/v1/grid/deliverables/templates` | POST | Create custom branded template |

### 28.8 Acceptance Criteria

- [ ] Full Report PDF: 12-16 pages, all sections rendered, GRID branding applied
- [ ] PDF specs: A4, 20mm margins, header on every page (except cover), footer with page numbers
- [ ] Cover page: GRID logo, mandate title, client name, date, "Prepared by GRID for [Kevin Hong]"
- [ ] CSV exports: target list, candidate pool, compensation — all columns present, consistent schema
- [ ] Notion DEX page created with correct properties (Type, Status, Date, Consultant)
- [ ] Template system: 6 standard templates available, custom branding overrides work
- [ ] Incomplete data: partial deliverables generated with "incomplete data" flag when module output missing
- [ ] PDF generation failure: retry once, then flag error to GRID
- [ ] Notion API failure: store locally, flag "sync failed — retry manually"
- [ ] All generated files versioned: `[Mandate]_GRID_[YYYYMMDD].pdf` — no overwrites
- [ ] Deliverable metadata stored in `grid_deliverables` table with pool stats + go/no-go result
- [ ] Candidate pool < 10 triggers "thin pool — consider supplementing" flag

---

## Summary

### Phase 4: GRID Integration — Complete Scope

| Metric | Value |
|--------|-------|
| **New Tables** | 9 (industries, companies, salary_benchmarks, talent_markets, target_companies, candidates, mandate_candidates, pipeline_metrics, grid_deliverables) |
| **Extended Tables** | 1 (mandates — 7 new columns) |
| **Total API Endpoints** | ~40 |
| **Core Algorithms** | 6 (market map, target scoring, candidate grading, go/no-go, compensation, deliverable) |
| **Scoring Dimensions** | 6 (sub-sector, role, geo, size, talent quality, competitive) |
| **Production Validated** | Yes (Yacoo mandate: 169 candidates, ~100 companies, 5 countries) |
| **Total Hours** | 114-156h (14-20 working days) |
| **Timeline** | Weeks 16-22 (6 weeks after Phase 3 complete) |
| **Critical Path** | T23 → T24 → T25 → T26 → T28 |

### Execution Order

```
Week 16:  T23 (Data Foundation) — critical path, everything depends on this
Week 17:  T24 (Market Map) starts | T23 continues seed data
Week 18:  T25 (Target Companies) + T27 (Compensation) in parallel
Week 19:  T26 (Candidate Analytics) — most complex module
Week 20:  T28 (Deliverable Generator) — needs all modules functional
Week 21:  Integration testing + Yacoo validation
Week 22:  Bug fixes + production readiness
```

### Key Design Decisions

1. **All algorithms production-validated**: Scoring weights, tier boundaries, go/no-go thresholds derived from Yacoo mandate — no theoretical parameters
2. **Dual A-grade computed column**: `mandate_candidates.dual_a_grade` is a PostgreSQL GENERATED column — always consistent, no stale state
3. **Pipeline forward-only**: Candidates cannot move backwards in funnel without explicit reclassification with audit trail
4. **Low-confidence flagging**: Any benchmark with <5 data points or >12 months old is flagged — GRID never presents uncertain data as definitive
5. **Template system**: 6 standard templates + custom branding overrides — no code changes needed for client-specific deliverables

---

*Generated: 2026-07-10 | Author: NEXUS | Owner: Kevin Hong*
