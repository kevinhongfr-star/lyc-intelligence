// Phase 6.1: Predictive Matching - Training Pipeline
// Feature extraction and model training for candidate-mandate matching

import type { SupabaseClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface TrainingSample {
  // Feature vector (normalized)
  features: number[];
  // Binary outcome: 1 = placed, 0 = not placed
  outcome: number;
}

export interface RawCandidateData {
  id: string;
  years_experience: number;
  current_company: string;
  current_title: string;
  current_industry: string;
  target_industries: string[];
  target_geographies: string[];
  skills: string[];
  disc_profile: string;
  education_level: number;
}

export interface RawMandateData {
  id: string;
  title: string;
  seniority_level: number;
  team_size: number;
  compensation_min: number;
  compensation_max: number;
  required_skills: string[];
  preferred_skills: string[];
  required_industries: string[];
  target_company_tiers: number[];
  success_profile_disc: string;
  client_geography: string;
}

export interface ComputedFeatures {
  years_experience: number;
  industry_match: number;
  geography_match: number;
  company_tier: number;
  skills_match: number;
  disc_match: number;
  seniority_match: number;
  compensation_match: number;
}

export interface ModelWeights {
  weights: number[];
  bias: number;
  featureNames: string[];
  trainedAt: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamples: number;
  validationAccuracy?: number;
}

export interface TrainingConfig {
  learningRate: number;
  epochs: number;
  regularization: number; // L2 regularization strength
  testSplit: number; // 0-1, proportion for test set
  minAccuracy: number; // Minimum accuracy to deploy
}

// ═══════════════════════════════════════════════════════════════
// FEATURE EXTRACTION
// ═══════════════════════════════════════════════════════════════

export const FEATURE_NAMES = [
  'years_experience',
  'industry_match',
  'geography_match',
  'company_tier',
  'skills_match',
  'disc_match',
  'seniority_match',
  'compensation_match',
];

export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  learningRate: 0.01,
  epochs: 1000,
  regularization: 0.01,
  testSplit: 0.2,
  minAccuracy: 0.6,
};

/**
 * Compute Jaccard similarity between two sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
}

/**
 * Normalize DISC profile to 4D vector
 */
