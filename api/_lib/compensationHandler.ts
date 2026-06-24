/**
 * api/_lib/compensationHandler.ts
 * Routes:
 *   GET  /api/x/compensation/benchmark      → benchmark data
 *   GET  /api/x/compensation/data-points     → data points
 *   POST /api/x/compensation/refresh         → refresh benchmark
 *   GET  /api/x/compensation/suggestions     → salary suggestions
 *   POST /api/x/compensation/surveys/import  → import survey data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as db from './supabaseRest.js';

export async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const resource = pathArr[0] || '';
  const subResource = pathArr[1] || '';
  const method = req.method || 'GET';

  try {
    // ── Benchmark data ──
    if (resource === 'benchmark') {
      const { org_id, title, location, years_exp } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (title) filters.push({ column: 'title', value: title });
      if (location) filters.push({ column: 'location', value: location });

      const rows = await db.selectMany('compensation_benchmark', {
        select: '*',
        where: filters,
        orderBy: { column: 'percentile_50', ascending: true },
      });

      return res.status(200).json({ success: true, benchmark: rows });
    }

    // ── Data Points ──
    if (resource === 'data-points') {
      const { org_id, benchmark_id, limit = '100' } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      const filters = [{ column: 'org_id', value: org_id }];
      if (benchmark_id) filters.push({ column: 'benchmark_id', value: benchmark_id });

      const rows = await db.selectMany('compensation_data_points', {
        select: '*',
        where: filters,
        orderBy: { column: 'created_at', ascending: false },
        limit: parseInt(limit),
      });

      return res.status(200).json({ success: true, data_points: rows });
    }

    // ── Refresh benchmark ──
    if (resource === 'refresh' && method === 'POST') {
      const body = req.body || {};
      const { org_id, benchmark_id } = body;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      // Update last_refreshed_at
      const now = new Date().toISOString();

      if (benchmark_id) {
        const result = await db.update('compensation_benchmark', {
          last_refreshed_at: now,
        }, benchmark_id);
        return res.status(200).json({ success: true, benchmark: result });
      }

      // Refresh all benchmarks for org
      const benchmarks = await db.selectMany('compensation_benchmark', {
        select: 'id',
        where: [{ column: 'org_id', value: org_id }],
      });

      for (const b of benchmarks) {
        await db.update('compensation_benchmark', { last_refreshed_at: now }, b.id);
      }

      return res.status(200).json({
        success: true,
        refreshed_count: benchmarks.length,
      });
    }

    // ── Suggestions ──
    if (resource === 'suggestions') {
      const { org_id, title, location, years_exp } = req.query as Record<string, string>;

      if (!org_id) {
        return res.status(400).json({ error: 'org_id is required' });
      }

      // Find matching benchmark
      const filters = [{ column: 'org_id', value: org_id }];
      if (title) filters.push({ column: 'title', value: title });
      if (location) filters.push({ column: 'location', value: location });

      const benchmark = await db.selectOne('compensation_benchmark', {
        select: '*',
        where: filters,
      });

      if (!benchmark) {
        return res.status(200).json({
          success: true,
          suggestion: null,
          message: 'No matching benchmark found',
        });
      }

      // Calculate suggestion based on years of experience
      const years = years_exp ? parseInt(years_exp) : 0;
      const adjustmentFactor = Math.min(years / 10, 0.3); // Max 30% adjustment for seniority

      const baseSalary = benchmark.percentile_50;
      const suggestedMin = Math.round(baseSalary * (0.9 + adjustmentFactor * 0.1));
      const suggestedMid = Math.round(baseSalary * (1 + adjustmentFactor * 0.1));
      const suggestedMax = Math.round(baseSalary * (1.1 + adjustmentFactor * 0.15));

      return res.status(200).json({
        success: true,
        suggestion: {
          benchmark_id: benchmark.id,
          title: benchmark.title,
          location: benchmark.location,
          base_benchmark: baseSalary,
          suggested_min: suggestedMin,
          suggested_mid: suggestedMid,
          suggested_max: suggestedMax,
          adjustment_factor: adjustmentFactor,
          years_experience: years,
        },
      });
    }

    // ── Import survey data ──
    if (resource === 'surveys' && subResource === 'import' && method === 'POST') {
      const body = req.body || {};
      const { org_id, survey_source, data_points } = body;

      if (!org_id || !survey_source || !data_points || !Array.isArray(data_points)) {
        return res.status(400).json({
          error: 'org_id, survey_source, and data_points array are required',
        });
      }

      let imported = 0;
      for (const point of data_points) {
        try {
          await db.insert('compensation_data_points', {
            org_id,
            benchmark_id: point.benchmark_id || null,
            title: point.title,
            location: point.location || null,
            base_salary: point.base_salary,
            total_compensation: point.total_compensation || point.base_salary,
            years_experience: point.years_experience || null,
            data_source: survey_source,
            collected_at: point.collected_at || new Date().toISOString(),
          });
          imported++;
        } catch {
          // Skip duplicates or invalid entries
        }
      }

      return res.status(201).json({
        success: true,
        imported_count: imported,
        total_points: data_points.length,
      });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err: any) {
    console.error('[compensationHandler]', err);
    return res.status(500).json({ error: err.message });
  }
}
