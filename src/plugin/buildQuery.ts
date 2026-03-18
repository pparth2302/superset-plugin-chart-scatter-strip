import {
  buildQueryContext,
  QueryFormData,
  QueryObject,
} from '@superset-ui/core';
import { SupersetPluginChartScatterStripQueryFormData } from '../types';

export default function buildQuery(formData: QueryFormData) {
  const fd = formData as SupersetPluginChartScatterStripQueryFormData;
  const panelColumn = fd.panel_column ?? fd.panelColumn;
  const xColumn = fd.x_column ?? fd.xColumn;
  const yColumn = fd.y_column ?? fd.yColumn;
  const labelColumn = fd.label_column ?? fd.labelColumn;
  const legacySeries = fd.series;

  const columns = [panelColumn, xColumn, yColumn].filter(Boolean) as string[];
  if (!columns.length && legacySeries) {
    columns.push(legacySeries);
  }
  if (labelColumn) {
    columns.push(labelColumn);
  }

  const orderby = [
    panelColumn ? [panelColumn, true] : null,
    xColumn ? [xColumn, true] : null,
  ].filter(Boolean) as [string, boolean][];

  return buildQueryContext(formData, (baseQueryObject: QueryObject) => [
    {
      ...baseQueryObject,
      columns,
      metrics: [],
      orderby,
      row_limit: Number(fd.row_limit || 5000),
      is_timeseries: false,
    },
  ]);
}