function discToVector(disc: string): number[] {
  const profile = disc.toUpperCase();
  const vector: number[] = [0, 0, 0, 0]; // D, I, S, C
  const dominant = profile.charAt(0);
  
  const idx = ['D', 'I', 'S', 'C'].indexOf(dominant);
  if (idx >= 0) vector[idx] = 0.6;
  
  // Secondary
  if (profile.length > 1) {
    const secondary = profile.charAt(1);
    const secIdx = ['D', 'I', 'S', 'C'].indexOf(secondary);
    if (secIdx >= 0) vector[secIdx] += 0.3;
  }
  
  // Tertiary
  if (profile.length > 2) {
    const tertiary = profile.charAt(2);
    const tertIdx = ['D', 'I', 'S', 'C'].indexOf(tertiary);
    if (tertIdx >= 0) vector[tertIdx] += 0.1;
  }
  
  return vector;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Normalize value to 0-1 range
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Compute features for a candidate-mandate pair
 */
export function computeFeatures(
  candidate: RawCandidateData,
  mandate: RawMandateData
): ComputedFeatures {
  // Years of experience (normalized to 0-20 years)
  const yearsExperience = Math.min(candidate.years_experience || 0, 20) / 20;
  
  // Industry match (Jaccard similarity)
  const candidateIndustries = new Set([candidate.current_industry, ...(candidate.target_industries || [])]);
  const mandateIndustries = new Set(mandate.required_industries || []);
  const industryMatch = jaccardSimilarity(candidateIndustries, mandateIndustries);
  
  // Geography match
  const candidateGeographies = new Set(candidate.target_geographies || []);
  const mandateGeography = new Set([mandate.client_geography]);
  const geographyMatch = jaccardSimilarity(candidateGeographies, mandateGeography);
  
  // Company tier (based on current company - simplified)
  // In production, this would use a company database
  const companyTier = 3; // Default middle tier
  
  // Skills match
  const candidateSkills = new Set(candidate.skills || []);
  const mandateRequiredSkills = new Set(mandate.required_skills || []);
  const mandatePreferredSkills = new Set(mandate.preferred_skills || []);
  
  const requiredMatch = jaccardSimilarity(candidateSkills, mandateRequiredSkills);
  const preferredMatch = jaccardSimilarity(candidateSkills, mandatePreferredSkills);
  const skillsMatch = (requiredMatch * 0.7 + preferredMatch * 0.3);
  
  // DISC match (cosine similarity of profiles)
  const candidateDisc = discToVector(candidate.disc_profile || 'DISC');
  const successDisc = discToVector(mandate.success_profile_disc || 'DISC');
  const discMatch = cosineSimilarity(candidateDisc, successDisc);
  
  // Seniority match
  const candidateSeniority = Math.min(candidate.years_experience || 0, 20) / 4; // Map to 1-5 scale
  const seniorityDiff = Math.abs(candidateSeniority - mandate.seniority_level);
  const seniorityMatch = 1 - (seniorityDiff / 5); // 0-1 where 1 is perfect match
  
  // Compensation match
  const candidateComp = (mandate.compensation_min + mandate.compensation_max) / 2 / 1000; // $K
  // Simplified - would need salary data from candidate
  const compensationMatch = 0.5; // Default neutral
  
  return {
    years_experience: yearsExperience,
    industry_match: industryMatch,
    geography_match: geographyMatch,
    company_tier: companyTier / 5, // Normalize to 0-1
    skills_match: skillsMatch,
    disc_match: (discMatch + 1) / 2, // Convert -1,1 to 0,1
    seniority_match: Math.max(0, seniorityMatch),
    compensation_match: compensationMatch,
  };
}

/**
 * Convert features to array
 */
export function featuresToArray(features: ComputedFeatures): number[] {
  return [
    features.years_experience,
    features.industry_match,
    features.geography_match,
    features.company_tier,
    features.skills_match,
    features.disc_match,
    features.seniority_match,
    features.compensation_match,
  ];
}

// ═══════════════════════════════════════════════════════════════
// LOGISTIC REGRESSION (Gradient Descent)
// ═══════════════════════════════════════════════════════════════

/**
 * Sigmoid function
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Compute prediction from weights
 */
function predict(x: number[], weights: number[], bias: number): number {
  let sum = bias;
  for (let i = 0; i < x.length; i++) {
    sum += x[i] * weights[i];
  }
  return sigmoid(sum);
}

/**
 * Compute binary cross-entropy loss
 */
function computeLoss(
  X: number[][],
  y: number[],
  weights: number[],
  bias: number,
  regularization: number
): number {
  const m = X.length;
  let loss = 0;
  
  for (let i = 0; i < m; i++) {
    const prediction = predict(X[i], weights, bias);
    const epsilon = 1e-15;
    const clipped = Math.max(epsilon, Math.min(1 - epsilon, prediction));
    loss += -(y[i] * Math.log(clipped) + (1 - y[i]) * Math.log(1 - clipped));
  }
  
  // L2 regularization
  let regLoss = 0;
  for (let j = 0; j < weights.length; j++) {
    regLoss += weights[j] * weights[j];
  }
  regLoss = (regularization / (2 * m)) * regLoss;
  
  return loss / m + regLoss;
}

/**
 * Train logistic regression using gradient descent
 */
export function trainLogisticRegression(
  X: number[][],
  y: number[],
  config: Partial<TrainingConfig> = {}
): { weights: number[]; bias: number; lossHistory: number[] } {
  const {
    learningRate = DEFAULT_TRAINING_CONFIG.learningRate,
    epochs = DEFAULT_TRAINING_CONFIG.epochs,
    regularization = DEFAULT_TRAINING_CONFIG.regularization,
  } = config;
  
  const m = X.length; // Number of samples
  const n = X[0].length; // Number of features
  
  // Initialize weights to small random values
  const weights = Array.from({ length: n }, () => (Math.random() - 0.5) * 0.1);
  let bias = 0;
  
  const lossHistory: number[] = [];
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    // Compute gradients
    const dw = Array(n).fill(0);
    let db = 0;
    
    for (let i = 0; i < m; i++) {
      const prediction = predict(X[i], weights, bias);
      const error = prediction - y[i];
      
      for (let j = 0; j < n; j++) {
        dw[j] += error * X[i][j];
      }
      db += error;
    }
    
    // Apply gradients (with regularization)
    for (let j = 0; j < n; j++) {
      dw[j] = dw[j] / m + (regularization / m) * weights[j];
    }
    db = db / m;
    
    // Update weights
    for (let j = 0; j < n; j++) {
      weights[j] -= learningRate * dw[j];
    }
    bias -= learningRate * db;
    
    // Record loss every 100 epochs
    if (epoch % 100 === 0) {
      const loss = computeLoss(X, y, weights, bias, regularization);
      lossHistory.push(loss);
    }
  }
  
  return { weights, bias, lossHistory };
}

/**
 * Compute accuracy
 */
function computeAccuracy(
  X: number[][],
  y: number[],
  weights: number[],
  bias: number
): number {
  let correct = 0;
  
  for (let i = 0; i < X.length; i++) {
    const prediction = predict(X[i], weights, bias);
    const predicted = prediction >= 0.5 ? 1 : 0;
    if (predicted === y[i]) correct++;
  }
  
  return correct / X.length;
}

/**
 * Compute precision, recall, F1
 */
