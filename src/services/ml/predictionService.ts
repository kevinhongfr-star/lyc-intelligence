// Phase 6.1: Predictive Matching - Prediction Service
// Candidate-mandate match score prediction using trained ML model

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  computeFeatures,
  featuresToArray,
  FEATURE_NAMES,
} from './trainingPipeline';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface PredictionResult {
  score: number; // 0-100
  rawProbability: number; // 0-1
  confidence: 'high' | 'medium' | 'low';
  modelVersion: string;
  modelId: string;
  features: Record<string, number>;
  consultantOverride?: {
    originalScore: number;
    overrideScore: number;
    reason: string;
    overriddenBy: string;
  };
}

export interface CachedModel {
  id: string;
  weights: number[];
  bias: number;
  featureNames: string[];
  featureConfig: {
    min: number[];
    max: number[];
  };
  version: string;
  trainedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// MODEL CACHE
// ═══════════════════════════════════════════════════════════════

// Simple in-memory cache for the active model
let cachedModel: CachedModel | null = null;
let cacheExpiry: Date | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get or refresh cached model
 */
async function getCachedModel(supabase: SupabaseClient): Promise<CachedModel | null> {
  const now = new Date();
  
  // Check if cache is valid
  if (cachedModel && cacheExpiry && now < cacheExpiry) {
    return cachedModel;
  }
  
  // Fetch latest active model from database
  const { data: model, error } = await supabase
    .from('ml_models')
    .select('*')
    .eq('model_type', 'predictive_matching')
    .eq('is_active', true)
    .order('trained_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error || !model) {
    console.warn('[PredictionService] No active model found');
    return null;
  }
  
  cachedModel = {
    id: model.id,
    weights: model.weights as number[],
    bias: model.bias as number,
    featureNames: model.feature_names as string[],
    featureConfig: model.feature_engineering_config as { min: number[]; max: number[] } || { min: [], max: [] },
    version: model.model_version as string,
    trainedAt: model.trained_at as string,
  };
  
  cacheExpiry = new Date(now.getTime() + CACHE_TTL_MS);
  
  return cachedModel;
}

/**
 * Invalidate model cache (call after model update)
 */
export function invalidateModelCache(): void {
  cachedModel = null;
  cacheExpiry = null;
}

// ═══════════════════════════════════════════════════════════════
// PREDICTION
// ═══════════════════════════════════════════════════════════════

/**
 * Sigmoid function
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Predict using trained model
 */
function predictWithModel(
  features: number[],
  weights: number[],
  bias: number
): number {
  let sum = bias;
  for (let i = 0; i < features.length; i++) {
    sum += features[i] * weights[i];
  }
  return sigmoid(sum);
}

/**
 * Normalize a single feature vector
 */
function normalizeFeatures(
  features: number[],
  min: number[],
  max: number[]
): number[] {
  return features.map((value, i) => {
    if (max[i] === min[i]) return 0.5;
    return (value - min[i]) / (max[i] - min[i]);
  });
}

/**
 * Calculate prediction confidence based on distance from 0.5
 */
function calculateConfidence(rawProbability: number): 'high' | 'medium' | 'low' {
  const distance = Math.abs(rawProbability - 0.5);
  if (distance > 0.35) return 'high';
  if (distance > 0.2) return 'medium';
  return 'low';
}

/**
 * Get feature importance (simplified - based on absolute weight values)
 */
function getFeatureImportance(
  features: Record<string, number>,
  weights: number[],
  featureNames: string[]
): Record<string, number> {
  const importance: Record<string, number> = {};
  const maxWeight = Math.max(...weights.map(w => Math.abs(w)));
  
  for (let i = 0; i < featureNames.length; i++) {
    const normalizedWeight = Math.abs(weights[i]) / maxWeight;
    importance[featureNames[i]] = features[featureNames[i]] * normalizedWeight;
  }
  
  return importance;
}

// ═══════════════════════════════════════════════════════════════
// MAIN PREDICTION FUNCTION
// ═══════════════════════════════════════════════════════════════

export interface PredictMatchScoreOptions {
  candidateId: string;
  mandateId: string;
  organizationId: string;
  userId: string;
}

/**
 * Predict candidate-mandate match score
 */
export async function predictMatchScore(
  supabase: SupabaseClient,
  options: PredictMatchScoreOptions
): Promise<PredictionResult | null> {
  const { candidateId, mandateId } = options;
  
  try {
    // 1. Get candidate data
    const { data: candidate, error: candidateError } = await supabase
      .from('contacts')
      .select(`
        id,
        years_experience,
        current_company,
        current_title,
        current_industry,
        target_industries,
        target_geographies,
        skills,
        disc_profile,
        education_level
      `)
      .eq('id', candidateId)
      .single();
    
    if (candidateError || !candidate) {
      console.error('[PredictionService] Candidate not found:', candidateId);
      return null;
    }
    
    // 2. Get mandate data
    const { data: mandate, error: mandateError } = await supabase
      .from('mandates')
      .select(`
        id,
        title,
        seniority_level,
        team_size,
        compensation_min,
        compensation_max,
        required_skills,
        preferred_skills,
        required_industries,
        target_company_tiers,
        success_profile_disc,
        client_geography
      `)
      .eq('id', mandateId)
      .single();
    
    if (mandateError || !mandate) {
      console.error('[PredictionService] Mandate not found:', mandateId);
      return null;
    }
    
    // 3. Compute features
    const rawCandidate = {
      id: candidate.id,
      years_experience: candidate.years_experience || 0,
      current_company: candidate.current_company || '',
      current_title: candidate.current_title || '',
      current_industry: candidate.current_industry || '',
      target_industries: candidate.target_industries || [],
      target_geographies: candidate.target_geographies || [],
      skills: candidate.skills || [],
      disc_profile: candidate.disc_profile || 'DISC',
      education_level: candidate.education_level || 3,
    };
    
    const rawMandate = {
      id: mandate.id,
      title: mandate.title || '',
      seniority_level: mandate.seniority_level || 3,
      team_size: mandate.team_size || 5,
      compensation_min: mandate.compensation_min || 50000,
      compensation_max: mandate.compensation_max || 150000,
      required_skills: mandate.required_skills || [],
      preferred_skills: mandate.preferred_skills || [],
      required_industries: mandate.required_industries || [],
      target_company_tiers: mandate.target_company_tiers || [],
      success_profile_disc: mandate.success_profile_disc || 'DISC',
      client_geography: mandate.client_geography || '',
    };
    
    const features = computeFeatures(rawCandidate, rawMandate);
    const rawFeatures = featuresToArray(features);
    
    // 4. Get model (with caching)
    const model = await getCachedModel(supabase);
    
    if (!model) {
      // Fallback to rule-based score (simplified)
      const fallbackScore = Math.round(
        (features.skills_match * 30 +
         features.industry_match * 20 +
         features.disc_match * 20 +
         features.seniority_match * 15 +
         features.geography_match * 10 +
         features.years_experience * 5) * 2
      );
      
      return {
        score: Math.min(100, Math.max(0, fallbackScore)),
        rawProbability: fallbackScore / 100,
        confidence: 'low',
        modelVersion: 'fallback',
        modelId: 'fallback',
        features: {
          years_experience: features.years_experience,
          industry_match: features.industry_match,
          geography_match: features.geography_match,
          company_tier: features.company_tier,
          skills_match: features.skills_match,
          disc_match: features.disc_match,
          seniority_match: features.seniority_match,
          compensation_match: features.compensation_match,
        },
      };
    }
    
    // 5. Normalize features using model's min/max
    const normalizedFeatures = normalizeFeatures(
      rawFeatures,
      model.featureConfig.min,
      model.featureConfig.max
    );
    
    // 6. Predict
    const rawProbability = predictWithModel(
      normalizedFeatures,
      model.weights,
      model.bias
    );
    
    // 7. Convert to 0-100 score
    const score = Math.round(rawProbability * 100);
    
    // 8. Calculate confidence
    const confidence = calculateConfidence(rawProbability);
    
    // 9. Log prediction for audit
    await supabase
      .from('prediction_logs')
      .insert({
        model_id: model.id,
        candidate_id: candidateId,
        mandate_id: mandateId,
        features: FEATURE_NAMES.reduce((acc, name, i) => {
          acc[name] = rawFeatures[i];
          return acc;
        }, {} as Record<string, number>),
        raw_score: rawProbability,
        final_score: score,
      });
    
    // 10. Check for existing override
    const { data: existingOverride } = await supabase
      .from('prediction_logs')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('mandate_id', mandateId)
      .eq('consultant_override', true)
      .order('predicted_at', { ascending: false })
      .limit(1)
      .single();
    
    const result: PredictionResult = {
      score,
      rawProbability,
      confidence,
      modelVersion: model.version,
      modelId: model.id,
      features: {
        years_experience: features.years_experience,
        industry_match: features.industry_match,
        geography_match: features.geography_match,
        company_tier: features.company_tier,
        skills_match: features.skills_match,
        disc_match: features.disc_match,
        seniority_match: features.seniority_match,
        compensation_match: features.compensation_match,
      },
    };
    
    if (existingOverride) {
      result.consultantOverride = {
        originalScore: score,
        overrideScore: existingOverride.override_score as number,
        reason: existingOverride.override_reason as string,
        overriddenBy: existingOverride.overridden_by as string,
      };
    }
    
    return result;
    
  } catch (error) {
    console.error('[PredictionService] Prediction error:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// CONSULTANT OVERRIDE
// ═══════════════════════════════════════════════════════════════

export interface OverridePredictionOptions {
  candidateId: string;
  mandateId: string;
  overrideScore: number;
  reason: string;
  userId: string;
}

/**
 * Override ML prediction with consultant judgment
 */
export async function overridePrediction(
  supabase: SupabaseClient,
  options: OverridePredictionOptions
): Promise<boolean> {
  const { candidateId, mandateId, overrideScore, reason, userId } = options;
  
  try {
    // Find the latest prediction log
    const { data: predictionLog, error: logError } = await supabase
      .from('prediction_logs')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('mandate_id', mandateId)
      .order('predicted_at', { ascending: false })
      .limit(1)
      .single();
    
    if (logError && logError.code !== 'PGRST116') {
      throw logError;
    }
    
    if (predictionLog) {
      // Update existing log
      const { error: updateError } = await supabase
        .from('prediction_logs')
        .update({
          consultant_override: true,
          override_score: overrideScore,
          override_reason: reason,
          overridden_by: userId,
        })
        .eq('id', predictionLog.id);
      
      if (updateError) throw updateError;
    } else {
      // Create new override record (without ML score)
      const { error: insertError } = await supabase
        .from('prediction_logs')
        .insert({
          candidate_id: candidateId,
          mandate_id: mandateId,
          features: {},
          raw_score: overrideScore / 100,
          final_score: overrideScore,
          consultant_override: true,
          override_score: overrideScore,
          override_reason: reason,
          overridden_by: userId,
        });
      
      if (insertError) throw insertError;
    }
    
    // Also update scoring_runs if exists
    await supabase
      .from('scoring_runs')
      .update({
        consultant_override: overrideScore,
        consultant_override_reason: reason,
      })
      .eq('candidate_id', candidateId)
      .eq('mandate_id', mandateId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    return true;
    
  } catch (error) {
    console.error('[PredictionService] Override error:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// MODEL INFO
// ═══════════════════════════════════════════════════════════════

export interface ModelInfo {
  id: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedAt: string;
  trainingSamples: number;
  isActive: boolean;
}

/**
 * Get information about the active model
 */
export async function getActiveModelInfo(
  supabase: SupabaseClient
): Promise<ModelInfo | null> {
  const { data: model, error } = await supabase
    .from('ml_models')
    .select('*')
    .eq('model_type', 'predictive_matching')
    .eq('is_active', true)
    .single();
  
  if (error || !model) {
    return null;
  }
  
  return {
    id: model.id,
    version: model.model_version as string,
    accuracy: model.accuracy as number,
    precision: model.precision_score as number,
    recall: model.recall_score as number,
    f1Score: model.f1_score as number,
    trainedAt: model.trained_at as string,
    trainingSamples: model.training_samples as number,
    isActive: model.is_active as boolean,
  };
}

// ═══════════════════════════════════════════════════════════════
// FEATURE IMPORTANCE
// ═══════════════════════════════════════════════════════════════

export interface FeatureImportance {
  feature: string;
  weight: number;
  normalizedImportance: number;
  featureValue: number;
}

/**
 * Get feature importance for a specific prediction
 */
export async function getFeatureImportanceForPrediction(
  supabase: SupabaseClient,
  candidateId: string,
  mandateId: string
): Promise<FeatureImportance[] | null> {
  const model = await getCachedModel(supabase);
  if (!model) return null;
  
  // Get candidate and mandate data
  const { data: candidate } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', candidateId)
    .single();
  
  const { data: mandate } = await supabase
    .from('mandates')
    .select('*')
    .eq('id', mandateId)
    .single();
  
  if (!candidate || !mandate) return null;
  
  const rawCandidate = {
    id: candidate.id,
    years_experience: candidate.years_experience || 0,
    current_company: candidate.current_company || '',
    current_title: candidate.current_title || '',
    current_industry: candidate.current_industry || '',
    target_industries: candidate.target_industries || [],
    target_geographies: candidate.target_geographies || [],
    skills: candidate.skills || [],
    disc_profile: candidate.disc_profile || 'DISC',
    education_level: candidate.education_level || 3,
  };
  
  const rawMandate = {
    id: mandate.id,
    title: mandate.title || '',
    seniority_level: mandate.seniority_level || 3,
    team_size: mandate.team_size || 5,
    compensation_min: mandate.compensation_min || 50000,
    compensation_max: mandate.compensation_max || 150000,
    required_skills: mandate.required_skills || [],
    preferred_skills: mandate.preferred_skills || [],
    required_industries: mandate.required_industries || [],
    target_company_tiers: mandate.target_company_tiers || [],
    success_profile_disc: mandate.success_profile_disc || 'DISC',
    client_geography: mandate.client_geography || '',
  };
  
  const features = computeFeatures(rawCandidate, rawMandate);
  const rawFeatures = featuresToArray(features);
  
  const maxWeight = Math.max(...model.weights.map(w => Math.abs(w)));
  
  return FEATURE_NAMES.map((name, i) => ({
    feature: name,
    weight: model.weights[i],
    normalizedImportance: Math.abs(model.weights[i]) / maxWeight,
    featureValue: rawFeatures[i],
  })).sort((a, b) => b.normalizedImportance - a.normalizedImportance);
}
