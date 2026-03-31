import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import {
  CategoricalColorNamespace,
  getNumberFormatter,
  getTimeFormatter,
} from '@superset-ui/core';
import { SupersetPluginChartScatterStripProps } from './types';

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function isTemporalValue(value: unknown) {
  if (value instanceof Date) {
    return true;
  }

  if (typeof value !== 'string') {
    return false;
  }

  return !Number.isNaN(Date.parse(value));
}

function detectAxisType(values: unknown[]) {
  const firstMeaningful = values.find(
    value => value !== null && typeof value !== 'undefined' && value !== '',
  );

  if (typeof firstMeaningful === 'number') {
    return 'value';
  }

  if (isTemporalValue(firstMeaningful)) {
    return 'time';
  }

  return 'category';
}

function asAxisValue(value: unknown, axisType: string) {
  if (axisType === 'value') {
    return toNum(value);
  }

  if (axisType === 'time') {
    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'number') {
      return value;
    }

    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? null : parsed;
  }

  return value == null ? null : String(value);
}

function compareAxisValues(left: unknown, right: unknown, axisType: string) {
  if (axisType === 'category') {
    return String(left).localeCompare(String(right));
  }

  return Number(left) - Number(right);
}

function parseAxisBound(value: number | string | null, axisType: string) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return undefined;
  }

  if (axisType === 'time' && typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return value;
}

function formatSortValue(values: number[], mode: string) {
  if (!values.length) {
    return 0;
  }

  switch (mode) {
    case 'avg':
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'sum':
      return values.reduce((sum, value) => sum + value, 0);
    case 'name':
    default:
      return values.reduce((sum, value) => sum + value, 0);
  }
}

function buildValueFormatter(
  numberFormat: string,
  currencyFormat: string,
  currency: string,
  prefix: string,
  suffix: string,
) {
  const formatter = getNumberFormatter(numberFormat || 'SMART_NUMBER');

  return (value: number) => {
    const formatted = formatter(value);

    if (currencyFormat === 'currency' && currency) {
      return `${currency}${formatted}`;
    }

    if (currencyFormat === 'prefix' && prefix) {
      return `${prefix}${formatted}${suffix}`;
    }

    return `${formatted}${suffix || ''}`;
  };
}

function linearRegression(points: [number, number][]) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;

  return { m, b };
}

function titleCase(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatSpecLabel(value: number) {
  return value.toFixed(3);
}

function normalizeComparatorValues(comparator: unknown): unknown[] {
  if (Array.isArray(comparator)) {
    return comparator;
  }

  if (typeof comparator === 'string' && comparator.includes(',')) {
    return comparator
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }

  return typeof comparator === 'undefined' ? [] : [comparator];
}

function normalizeComparable(value: unknown) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && String(value).trim() !== '') {
    return numeric;
  }

  const dateValue = Date.parse(String(value));
  if (!Number.isNaN(dateValue) && typeof value === 'string') {
    return dateValue;
  }

  return String(value).toLowerCase();
}

function matchesComparator(rowValue: unknown, comparator: unknown) {
  const left = normalizeComparable(rowValue);
  const right = normalizeComparable(comparator);

  if (left === null || right === null) {
    return left === right;
  }

  return left === right;
}

function matchesLike(rowValue: unknown, comparator: unknown, caseInsensitive: boolean) {
  if (rowValue == null || comparator == null) {
    return false;
  }

  const value = String(rowValue);
  const pattern = String(comparator)
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  const flags = caseInsensitive ? 'i' : '';

  return new RegExp(`^${pattern}$`, flags).test(value);
}

function parseSimpleSqlFilter(sqlExpression: string) {
  const match = sqlExpression.match(
    /^\s*["`\[]?([^"`\]\s]+(?:\s+[^=<>!]+?)?)["`\]]?\s*(=|!=|<>|>=|<=|>|<)\s*('?)(.*?)\3\s*$/,
  );

  if (!match) {
    return null;
  }

  return {
    subject: match[1].trim(),
    operator: match[2],
    comparator: match[4],
  };
}

