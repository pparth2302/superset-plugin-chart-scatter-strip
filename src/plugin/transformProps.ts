import {
  ChartProps,
  ensureIsArray,
  getMetricLabel,
  QueryFormData,
  TimeseriesDataRecord,
} from '@superset-ui/core';
import {
  SupersetPluginChartScatterStripProps,
  SupersetPluginChartScatterStripQueryFormData,
} from '../types';

function getColumnLabel(column: unknown): string | undefined {
  if (!column) {
    return undefined;
  }

  if (typeof column === 'string') {
    return column;
  }

  if (typeof column === 'object') {
    const candidate = column as {
      label?: unknown;
      column_name?: unknown;
      sqlExpression?: unknown;
    };

    if (typeof candidate.label === 'string' && candidate.label) {
      return candidate.label;
    }

    if (typeof candidate.column_name === 'string' && candidate.column_name) {
      return candidate.column_name;
    }

    if (typeof candidate.sqlExpression === 'string' && candidate.sqlExpression) {
      return candidate.sqlExpression;
    }
  }

  return String(column);
}

function normalizePanelFilters(filters: unknown): unknown[] {
  if (!Array.isArray(filters)) {
    return [];
  }

  return filters.filter(Boolean);
}

function parseOptionalNumber(value: string | number | undefined | null) {
  if (value === '' || typeof value === 'undefined') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBounds(
  value: unknown,
  fallbackMin?: string | number,
  fallbackMax?: string | number,
): [number | string | null, number | string | null] {
  const rawBounds = Array.isArray(value) ? value : [fallbackMin, fallbackMax];

  return [0, 1].map(index => {
    const bound = rawBounds[index];
    if (bound === '' || bound === null || typeof bound === 'undefined') {
      return null;
    }

    const numeric = Number(bound);
    return Number.isFinite(numeric) ? numeric : String(bound);
  }) as [number | string | null, number | string | null];
}

function readPanelQueryConfigs(
  fd: SupersetPluginChartScatterStripQueryFormData,
  queriesData: ChartProps['queriesData'],
) {
  const configs = [];
  const sharedMetricLabels = ensureIsArray(fd.metrics)
    .filter(Boolean)
    .map((metric: unknown) => getMetricLabel(metric as any));
  const sharedYField =
    sharedMetricLabels[0] ?? getColumnLabel(fd.yColumn ?? fd.y_column) ?? '';
  const sharedYFieldType = (sharedMetricLabels.length ? 'metric' : 'column') as
    | 'metric'
    | 'column';
  const sharedData = (queriesData[0]?.data || []) as TimeseriesDataRecord[];

  for (let index = 1; index <= 7; index += 1) {
    const title = fd[`query_${index}_title` as const] ?? '';
    const filters = normalizePanelFilters(fd[`query_${index}_filters` as const]);

    if (!filters.length) {
      continue;
    }

    configs.push({
      key: `query_${index}`,
      title: title || `Query ${index}`,
      yField: sharedYField,
      yFieldType: sharedYFieldType,
      filters,
      data: sharedData,
    });
  }

  return configs;
}

export default function transformProps(
  chartProps: ChartProps,
): SupersetPluginChartScatterStripProps {
  const { width, height, queriesData, formData } = chartProps;
  const fd = (((chartProps as unknown as { rawFormData?: QueryFormData }).rawFormData ||
    formData) as unknown) as SupersetPluginChartScatterStripQueryFormData;
  const xAxisColumn = getColumnLabel(
    fd.x_axis ?? fd.xColumn ?? fd.x_column ?? fd.series,
  );
  const groupby = ensureIsArray(fd.groupby).filter(Boolean) as string[];
  const metricLabels = ensureIsArray(fd.metrics)
    .filter(Boolean)
    .map((metric: unknown) => getMetricLabel(metric as any));
  const panelQueries = readPanelQueryConfigs(fd, queriesData);
  const queryMode =
    fd.query_mode ?? (panelQueries.length ? 'panel_queries' : 'split_by_dimension');
  const panelCount = fd.panelCount ?? fd.panel_count;
  const pointSize = fd.pointSize ?? fd.point_size ?? fd.marker_size;
  const xAxisBounds = parseBounds(fd.x_axis_bounds, fd.x_min, fd.x_max);
  const yAxisBounds = parseBounds(fd.y_axis_bounds, fd.y_min, fd.y_max);

  return {
    width,
    height,
    data: (queriesData[0]?.data || []) as TimeseriesDataRecord[],
    chartTitle: fd.chart_title ?? '',
    panelHeaderTitle: fd.panel_header_title ?? fd.panelHeaderTitle ?? '',
    queryMode,
    xAxisColumn,
    metricLabels: metricLabels.length
      ? metricLabels
      : ([fd.yColumn ?? fd.y_column].filter(Boolean) as string[]),
    groupby,
    panelQueries,
    panelColumn: getColumnLabel(fd.panelColumn ?? fd.panel_column),
    xColumn: getColumnLabel(fd.xColumn ?? fd.x_column) ?? xAxisColumn,
    yColumn: getColumnLabel(fd.yColumn ?? fd.y_column),
    labelColumn: getColumnLabel(fd.labelColumn ?? fd.label_column),
    panelCount: Number(panelCount || 7),
    pointSize: Number(pointSize || 6),
    xMin: parseOptionalNumber(fd.xMin ?? fd.x_min),
    xMax: parseOptionalNumber(fd.xMax ?? fd.x_max),
    yMin: parseOptionalNumber(fd.yMin ?? fd.y_min),
    yMax: parseOptionalNumber(fd.yMax ?? fd.y_max),
    specBandMin: parseOptionalNumber(fd.specBandMin ?? fd.spec_band_min),
    specBandMax: parseOptionalNumber(fd.specBandMax ?? fd.spec_band_max),
    xAxisBounds,
    yAxisBounds,
    showSpecBand: fd.showSpecBand ?? fd.show_spec_band ?? true,
    showSpecLabels: fd.showSpecLabels ?? fd.show_spec_labels ?? true,
    specBandColor: fd.specBandColor ?? fd.spec_band_color ?? 'rgba(214, 239, 196, 0.85)',
    specLineColor: fd.specLineColor ?? fd.spec_line_color ?? '#c62828',
    showXAxis: fd.show_x_axis ?? true,
    xAxisTitle: fd.x_axis_title ?? '',
    xAxisTitleMargin: Number(fd.x_axis_title_margin ?? 28),
    xAxisTimeFormat: fd.x_axis_time_format ?? 'smart_date',
    xAxisLabelRotation: Number(fd.x_axis_label_rotation ?? 0),
    xAxisLabelInterval: fd.x_axis_label_interval ?? 'auto',
    showYAxis: fd.show_y_axis ?? true,
    yAxisTitle: fd.y_axis_title ?? '',
    yAxisTitleMargin: Number(fd.y_axis_title_margin ?? 40),
    yAxisTitlePosition: fd.y_axis_title_position ?? 'Left',
    yAxisFormat: fd.y_axis_format ?? 'SMART_NUMBER',
    currencyFormat: fd.currency_format ?? 'number',
    yAxisPrefix: fd.y_axis_prefix ?? '',
    yAxisSuffix: fd.y_axis_suffix ?? '',
    currency: fd.currency ?? '',
    sortSeriesType: fd.sort_series_type ?? 'name',
    sortSeriesAscending: fd.sort_series_ascending ?? true,
    colorScheme: fd.color_scheme ?? 'supersetColors',
    showValue: fd.show_value ?? false,
    stack: fd.stack ?? false,
    area: fd.area ?? false,
    markerEnabled: fd.marker_enabled ?? true,
    zoomable: fd.zoomable ?? false,
    minorTicks: fd.minor_ticks ?? false,
    minorSplitLine: fd.minorSplitLine ?? false,
    showLegend: fd.show_legend ?? false,
    legendType: fd.legend_type ?? 'scroll',
    legendOrientation: fd.legend_orientation ?? 'top',
    legendMargin: Number(fd.legend_margin ?? 0),
    richTooltip: fd.rich_tooltip ?? true,
    showTooltipTotal: fd.show_tooltip_total ?? false,
    showTooltipPercentage: fd.show_tooltip_percentage ?? false,
    tooltipSortByMetric: fd.tooltip_sort_by_metric ?? true,
    tooltipTimeFormat: fd.tooltip_time_format ?? 'smart_date',
    truncateXAxis: fd.truncateXAxis ?? false,
    truncateYAxis: fd.truncateYAxis ?? false,
    logAxis: fd.logAxis ?? false,
    contributionMode: fd.contributionMode,
    showRegressionLine: Boolean(
      fd.showRegressionLine ?? fd.show_regression_line,
    ),
  };
}
