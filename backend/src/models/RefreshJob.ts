/**
 * Refresh Job model.
 */

export type RefreshOutcome = 'success' | 'needs_attention' | 'failed';

export interface RefreshJob {
  id: string;
  product_id: string;
  started_at: Date;
  finished_at?: Date;
  outcome?: RefreshOutcome;
  message?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface CreateRefreshJobParams {
  product_id: string;
}

export interface CompleteRefreshJobParams {
  finished_at: Date;
  outcome: RefreshOutcome;
  message?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export default RefreshJob;