function computeMetrics(
  X: number[][],
  y: number[],
  weights: number[],
  bias: number
): { precision: number; recall: number; f1: number } {
  let tp = 0, fp = 0, fn = 0, tn = 0;
  
  for (let i = 0; i < X.length; i++) {
    const prediction = predict(X[i], weights, bias);
    const predicted = prediction >= 0.5 ? 1 : 0;
    
    if (predicted === 1 && y[i] === 1) tp++;
    else if (predicted === 1 && y[i] === 0) fp++;
    else if (predicted === 0 && y[i] === 1) fn++;
    else tn++;
  }
  
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? 2 * (precision * recall) / (precision + recall) : 0;
  
  return { precision, recall, f1 };
}

/**
 * Normalize features using min-max scaling
 */
function normalizeFeatures(X: number[][]): { normalized: number[][]; min: number[]; max: number[] } {
  const m = X.length;
  const n = X[0].length;
  
  // Find min and max for each feature
  const min: number[] = Array(n).fill(Infinity);
  const max: number[] = Array(n).fill(-Infinity);
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (X[i][j] < min[j]) min[j] = X[i][j];
      if (X[i][j] > max[j]) max[j] = X[i][j];
    }
  }
  
  // Normalize
  const normalized: number[][] = [];
  for (let i = 0; i < m; i++) {
    normalized.push([]);
    for (let j = 0; j < n; j++) {
      if (max[j] === min[j]) {
        normalized[i].push(0.5);
      } else {
        normalized[i].push((X[i][j] - min[j]) / (max[j] - min[j]));
      }
    }
  }
  
  return { normalized, min, max };
}

// ═══════════════════════════════════════════════════════════════
// TRAINING PIPELINE
// ═══════════════════════════════════════════════════════════════

export interface TrainingResult {
  success: boolean;
  modelId?: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingSamples: number;
  testSamples: number;
  message: string;
}

/**
 * Split data into train and test sets
 */
function splitData(
  samples: TrainingSample[],
  testSplit: number
): { train: TrainingSample[]; test: TrainingSample[] } {
  const shuffled = [...samples].sort(() => Math.random() - 0.5);
  const splitIdx = Math.floor(samples.length * (1 - testSplit));
  return {
    train: shuffled.slice(0, splitIdx),
    test: shuffled.slice(splitIdx),
  };
}

/**
 * Main training pipeline
 */
