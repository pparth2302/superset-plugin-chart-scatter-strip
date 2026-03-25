type ChartPropsConfig = Record<string, any>;

export class ChartProps {
  width: number;

  height: number;

  formData: Record<string, any>;

  queriesData: Record<string, any>[];

  theme: Record<string, any>;

  constructor(config: ChartPropsConfig) {
    Object.assign(this, config);
  }
}

export class ChartMetadata {
  config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
  }
}

export class ChartPlugin {
  config: Record<string, any>;

  constructor(config: Record<string, any>) {
    this.config = config;
  }
}

export const supersetTheme = {};

export const CategoricalColorNamespace = {
  getScale: () => (key: string) => key,
};

export function buildQueryContext(
  formData: Record<string, any>,
  buildFinalQueryObjects?: (baseQueryObject: Record<string, any>) => Record<string, any>[],
) {
  const baseQueryObject = {
    annotation_layers: formData.annotation_layers,
    filters: [],
    granularity: formData.granularity_sqla ?? formData.granularity,
    metrics: formData.metrics,
    time_range: formData.time_range,
  };

  return {
    datasource: { id: 0, type: 'table' },
    force: false,
    form_data: formData,
    queries: buildFinalQueryObjects ? buildFinalQueryObjects(baseQueryObject) : [baseQueryObject],
    result_format: 'json',
    result_type: 'full',
  };
}

export function ensureIsArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function getMetricLabel(metric: any): string {
  if (typeof metric === 'string') {
    return metric;
  }

  return metric?.label ?? metric?.metric_name ?? metric?.sqlExpression ?? '';
}

export function getNumberFormatter() {
  return (value: number) => String(value);
}

export function getTimeFormatter() {
  return (value: number | string) => String(value);
}

export function t(value: string) {
  return value;
}
