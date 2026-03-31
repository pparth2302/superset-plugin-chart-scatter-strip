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
      expressionType?: unknown;
      hasCustomLabel?: unknown;
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

function getFilterColumnRefs(filters: unknown[]) {
  return filters
    .map(filter => {
      if (!filter || typeof filter !== 'object') {
        return undefined;
      }

      const candidate = filter as {
        expressionType?: unknown;
        clause?: unknown;
        subject?: unknown;
      };

      if (candidate.clause && String(candidate.clause).toUpperCase() !== 'WHERE') {
        return undefined;
      }

      if (candidate.expressionType && String(candidate.expressionType).toUpperCase() !== 'SIMPLE') {
        return undefined;
      }

      return candidate.subject;
    })
    .filter(Boolean);
}

function pushUniqueColumns(target: unknown[], candidates: unknown[]) {
  const seen = new Set(target.map(value => getColumnLabel(value) ?? String(value)));

  candidates.forEach(candidate => {
    const key = getColumnLabel(candidate) ?? String(candidate);
    if (!seen.has(key)) {
      seen.add(key);
      target.push(candidate);
    }
  });

  return target;
}

function readPanelQueries(fd: SupersetPluginChartScatterStripQueryFormData) {
  const queries: Array<{
    title: string;
    filters: unknown[];
  }> = [];

  for (let index = 1; index <= 7; index += 1) {
    const title = fd[`query_${index}_title` as const] ?? '';
    const filters = normalizePanelFilters(fd[`query_${index}_filters` as const]);

    if (!filters.length) {
      continue;
    }

    queries.push({
      title,
      filters,
    });
  }

  return queries;
}

export default function buildQuery(formData: QueryFormData) {
  const fd = formData as SupersetPluginChartScatterStripQueryFormData;
  const xAxis = fd.x_axis ?? fd.xColumn ?? fd.x_column;
  const xAxisLabel = getColumnLabel(xAxis);
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
  const panelMetrics = metrics.length
    ? metrics
    : ([yColumn].filter(Boolean) as QueryFormMetric[]);
  const queryMode =
    fd.query_mode ?? (panelQueries.length ? 'panel_queries' : 'split_by_dimension');

  if (queryMode === 'panel_queries' && xAxis && panelQueries.length && panelMetrics.length) {
    const panelFilterColumns = panelQueries.flatMap(panelQuery =>
      getFilterColumnRefs(panelQuery.filters),
    );
    const columns = pushUniqueColumns(
      [xAxis, ...groupby].filter(Boolean),
      [...panelFilterColumns, ...(labelColumn ? [labelColumn] : [])].filter(Boolean),
    ) as any[];
    const postProcessing = [contributionOperator(fd as any, {} as QueryObject)].filter(
      Boolean,
    );

    return buildQueryContext(formData, (baseQueryObject: QueryObject) => [
      {
        ...baseQueryObject,
        columns,
        metrics: panelMetrics,
        orderby: xAxisLabel ? ([[xAxisLabel, true]] as QueryFormOrderBy[]) : [],
        row_limit: Number(fd.row_limit || 5000),
        series_columns: [],
        is_timeseries: false,
        post_processing: postProcessing as any,
      },
    ]);
  }

  const columns = [xAxis, ...groupby].filter(Boolean) as any[];
  if (!columns.length) {
    columns.push(...([panelColumn, xColumn].filter(Boolean) as any[]));
  }
  if (!metrics.length && yColumn) {
    metrics.push(yColumn as QueryFormMetric);
  }
  if (
    labelColumn &&
    !columns.some(column => getColumnLabel(column) === getColumnLabel(labelColumn))
  ) {
    columns.push(labelColumn as any);
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
