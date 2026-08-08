import React from 'react';
import { GridMappingEditor } from '@/components/grid/GridMappingEditor';

/**
 * Phase 9 — GRID Market Mapping page.
 * Renders inside AppShell (the /grid surface). The GridMappingEditor
 * component already calls /api/grid/* endpoints directly via fetch(), so
 * no service-layer refactor is required for this phase.
 */
export default function GridPage() {
  return <GridMappingEditor />;
}