function matchesSimpleFilter(row: Record<string, any>, filter: Record<string, any>) {
  const subject = filter.subject == null ? '' : String(filter.subject);
  const operator = String(filter.operator || '==').toUpperCase();
  const comparator = filter.comparator;
  const rowValue = row[subject];

  switch (operator) {
    case '==':
    case '=':
      return matchesComparator(rowValue, comparator);
    case '!=':
    case '<>':
      return !matchesComparator(rowValue, comparator);
    case '>':
      return Number(rowValue) > Number(comparator);
    case '<':
      return Number(rowValue) < Number(comparator);
    case '>=':
      return Number(rowValue) >= Number(comparator);
    case '<=':
      return Number(rowValue) <= Number(comparator);
    case 'IN':
      return normalizeComparatorValues(comparator).some(value =>
        matchesComparator(rowValue, value),
      );
    case 'NOT IN':
      return !normalizeComparatorValues(comparator).some(value =>
        matchesComparator(rowValue, value),
      );
    case 'LIKE':
      return matchesLike(rowValue, comparator, false);
    case 'ILIKE':
      return matchesLike(rowValue, comparator, true);
    case 'IS NULL':
      return rowValue == null;
    case 'IS NOT NULL':
      return rowValue != null;
    default:
      return true;
  }
}

function matchesPanelFilter(row: Record<string, any>, filter: unknown) {
  if (!filter || typeof filter !== 'object') {
    return true;
  }

  const candidate = filter as Record<string, any>;
  if (candidate.clause && String(candidate.clause).toUpperCase() !== 'WHERE') {
    return true;
  }

  if (String(candidate.expressionType || 'SIMPLE').toUpperCase() === 'SQL') {
    if (typeof candidate.sqlExpression !== 'string' || !candidate.sqlExpression.trim()) {
      return true;
    }

    const parsed = parseSimpleSqlFilter(candidate.sqlExpression);
    return parsed ? matchesSimpleFilter(row, parsed) : true;
  }

  return matchesSimpleFilter(row, candidate);
}

function matchesAllPanelFilters(row: Record<string, any>, filters: unknown[]) {
  return filters.every(filter => matchesPanelFilter(row, filter));
}

