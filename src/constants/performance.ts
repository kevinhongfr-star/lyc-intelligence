// Phase 0.5: Performance Budget Definitions
// Measurable targets for page load, API response, and bundle size

export const PERFORMANCE_BUDGET = {
  page: {
    fcp: 1500,
    lcp: 2500,
    tti: 3500,
    cls: 0.1,
    tbt: 200,
    first_input_delay: 100,
    speed_index: 2800,
  },
  api: {
    listGet: 300,
    singleGet: 150,
    mutation: 500,
    complexQuery: 2000,
    fileUpload: 5000,
    authEndpoint: 400,
    searchEndpoint: 1500,
  },
  bundle: {
    initialJs: 256000,
    routeChunk: 51200,
    totalJs: 512000,
    css: 30720,
    imagesPerPage: 20,
    maxImageSize: 200000,
    fontTotal: 80000,
  },
} as const;

export type PerformanceBudget = typeof PERFORMANCE_BUDGET;
export type ApiOperation = keyof typeof PERFORMANCE_BUDGET.api;
export type PageMetric = keyof typeof PERFORMANCE_BUDGET.page;
export type BundleAsset = keyof typeof PERFORMANCE_BUDGET.bundle;

/**
 * Get the API budget for a given operation name.
 * Falls back to complexQuery for unknown operations.
 */
export function getApiBudget(operation: string): number {
  const apiBudgets = PERFORMANCE_BUDGET.api as Record<string, number>;
  if (operation in apiBudgets) {
    return apiBudgets[operation];
  }
  if (operation.includes('list') || operation.includes('search')) {
    return PERFORMANCE_BUDGET.api.listGet;
  }
  if (operation.includes('upload') || operation.includes('import')) {
    return PERFORMANCE_BUDGET.api.fileUpload;
  }
  if (operation.includes('report') || operation.includes('analytics')) {
    return PERFORMANCE_BUDGET.api.complexQuery;
  }
  return PERFORMANCE_BUDGET.api.mutation;
}

/**
 * Measure and log performance of an operation against its budget.
 * Returns the duration in milliseconds.
 */
export function measurePerformance(
  operationName: string,
  startTime: number,
  sampleSize?: number
): {
  duration: number;
  budget: number;
  overBudget: boolean;
  sampleSize: number;
} {
  const duration = Date.now() - startTime;
  const budget = getApiBudget(operationName);
  const overBudget = duration > budget;

  if (overBudget) {
    console.warn(
      `[PERF] ${operationName} took ${duration}ms (budget: ${budget}ms, over by ${duration - budget}ms)`
    );
  } else if (process.env.NODE_ENV === 'development') {
    console.debug(
      `[PERF] ${operationName}: ${duration}ms / ${budget}ms (${Math.round((duration / budget) * 100)}%)`
    );
  }

  return {
    duration,
    budget,
    overBudget,
    sampleSize: sampleSize ?? 1,
  };
}

/**
 * Create a performance timer for measuring async operations.
 */
export function createPerfTimer(operationName: string) {
  const startTime = performance.now();

  return {
    end(sampleSize?: number) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const budget = getApiBudget(operationName);
      const overBudget = duration > budget;

      if (overBudget) {
        console.warn(
          `[PERF] ${operationName} took ${Math.round(duration)}ms (budget: ${budget}ms)`
        );
      }

      return {
        duration: Math.round(duration),
        budget,
        overBudget,
        sampleSize: sampleSize ?? 1,
      };
    },
  };
}

/**
 * Check if a bundle size is within budget.
 */
export function checkBundleBudget(
  asset: BundleAsset,
  sizeBytes: number
): {
  withinBudget: boolean;
  percentage: number;
  budget: number;
} {
  const budget = PERFORMANCE_BUDGET.bundle[asset];
  const percentage = Math.round((sizeBytes / budget) * 100);
  const withinBudget = sizeBytes <= budget;

  if (!withinBudget) {
    console.warn(
      `[PERF] Bundle asset "${asset}" is ${sizeBytes} bytes (budget: ${budget}bytes, ${percentage}%)`
    );
  }

  return { withinBudget, percentage, budget };
}

export default PERFORMANCE_BUDGET;
