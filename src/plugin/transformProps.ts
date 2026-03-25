import {
  ChartProps,
  ensureIsArray,
  getMetricLabel,
  TimeseriesDataRecord,
} from '@superset-ui/core';
import {
  SupersetPluginChartScatterStripProps,
  SupersetPluginChartScatterStripQueryFormData,
} from '../types';

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

export default function transformProps(
  chartProps: ChartProps,
): SupersetPluginChartScatterStripProps {
  const { width, height, queriesData, formData } = chartProps;
  const fd = (((chartProps as unknown as { rawFormData?: QueryFormData }).rawFormData ||
    formData) as unknown) as SupersetPluginChartScatterStripQueryFormData;
  const xAxisColumn = fd.x_axis ?? fd.xColumn ?? fd.x_column ?? fd.series;
  const groupby = ensureIsArray(fd.groupby).filter(Boolean) as string[];
  const metricLabels = ensureIsArray(fd.metrics)
    .filter(Boolean)
    .map(metric => getMetricLabel(metric as any));
  const panelCount = fd.panelCount ?? fd.panel_count;
  const pointSize = fd.pointSize ?? fd.point_size ?? fd.marker_size;
  const xAxisBounds = parseBounds(fd.x_axis_bounds, fd.x_min, fd.x_max);
  const yAxisBounds = parseBounds(fd.y_axis_bounds, fd.y_min, fd.y_max);

  return {
    width,
    height,
    data: (queriesData[0]?.data || []) as TimeseriesDataRecord[],
    chartTitle: fd.chart_title ?? '',
    xAxisColumn,
    metricLabels: metricLabels.length
      ? metricLabels
      : ([fd.yColumn ?? fd.y_column].filter(Boolean) as string[]),
    groupby,
    panelColumn: fd.panelColumn ?? fd.panel_column,
    xColumn: fd.xColumn ?? fd.x_column ?? xAxisColumn,
    yColumn: fd.yColumn ?? fd.y_column,
    labelColumn: fd.labelColumn ?? fd.label_column,
    panelCount: Number(panelCount || 7),
    pointSize: Number(pointSize || 10),
    xMin: parseOptionalNumber(fd.xMin ?? fd.x_min),
    xMax: parseOptionalNumber(fd.xMax ?? fd.x_max),
    yMin: parseOptionalNumber(fd.yMin ?? fd.y_min),
    yMax: parseOptionalNumber(fd.yMax ?? fd.y_max),
    xAxisBounds,
    yAxisBounds,
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
    showLegend: fd.show_legend ?? true,
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