export default function ScatterStripChart({
  width,
  height,
  data,
  chartTitle,
  panelHeaderTitle,
  queryMode,
  xAxisColumn,
  metricLabels,
  groupby,
  panelQueries,
  panelColumn,
  xColumn,
  yColumn,
  labelColumn,
  panelCount,
  pointSize,
  xMin,
  xMax,
  yMin,
  yMax,
  specBandMin,
  specBandMax,
  xAxisBounds,
  yAxisBounds,
  showSpecBand,
  showSpecLabels,
  specBandColor,
  specLineColor,
  showXAxis,
  xAxisTitle,
  xAxisTitleMargin,
  xAxisTimeFormat,
  xAxisLabelRotation,
  xAxisLabelInterval,
  showYAxis,
  yAxisTitle,
  yAxisTitleMargin,
  yAxisTitlePosition,
  yAxisFormat,
  currencyFormat,
  yAxisPrefix,
  yAxisSuffix,
  currency,
  sortSeriesType,
  sortSeriesAscending,
  colorScheme,
  showValue,
  stack,
  area,
  markerEnabled,
  zoomable,
  minorTicks,
  minorSplitLine,
  showLegend,
  legendType,
  legendOrientation,
  legendMargin,
  richTooltip,
  showTooltipTotal,
  showTooltipPercentage,
  tooltipSortByMetric,
  tooltipTimeFormat,
  truncateXAxis,
  truncateYAxis,
  logAxis,
  contributionMode,
  showRegressionLine,
}: SupersetPluginChartScatterStripProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const option = useMemo(() => {
    const resolvedXAxis = xAxisColumn || xColumn;
    const isPanelQueriesMode = queryMode === 'panel_queries' && panelQueries.length > 0;
    const resolvedMetrics = isPanelQueriesMode
      ? panelQueries.map(panelQuery => panelQuery.yField)
      : metricLabels.length
        ? metricLabels
        : ([yColumn].filter(Boolean) as string[]);
    const panelDimension = panelColumn || groupby[0];
    const nonPanelDimensions = groupby.filter(column => column && column !== panelDimension);
    const colorDimension =
      !isPanelQueriesMode && resolvedMetrics.length === 1 ? nonPanelDimensions[0] : undefined;
    const tooltipDimensions = isPanelQueriesMode
      ? []
      : nonPanelDimensions.filter(column => column !== colorDimension);

    if (!resolvedXAxis || (!resolvedMetrics.length && !isPanelQueriesMode)) {
      return {
        animation: false,
        tooltip: { trigger: 'item' },
        grid: [],
        xAxis: [],
        yAxis: [],
        series: [],
        graphic: [],
      };
    }

    const sourceData = isPanelQueriesMode ? data : data;
    const axisType = detectAxisType(sourceData.map(row => row[resolvedXAxis]));
    const xFormatter =
      axisType === 'time'
        ? getTimeFormatter(tooltipTimeFormat || xAxisTimeFormat || 'smart_date')
        : null;
    const xAxisFormatter =
      axisType === 'time'
        ? getTimeFormatter(xAxisTimeFormat || 'smart_date')
        : null;
    const yFormatter = buildValueFormatter(
      yAxisFormat,
      currencyFormat,
      currency,
      yAxisPrefix,
      yAxisSuffix,
    );
    const colorScale = CategoricalColorNamespace.getScale(
      colorScheme || 'supersetColors',
    );
    const grouped = new Map<string, Record<string, any>[]>();
    let panelDefinitions: Array<{
      panelKey: string;
      rows: Record<string, any>[];
      yField: string;
    }> = [];

    if (isPanelQueriesMode) {
      panelDefinitions = panelQueries
        .slice(0, panelCount || panelQueries.length || 1)
        .map(panelQuery => ({
          panelKey: panelQuery.title,
          rows: (panelQuery.data as Record<string, any>[]).filter(row =>
            matchesAllPanelFilters(row, panelQuery.filters),
          ),
          yField: panelQuery.yField,
        }));
    } else {
      for (const row of data) {
        const panel = panelDimension ? String(row[panelDimension]) : 'All';
        if (!grouped.has(panel)) grouped.set(panel, []);
        grouped.get(panel)!.push(row);
      }

      panelDefinitions = Array.from(grouped.keys())
        .sort((a, b) => {
          const na = Number(a);
          const nb = Number(b);
          if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
          return a.localeCompare(b);
        })
        .slice(0, panelCount || grouped.size || 1)
        .map(panelKey => ({
          panelKey,
          rows: grouped.get(panelKey) || [],
          yField: resolvedMetrics[0] || '',
        }));
    }

    const panelTotal = Math.max(panelDefinitions.length, 1);
    const gapPct = 0;
    const frameLeftPct = 1;
    const frameRightPct = 1;
    const plotLeftPct = showYAxis ? 6.5 : 2;
    const plotRightPct = 1.5;
    const legendTopOffset =
      showLegend && legendOrientation === 'top' ? 7 + legendMargin : 0;
    const titleOffset = chartTitle ? 7 : 0;
    const frameTopPct = 5 + titleOffset + legendTopOffset;
    const headerHeightPct = 6;
    const plotTopPct = frameTopPct + headerHeightPct;
    const frameBottomPct = showXAxis ? 8.5 : 3.5;
    const plotBottomPct = showXAxis ? 8 : 1.5;
    const plotHeightPct = Math.max(28, 100 - plotTopPct - plotBottomPct);
    const usablePct =
      100 - plotLeftPct - plotRightPct - gapPct * (panelTotal - 1);
    const panelWidthPct = usablePct / panelTotal;
    const toPixelX = (pct: number) => (width * pct) / 100;
    const toPixelY = (pct: number) => (height * pct) / 100;
    const dividerColor = '#b9b9b9';
    const splitLineColor = '#e0e0e0';
    const frameStrokeColor = '#a8a8a8';
    const frameFill = '#ffffff';

    const metricOrder = [...resolvedMetrics].sort((leftMetric, rightMetric) => {
      if (sortSeriesType === 'name') {
        return sortSeriesAscending
          ? leftMetric.localeCompare(rightMetric)
          : rightMetric.localeCompare(leftMetric);
      }

      const leftValues = sourceData
        .map(row => toNum(row[leftMetric]))
        .filter((value): value is number => value !== null);
      const rightValues = sourceData
        .map(row => toNum(row[rightMetric]))
        .filter((value): value is number => value !== null);
      const leftValue = formatSortValue(leftValues, sortSeriesType);
      const rightValue = formatSortValue(rightValues, sortSeriesType);
      const direction = sortSeriesAscending ? 1 : -1;

      return (leftValue - rightValue) * direction;
    });

    const colorSeriesOrder = !isPanelQueriesMode && colorDimension
      ? Array.from(
          new Set(
            sourceData
              .map(row => row[colorDimension])
              .filter(value => value !== null && typeof value !== 'undefined' && value !== ''),
          ),
        )
          .map(value => String(value))
          .sort((leftValue, rightValue) => {
            if (sortSeriesType === 'name') {
              return sortSeriesAscending
                ? leftValue.localeCompare(rightValue)
                : rightValue.localeCompare(leftValue);
            }

            const leftValues = sourceData
              .filter(row => String(row[colorDimension]) === leftValue)
              .map(row => toNum(row[resolvedMetrics[0]]))
              .filter((value): value is number => value !== null);
            const rightValues = sourceData
              .filter(row => String(row[colorDimension]) === rightValue)
              .map(row => toNum(row[resolvedMetrics[0]]))
              .filter((value): value is number => value !== null);
            const leftMetricValue = formatSortValue(leftValues, sortSeriesType);
            const rightMetricValue = formatSortValue(rightValues, sortSeriesType);
            const direction = sortSeriesAscending ? 1 : -1;

            return (leftMetricValue - rightMetricValue) * direction;
          })
      : [];

    const legendData = isPanelQueriesMode
      ? panelDefinitions.map(panel => panel.panelKey)
      : colorDimension
        ? colorSeriesOrder
        : metricOrder;

    const allMetricValues = isPanelQueriesMode
      ? panelDefinitions.flatMap(panel =>
          panel.rows
            .map(row => toNum(row[panel.yField]))
            .filter((value): value is number => value !== null),
        )
      : sourceData.flatMap(row =>
          resolvedMetrics
            .map(metric => toNum(row[metric]))
            .filter((value): value is number => value !== null),
        );
    const fallbackMin = allMetricValues.length ? Math.min(...allMetricValues) : 0;
    const fallbackMax = allMetricValues.length ? Math.max(...allMetricValues) : 1;
    const axisMinCandidate =
      (parseAxisBound(yAxisBounds[0], 'value') as number | undefined) ??
      yMin ??
      fallbackMin;
    const axisMaxCandidate =
      (parseAxisBound(yAxisBounds[1], 'value') as number | undefined) ??
      yMax ??
      fallbackMax;
    const axisMinValue =
      axisMinCandidate === axisMaxCandidate ? axisMinCandidate - 1 : axisMinCandidate;
    const axisMaxValue =
      axisMinCandidate === axisMaxCandidate ? axisMaxCandidate + 1 : axisMaxCandidate;
    const hasSpecBounds = specBandMin !== null && specBandMax !== null;
    const normalizedSpecBounds = hasSpecBounds
      ? [Math.min(specBandMin, specBandMax), Math.max(specBandMin, specBandMax)]
      : null;

    const projectYToPixel = (value: number) => {
      const minValue = logAxis ? Math.log10(Math.max(axisMinValue, Number.EPSILON)) : axisMinValue;
      const maxValue = logAxis ? Math.log10(Math.max(axisMaxValue, Number.EPSILON)) : axisMaxValue;
      const projectedValue = logAxis
        ? Math.log10(Math.max(value, Number.EPSILON))
        : value;
      const span = maxValue - minValue || 1;
      const offset = (maxValue - projectedValue) / span;
      return toPixelY(
        clamp(
          plotTopPct + offset * plotHeightPct,
          plotTopPct,
          plotTopPct + plotHeightPct,
        ),
      );
    };

    const grid = panelDefinitions.map((_, index) => ({
      left: `${plotLeftPct + index * (panelWidthPct + gapPct)}%`,
      top: `${plotTopPct}%`,
      width: `${panelWidthPct}%`,
      height: `${plotHeightPct}%`,
      containLabel: false,
    }));

    const xAxis = panelDefinitions.map((_, index) => ({
      type: axisType,
      gridIndex: index,
      min:
        parseAxisBound(xAxisBounds[0], axisType) ??
        parseAxisBound(xMin, axisType) ??
        (truncateXAxis ? 'dataMin' : undefined),
      max:
        parseAxisBound(xAxisBounds[1], axisType) ??
        parseAxisBound(xMax, axisType) ??
        (truncateXAxis ? 'dataMax' : undefined),
      show: showXAxis,
      boundaryGap: axisType === 'category',
      minorTick: { show: minorTicks },
      axisLine: {
        show: showXAxis,
        lineStyle: {
          color: dividerColor,
        },
      },
      axisTick: {
        show: showXAxis,
      },
      axisLabel: {
        show: showXAxis,
        color: '#262626',
        margin: 12,
        rotate: xAxisLabelRotation,
        interval:
          xAxisLabelInterval === 'auto' ? 'auto' : Number(xAxisLabelInterval),
        formatter: (value: unknown) => {
          if (axisType === 'time' && xAxisFormatter) {
            return xAxisFormatter(value as any);
          }

          return String(value ?? '');
        },
      },
      splitLine: {
        show: false,
      },
    }));

    const yAxis = panelDefinitions.map((_, index) => ({
      type: logAxis ? 'log' : 'value',
      gridIndex: index,
      min:
        parseAxisBound(yAxisBounds[0], 'value') ??
        yMin ??
        (truncateYAxis ? 'dataMin' : undefined),
      max:
        parseAxisBound(yAxisBounds[1], 'value') ??
        yMax ??
        (truncateYAxis ? 'dataMax' : undefined),
      name:
        index === 0 && showYAxis
          ? String(yAxisTitle || (isPanelQueriesMode ? 'Value' : resolvedMetrics.join(', ')))
          : '',
      nameLocation: 'middle',
      nameGap: yAxisTitleMargin,
      position: yAxisTitlePosition === 'Right' ? 'right' : 'left',
      minorTick: { show: index === 0 && minorTicks },
      minorSplitLine: {
        show: minorSplitLine,
        lineStyle: {
          color: '#f0f0f0',
        },
      },
      axisLine: {
        show: index === 0 && showYAxis,
        lineStyle: {
          color: dividerColor,
        },
      },
      axisTick: {
        show: index === 0 && showYAxis,
      },
      axisLabel: {
        show: index === 0 && showYAxis,
        color: '#262626',
        formatter: (value: number) => yFormatter(value),
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: splitLineColor,
          type: 'solid',
        },
      },
      scale: truncateYAxis,
    }));

    const series: any[] = [];

    panelDefinitions.forEach(({ panelKey, rows, yField }, index) => {
      let decoratedPanel = false;

      const seriesDefinitions = isPanelQueriesMode
        ? [
            {
              seriesName: panelKey,
              metricLabel: yField,
              rows,
              colorKey: panelKey,
            },
          ]
        : colorDimension
          ? colorSeriesOrder.map(seriesName => ({
              seriesName,
              metricLabel: resolvedMetrics[0],
              rows: rows.filter(row => String(row[colorDimension]) === seriesName),
              colorKey: seriesName,
            }))
          : metricOrder.map(metricLabel => ({
              seriesName: metricLabel,
              metricLabel,
              rows,
              colorKey: metricLabel,
            }));

      seriesDefinitions.forEach(({ seriesName, metricLabel, rows: seriesRows, colorKey }) => {
        const points = seriesRows
          .map(row => {
            const rawX = asAxisValue(row[resolvedXAxis], axisType);
            const rawY = toNum(row[metricLabel]);

            if (rawX === null || rawY === null) {
              return null;
            }

            const tooltipValues = tooltipDimensions
              .map(column => `${column}: ${row[column] ?? ''}`)
              .filter(Boolean);

            if (!isPanelQueriesMode && colorDimension && row[colorDimension] != null) {
              tooltipValues.unshift(`${colorDimension}: ${row[colorDimension]}`);
            }

            if (labelColumn && row[labelColumn] != null) {
              tooltipValues.unshift(`${labelColumn}: ${row[labelColumn]}`);
            }

            return {
              value: [rawX, rawY],
              meta: {
                metricLabel,
                panelKey,
                tooltipValues,
              },
            };
          })
          .filter(Boolean)
          .sort((left: any, right: any) =>
            compareAxisValues(left.value[0], right.value[0], axisType),
          );

        if (!points.length) {
          return;
        }

        const isLineMode = area || stack;
        const color = colorScale(colorKey);

        series.push({
          name: seriesName,
          type: isLineMode ? 'line' : 'scatter',
          xAxisIndex: index,
          yAxisIndex: index,
          stack: stack ? 'stack' : undefined,
          smooth: area,
          showSymbol: markerEnabled || !isLineMode,
          symbolSize: pointSize,
          itemStyle: {
            color,
            opacity: isLineMode ? 1 : 0.9,
          },
          lineStyle: {
            color,
            width: isLineMode ? 2 : 1,
          },
          areaStyle: area
            ? {
                opacity: 0.18,
              }
            : undefined,
          label: showValue
            ? {
                show: true,
                formatter: (params: any) => yFormatter(params.value[1]),
                position: 'top',
              }
            : undefined,
          markArea:
            !decoratedPanel && normalizedSpecBounds && showSpecBand
              ? {
                  silent: true,
                  itemStyle: {
                    color: specBandColor,
                  },
                  data: [
                    [
                      { yAxis: normalizedSpecBounds[0] },
                      { yAxis: normalizedSpecBounds[1] },
                    ],
                  ],
                }
              : undefined,
          markLine:
            !decoratedPanel && normalizedSpecBounds
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: {
                    color: specLineColor,
                    width: 1.5,
                  },
                  label: {
                    show: false,
                  },
                  data: normalizedSpecBounds.map(bound => ({ yAxis: bound })),
                }
              : undefined,
          data: points,
        });

        decoratedPanel = decoratedPanel || Boolean(normalizedSpecBounds);

        if (showRegressionLine) {
          const numericPoints = points
            .map((entry: any) => [entry.value[0], entry.value[1]] as [number, number])
            .filter(
              ([x, y]) => typeof x === 'number' && typeof y === 'number',
            );
          const regression = linearRegression(numericPoints);

          if (regression && numericPoints.length) {
            const xs = numericPoints.map(point => point[0]);
            const minLineX = Math.min(...xs);
            const maxLineX = Math.max(...xs);

            series.push({
              name: `${seriesName} regression`,
              type: 'line',
              xAxisIndex: index,
              yAxisIndex: index,
              symbol: 'none',
              silent: true,
              lineStyle: {
                color,
                type: 'dashed',
                width: 1.5,
              },
              data: [
                [minLineX, regression.m * minLineX + regression.b],
                [maxLineX, regression.m * maxLineX + regression.b],
              ],
            });
          }
        }
      });
    });

    const headerLabel =
      panelHeaderTitle ||
      titleCase(isPanelQueriesMode ? 'nest or pallet #' : panelDimension || 'Panels');

    const graphics: any[] = [
      {
        type: 'rect',
        z: -20,
        shape: {
          x: toPixelX(frameLeftPct),
          y: toPixelY(frameTopPct),
          width: toPixelX(100 - frameLeftPct - frameRightPct),
          height: toPixelY(100 - frameTopPct - frameBottomPct),
        },
        style: {
          fill: frameFill,
          stroke: frameStrokeColor,
          lineWidth: 1,
        },
        silent: true,
      },
      {
        type: 'line',
        z: 15,
        shape: {
          x1: toPixelX(plotLeftPct),
          y1: toPixelY(plotTopPct),
          x2: toPixelX(100 - plotRightPct),
          y2: toPixelY(plotTopPct),
        },
        style: {
          stroke: dividerColor,
          lineWidth: 1,
        },
        silent: true,
      },
    ];

    if (headerLabel) {
      graphics.push({
        type: 'text',
        z: 20,
        left: width / 2,
        top: toPixelY(frameTopPct + 0.8),
        style: {
          text: headerLabel,
          textAlign: 'center',
          fill: '#222222',
          fontSize: 14,
          fontWeight: 500,
        },
        silent: true,
      });
    }

    panelDefinitions.forEach(({ panelKey }, index) => {
      graphics.push({
        type: 'text',
        z: 20,
        left: toPixelX(
          plotLeftPct + index * (panelWidthPct + gapPct) + panelWidthPct / 2,
        ),
        top: toPixelY(frameTopPct + (headerLabel ? 3.1 : 2.2)),
        style: {
          text: panelKey,
          textAlign: 'center',
          fill: '#1f1f1f',
          fontSize: 14,
          fontWeight: 500,
        },
        silent: true,
      });
    });

    for (let index = 1; index < panelTotal; index += 1) {
      const xPct = plotLeftPct + index * (panelWidthPct + gapPct);
      graphics.push({
        type: 'line',
        z: 15,
        shape: {
          x1: toPixelX(xPct),
          y1: toPixelY(frameTopPct),
          x2: toPixelX(xPct),
          y2: toPixelY(100 - frameBottomPct),
        },
        style: {
          stroke: dividerColor,
          lineWidth: 1,
        },
        silent: true,
      });
    }

    if (normalizedSpecBounds && showSpecLabels) {
      normalizedSpecBounds.forEach(bound => {
        graphics.push({
          type: 'text',
          z: 18,
          left: toPixelX(frameLeftPct + 0.25),
          top: projectYToPixel(bound) - 10,
          style: {
            text: formatSpecLabel(bound),
            fill: '#303030',
            fontSize: 12,
            backgroundColor: '#ffffff',
          },
          silent: true,
        });
      });
    }

    if (showXAxis && (xAxisTitle || resolvedXAxis)) {
      graphics.push({
        type: 'text',
        z: 20,
        left: width / 2,
        top: toPixelY(100 - 2.5),
        style: {
          text: String(xAxisTitle || resolvedXAxis),
          textAlign: 'center',
          fill: '#222222',
          fontSize: 13,
          fontWeight: 500,
        },
        silent: true,
      });
    }

    const legendPositions: Record<string, any> = {
      top: {
        top: chartTitle ? 28 + legendMargin : 6 + legendMargin,
        orient: 'horizontal',
      },
      bottom: { bottom: 4 + legendMargin, orient: 'horizontal' },
      left: { left: 4 + legendMargin, top: 'middle', orient: 'vertical' },
      right: { right: 4 + legendMargin, top: 'middle', orient: 'vertical' },
    };

    const tooltipFormatter = (params: any) => {
      const items = Array.isArray(params) ? [...params] : [params];
      if (tooltipSortByMetric) {
        items.sort(
          (left, right) =>
            Number(right.value?.[1] || 0) - Number(left.value?.[1] || 0),
        );
      }

      const first = items[0];
      const rawX = first?.value?.[0];
      const titleValue =
        axisType === 'time' && xFormatter ? xFormatter(rawX as any) : String(rawX ?? '');
      const total = items.reduce(
        (sum, item) => sum + Number(item.value?.[1] || 0),
        0,
      );
      const rows = items.map(item => {
        const value = Number(item.value?.[1] || 0);
        const meta = item.data?.meta;
        const percentage = total
          ? ` (${((value / total) * 100).toFixed(1)}%)`
          : '';
        const extra = meta?.tooltipValues?.length
          ? `<br/>${meta.tooltipValues.join('<br/>')}`
          : '';

        return `${item.marker}${item.seriesName}: ${yFormatter(value)}${showTooltipPercentage ? percentage : ''}${extra}`;
      });

      if (showTooltipTotal) {
        rows.push(`<strong>Total: ${yFormatter(total)}</strong>`);
      }

      return `${first?.data?.meta?.panelKey || ''}<br/>${titleValue}<br/>${rows.join('<br/>')}`;
    };

    return {
      animation: false,
      backgroundColor: 'transparent',
      title: chartTitle
        ? {
            text: chartTitle,
            left: 'center',
            top: 0,
          }
        : undefined,
      tooltip: {
        trigger: richTooltip ? 'axis' : 'item',
        axisPointer: richTooltip
          ? {
              type: 'line',
              lineStyle: {
                color: '#999999',
                type: 'dashed',
              },
            }
          : undefined,
        formatter: tooltipFormatter,
      },
      legend: {
        type: legendType,
        show: showLegend,
        data: legendData,
        ...legendPositions[legendOrientation],
      },
      grid,
      xAxis,
      yAxis,
      series,
      graphic: graphics,
      dataZoom: zoomable
        ? [
            {
              type: 'slider',
              xAxisIndex: panelDefinitions.map((_, index) => index),
            },
            {
              type: 'inside',
              xAxisIndex: panelDefinitions.map((_, index) => index),
            },
          ]
        : undefined,
    };
  }, [
    area,
    chartTitle,
    colorScheme,
    contributionMode,
    data,
    currency,
    currencyFormat,
    groupby,
    labelColumn,
    legendMargin,
    legendOrientation,
    legendType,
    logAxis,
    markerEnabled,
    metricLabels,
    minorSplitLine,
    minorTicks,
    panelColumn,
    panelCount,
    panelHeaderTitle,
    panelQueries,
    pointSize,
    queryMode,
    richTooltip,
    showLegend,
    showRegressionLine,
    showSpecBand,
    showSpecLabels,
    showTooltipPercentage,
    showTooltipTotal,
    showValue,
    showXAxis,
    showYAxis,
    sortSeriesAscending,
    sortSeriesType,
    specBandColor,
    specBandMax,
    specBandMin,
    specLineColor,
    stack,
    tooltipSortByMetric,
    tooltipTimeFormat,
    truncateXAxis,
    truncateYAxis,
    xAxisBounds,
    xAxisColumn,
    xAxisLabelInterval,
    xAxisLabelRotation,
    xAxisTimeFormat,
    xAxisTitle,
    xAxisTitleMargin,
    xColumn,
    xMax,
    xMin,
    yAxisBounds,
    yAxisFormat,
    yAxisPrefix,
    yAxisSuffix,
    yAxisTitle,
    yAxisTitleMargin,
    yAxisTitlePosition,
    yColumn,
    yMax,
    yMin,
    width,
    height,
    zoomable,
  ]);

  useEffect(() => {
    if (!elRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(elRef.current);
    }

    chartRef.current.setOption(option, true);
    chartRef.current.resize({ width, height });

    const handleResize = () => {
      chartRef.current?.resize({ width, height });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [option, width, height]);

  useEffect(() => {
    return () => {
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  return <div ref={elRef} style={{ width, height }} />;
}
