/**
 * KPI Metric model.
 */

export interface KPIMetric {
  id: string;
  product_id: string;
  name: string;
  formula_expression: string;
  version: number;
  created_at: Date;
  deprecated_at?: Date;
}

export interface CreateKPIMetricParams {
  product_id: string;
  name: string;
  formula_expression: string;
  version?: number;
}

export interface UpdateKPIMetricParams {
  name?: string;
  formula_expression?: string;
}

export default KPIMetric;