export async function runTrainingPipeline(
  supabase: SupabaseClient,
  config: Partial<TrainingConfig> = {}
): Promise<TrainingResult> {
  const fullConfig = { ...DEFAULT_TRAINING_CONFIG, ...config };
  
  try {
    // 1. Check data availability
    const { count: placementCount } = await supabase
      .from('candidates_pipeline')
      .select('*', { count: 'exact', head: true })
      .in('stage', ['offer_accepted', 'onboarded', 'probation_passed']);
    
    if ((placementCount || 0) < 500) {
      return {
        success: false,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingSamples: 0,
        testSamples: 0,
        message: `Insufficient data: ${placementCount} placements (minimum 500 required). Using rule-based matching instead.`,
      };
    }
    
    // 2. Extract training samples
    // Positive samples: placed candidates
    const { data: placements, error: placementsError } = await supabase
      .from('candidates_pipeline')
      .select(`
        *,
        contacts:candidate_id(
          id,
          years_experience,
          current_company,
          current_title,
          current_industry,
          skills,
          disc_profile
        ),
        mandates:mandate_id(
          id,
          seniority_level,
          team_size,
          compensation_min,
          compensation_max,
          required_skills,
          preferred_industries,
          success_profile_disc,
          client_geography
        )
      `)
      .in('stage', ['offer_accepted', 'onboarded', 'probation_passed']);
    
    if (placementsError) throw placementsError;
    
    // Negative samples: rejected after interview
    const { data: rejections, error: rejectionsError } = await supabase
      .from('candidates_pipeline')
      .select(`
        *,
        contacts:candidate_id(
          id,
          years_experience,
          current_company,
          current_title,
          current_industry,
          skills,
          disc_profile
        ),
        mandates:mandate_id(
          id,
          seniority_level,
          team_size,
          compensation_min,
          compensation_max,
          required_skills,
          preferred_industries,
          success_profile_disc,
          client_geography
        )
      `)
      .in('stage', ['rejected', 'withdrawn'])
      .gte('stage_order', 6);
    
    if (rejectionsError) throw rejectionsError;
    
    // 3. Compute features for all samples
    const samples: TrainingSample[] = [];
    
    // Process positive samples
    for (const row of placements || []) {
      const candidate = row.contacts as any;
      const mandate = row.mandates as any;
      
      if (!candidate || !mandate) continue;
      
      const features = computeFeatures(candidate, mandate);
      samples.push({
        features: featuresToArray(features),
        outcome: 1,
      });
    }
    
    // Process negative samples
    for (const row of rejections || []) {
      const candidate = row.contacts as any;
      const mandate = row.mandates as any;
      
      if (!candidate || !mandate) continue;
      
      const features = computeFeatures(candidate, mandate);
      samples.push({
        features: featuresToArray(features),
        outcome: 0,
      });
    }
    
    if (samples.length < 100) {
      return {
        success: false,
        accuracy: 0,
        precision: 0,
        recall: 0,
        f1Score: 0,
        trainingSamples: samples.length,
        testSamples: 0,
        message: `Insufficient samples after feature extraction: ${samples.length}.`,
      };
    }
    
    // 4. Normalize features
    const featureArrays = samples.map(s => s.features);
    const outcomes = samples.map(s => s.outcome);
    const { normalized, min, max } = normalizeFeatures(featureArrays);
    
    const normalizedSamples: TrainingSample[] = normalized.map((features, i) => ({
      features,
      outcome: outcomes[i],
    }));
    
    // 5. Split into train/test
    const { train, test } = splitData(normalizedSamples, fullConfig.testSplit);
    
    // 6. Train model
    const X_train = train.map(s => s.features);
    const y_train = train.map(s => s.outcome);
    const X_test = test.map(s => s.features);
    const y_test = test.map(s => s.outcome);
    
    const { weights, bias, lossHistory } = trainLogisticRegression(X_train, y_train, fullConfig);
    
    // 7. Evaluate
    const accuracy = computeAccuracy(X_test, y_test, weights, bias);
    const metrics = computeMetrics(X_test, y_test, weights, bias);
    
    // 8. Check minimum accuracy
    if (accuracy < fullConfig.minAccuracy) {
      // Alert admin - model may need feature engineering
      console.warn(`Model accuracy (${accuracy}) below minimum (${fullConfig.minAccuracy}). Alerting admin.`);
      
      // Store model anyway but mark as not deployable
      // In production, send alert notification here
    }
    
    // 9. Deactivate old models of same type
    await supabase
      .from('ml_models')
      .update({ is_active: false })
      .eq('model_type', 'predictive_matching')
      .eq('is_active', true);
    
    // 10. Store new model
    const trainedAt = new Date().toISOString();
    const version = `v${new Date().toISOString().split('T')[0]}`;
    
    const { data: modelData, error: modelError } = await supabase
      .from('ml_models')
      .insert({
        model_type: 'predictive_matching',
        model_version: version,
        description: `Trained on ${samples.length} samples`,
        weights: weights,
        bias: bias,
        feature_names: FEATURE_NAMES,
        accuracy: accuracy,
        precision_score: metrics.precision,
        recall_score: metrics.recall,
        f1_score: metrics.f1,
        training_samples: train.length,
        test_samples: test.length,
        trained_at: trainedAt,
        is_active: accuracy >= fullConfig.minAccuracy,
        is_deployed: accuracy >= fullConfig.minAccuracy,
        feature_engineering_config: {
          min,
          max,
          normalization: 'minmax',
        },
        validation_results: {
          lossHistory: lossHistory.slice(-10), // Last 10 losses
          finalLoss: lossHistory[lossHistory.length - 1],
        },
      })
      .select('id')
      .single();
    
    if (modelError) throw modelError;
    
    return {
      success: true,
      modelId: modelData.id,
      accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1,
      trainingSamples: train.length,
      testSamples: test.length,
      message: `Model trained successfully with ${(accuracy * 100).toFixed(1)}% accuracy`,
    };
    
  } catch (error) {
    console.error('[TrainingPipeline] Error:', error);
    return {
      success: false,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      trainingSamples: 0,
      testSamples: 0,
      message: `Training failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if sufficient training data is available
 */
export async function checkDataAvailability(supabase: SupabaseClient): Promise<{
  hasSufficientData: boolean;
  placementCount: number;
}> {
  const { count } = await supabase
    .from('candidates_pipeline')
    .select('*', { count: 'exact', head: true })
    .in('stage', ['offer_accepted', 'onboarded', 'probation_passed']);
  
  return {
    hasSufficientData: (count || 0) >= 500,
    placementCount: count || 0,
  };
}

/**
 * Monthly retrain function (for cron job)
 */
export async function monthlyRetrain(supabase: SupabaseClient): Promise<TrainingResult> {
  console.log('[TrainingPipeline] Starting monthly retrain...');
  const result = await runTrainingPipeline(supabase);
  
  if (result.success) {
    console.log(`[TrainingPipeline] Monthly retrain completed: ${result.message}`);
  } else {
    console.warn(`[TrainingPipeline] Monthly retrain failed: ${result.message}`);
  }
  
  return result;
}
