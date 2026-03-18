import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';
import {
  SupersetPluginChartScatterStripProps,
  SupersetPluginChartScatterStripQueryFormData,
} from '../types';

function parseOptionalNumber(value: string | number | undefined) {
  if (value === '' || typeof value === 'undefined') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function transformProps(
  chartProps: ChartProps,
): SupersetPluginChartScatterStripProps {
  const { width, height, queriesData, formData } = chartProps;
  const fd = formData as SupersetPluginChartScatterStripQueryFormData;
  const panelCount = fd.panelCount ?? fd.panel_count;
  const pointSize = fd.pointSize ?? fd.point_size;

  return {
    width,
    height,
    data: (queriesData[0]?.data || []) as TimeseriesDataRecord[],
    panelColumn: fd.panelColumn ?? fd.panel_column,
    xColumn: fd.xColumn ?? fd.x_column ?? fd.series,
    yColumn: fd.yColumn ?? fd.y_column,
    labelColumn: fd.labelColumn ?? fd.label_column,
    panelCount: Number(panelCount || 7),
    pointSize: Number(pointSize || 10),
    xMin: parseOptionalNumber(fd.xMin ?? fd.x_min),
    xMax: parseOptionalNumber(fd.xMax ?? fd.x_max),
    yMin: parseOptionalNumber(fd.yMin ?? fd.y_min),
    yMax: parseOptionalNumber(fd.yMax ?? fd.y_max),
    showRegressionLine: Boolean(
      fd.showRegressionLine ?? fd.show_regression_line,
    ),
  };
}
