import {
  buildQueryContext,
  ensureIsArray,
  getMetricLabel,
  QueryFormData,
  QueryFormMetric,
  QueryFormOrderBy,
  QueryObject,
} from '@superset-ui/core';
import { contributionOperator } from '@superset-ui/chart-controls';
import { SupersetPluginChartScatterStripQueryFormData } from '../types';

function readPanelQueries(fd: SupersetPluginChartScatterStripQueryFormData) {
  const queries: Array<{
    title: string;
    yColumn?: string;
    metric?: QueryFormMetric;
  }> = [];

  for (let index = 1; index <= 7; index += 1) {
    const title = fd[`query_${index}_title` as const] ?? '';
    const yColumn = fd[`query_${index}_y_column` as const];
    const metric = fd[`query_${index}_metric` as const] as QueryFormMetric | undefined;

    if (!yColumn && !metric) {
      continue;
    }

    queries.push({
      title,
      yColumn,
      metric,
    });
  }

  return queries;
}

export default function buildQuery(formData: QueryFormData) {
  const fd = formData as SupersetPluginChartScatterStripQueryFormData;
  const xAxis = fd.x_axis ?? fd.xColumn ?? fd.x_column;
  const groupby = ensureIsArray(fd.groupby).filter(Boolean) as string[];
  const metrics = ensureIsArray(fd.metrics).filter(Boolean) as QueryFormMetric[];
  const seriesLimitMetric =
    (fd.series_limit_metric ?? fd.timeseries_limit_metric ?? null) as
      | QueryFormMetric
      | null;
  const panelColumn = fd.panel_column ?? fd.panelColumn;
  const xColumn = fd.x_column ?? fd.xColumn ?? xAxis;
  const yColumn = fd.y_column ?? fd.yColumn;
  const labelColumn = fd.label_column ?? fd.labelColumn;
  const legacySeries = fd.series;
  const panelQueries = readPanelQueries(fd);
  const queryMode =
    fd.query_mode ?? (panelQueries.length ? 'panel_queries' : 'split_by_dimension');

  if (queryMode === 'panel_queries' && xAxis && panelQueries.length) {
    return buildQueryContext(formData, (baseQueryObject: QueryObject) =>
      panelQueries.map(panelQuery => {
        const columns = [xAxis]
          .concat(panelQuery.metric ? [] : [panelQuery.yColumn || ''])
          .concat(labelColumn && !panelQuery.metric ? [labelColumn] : [])
          .filter(Boolean) as string[];
        const queryMetrics = panelQuery.metric ? [panelQuery.metric] : [];

        return {
          ...baseQueryObject,
          columns,
          metrics: queryMetrics,
          orderby: xAxis ? ([[xAxis, true]] as QueryFormOrderBy[]) : [],
          row_limit: Number(fd.row_limit || 5000),
          series_columns: [],
          is_timeseries: false,
          post_processing: [],
        };
      }),
    );
  }

  const columns = [xAxis, ...groupby].filter(Boolean) as string[];
  if (!columns.length) {
    columns.push(...([panelColumn, xColumn].filter(Boolean) as string[]));
  }
  if (!metrics.length && yColumn) {
    metrics.push(yColumn);
  }
  if (labelColumn && !columns.includes(labelColumn)) {
    columns.push(labelColumn);
  }
  if (!columns.length && legacySeries) {
    columns.push(legacySeries);
  }

  const sortAscending = !(fd.order_desc ?? true);
  const orderby: QueryFormOrderBy[] = seriesLimitMetric
    ? [[getMetricLabel(seriesLimitMetric as any), sortAscending]]
    : ([
        panelColumn ? [panelColumn, true] : null,
        xColumn ? [xColumn, true] : null,
      ].filter(Boolean) as [string, boolean][]);

  const postProcessing = [contributionOperator(fd as any, {} as QueryObject)].filter(
    Boolean,
  );

  return buildQueryContext(formData, (baseQueryObject: QueryObject) => [
    {
      ...baseQueryObject,
      columns,
      metrics,
      orderby,
      row_limit: Number(fd.row_limit || 5000),
      series_columns: groupby,
      timeseries_limit: Number(fd.series_limit || 0) || undefined,
      timeseries_limit_metric: seriesLimitMetric || undefined,
      is_timeseries: false,
      post_processing: postProcessing as any,
    },
  ]);
}
