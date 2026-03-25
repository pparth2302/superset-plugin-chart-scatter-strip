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

export default function ScatterStripChart({
  width,
  height,
  data,
  chartTitle,
  xAxisColumn,
  metricLabels,
  groupby,
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
  xAxisBounds,
  yAxisBounds,
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
    const resolvedMetrics = metricLabels.length
      ? metricLabels
      : ([yColumn].filter(Boolean) as string[]);
    const panelDimension = panelColumn || groupby[0];
    const tooltipDimensions = groupby.slice(panelDimension ? 1 : 0);

    if (!resolvedXAxis || !resolvedMetrics.length) {
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

    const axisType = detectAxisType(data.map(row => row[resolvedXAxis]));
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

    for (const row of data) {
      const panel = panelDimension ? String(row[panelDimension]) : 'All';
      if (!grouped.has(panel)) grouped.set(panel, []);
      grouped.get(panel)!.push(row);
    }

    const panelKeys = Array.from(grouped.keys())
      .sort((a, b) => {
        const na = Number(a);
        const nb = Number(b);
        if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
        return a.localeCompare(b);
      })
      .slice(0, panelCount || grouped.size || 1);

    const gapPct = 1;
    const leftPct = 4;
    const rightPct = 2;
    const panelTotal = Math.max(panelKeys.length, 1);
    const usablePct = 100 - leftPct - rightPct - gapPct * (panelTotal - 1);
    const panelWidthPct = usablePct / panelTotal;

    const metricOrder = [...resolvedMetrics].sort((leftMetric, rightMetric) => {
      if (sortSeriesType === 'name') {
        return sortSeriesAscending
          ? leftMetric.localeCompare(rightMetric)
          : rightMetric.localeCompare(leftMetric);
      }

      const leftValues = data
        .map(row => toNum(row[leftMetric]))
        .filter((value): value is number => value !== null);
      const rightValues = data
        .map(row => toNum(row[rightMetric]))
        .filter((value): value is number => value !== null);
      const leftValue = formatSortValue(leftValues, sortSeriesType);
      const rightValue = formatSortValue(rightValues, sortSeriesType);
      const direction = sortSeriesAscending ? 1 : -1;

      return (leftValue - rightValue) * direction;
    });

    const grid = panelKeys.map((_, i) => ({
      left: `${leftPct + i * (panelWidthPct + gapPct)}%`,
      top: showLegend && legendOrientation === 'top' ? '18%' : '12%',
      width: `${panelWidthPct}%`,
      height: chartTitle ? '66%' : '72%',
      containLabel: true,
    }));

    const xAxis = panelKeys.map((_, i) => ({
      type: axisType,
      gridIndex: i,
      min:
        parseAxisBound(xAxisBounds[0], axisType) ??
        parseAxisBound(xMin, axisType) ??
        (truncateXAxis ? 'dataMin' : undefined),
      max:
        parseAxisBound(xAxisBounds[1], axisType) ??
        parseAxisBound(xMax, axisType) ??
        (truncateXAxis ? 'dataMax' : undefined),
      name: i === 0 ? String(xAxisTitle || resolvedXAxis) : '',
      nameLocation: 'middle',
      nameGap: xAxisTitleMargin,
      show: showXAxis,
      minorTick: { show: minorTicks },
      axisLabel: {
        rotate: xAxisLabelRotation,
        interval: xAxisLabelInterval === 'auto' ? 'auto' : Number(xAxisLabelInterval),
        formatter: (value: unknown) => {
          if (axisType === 'time' && xAxisFormatter) {
            return xAxisFormatter(value as any);
          }

          return String(value ?? '');
        },
      },
    }));

    const yAxis = panelKeys.map((_, i) => ({
      type: logAxis ? 'log' : 'value',
      gridIndex: i,
      min: parseAxisBound(yAxisBounds[0], 'value') ?? yMin ?? (truncateYAxis ? 'dataMin' : undefined),
      max: parseAxisBound(yAxisBounds[1], 'value') ?? yMax ?? (truncateYAxis ? 'dataMax' : undefined),
      name: i === 0 ? String(yAxisTitle || resolvedMetrics.join(', ')) : '',
      nameLocation: 'middle',
      nameGap: yAxisTitleMargin,
      position: yAxisTitlePosition === 'Right' ? 'right' : 'left',
      show: showYAxis,
      minorTick: { show: minorTicks },
      minorSplitLine: { show: minorSplitLine },
      axisLabel: {
        formatter: (value: number) => yFormatter(value),
      },
      splitLine: { show: true },
      scale: truncateYAxis,
    }));

    const series: any[] = [];

    panelKeys.forEach((panelKey, i) => {
      const rows = grouped.get(panelKey) || [];

      metricOrder.forEach(metricLabel => {
        const pts = rows
          .map(row => {
            const rawX = asAxisValue(row[resolvedXAxis], axisType);
            const rawY = toNum(row[metricLabel]);

            if (rawX === null || rawY === null) {
              return null;
            }

            const tooltipValues = tooltipDimensions
              .map(column => `${column}: ${row[column] ?? ''}`)
              .filter(Boolean);
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

        if (!pts.length) {
          return;
        }

        const isLineMode = area || stack;
        series.push({
          name: metricLabel,
          type: isLineMode ? 'line' : 'scatter',
          xAxisIndex: i,
          yAxisIndex: i,
          stack: stack ? 'stack' : undefined,
          smooth: area,
          showSymbol: markerEnabled || !isLineMode,
          symbolSize: pointSize,
          itemStyle: {
            color: colorScale(metricLabel),
          },
          lineStyle: {
            color: colorScale(metricLabel),
          },
          areaStyle: area
            ? {
                opacity: 0.2,
              }
            : undefined,
          label: showValue
            ? {
                show: true,
                formatter: (params: any) => yFormatter(params.value[1]),
                position: 'top',
              }
            : undefined,
          data: pts,
        });

        if (showRegressionLine) {
          const xy = pts.map((entry: any) => [entry.value[0], entry.value[1]] as [number, number]);
          const numericPoints = xy.filter(
            ([x, y]) => typeof x === 'number' && typeof y === 'number',
          );
          const reg = linearRegression(numericPoints);

          if (reg && numericPoints.length) {
            const xs = numericPoints.map(point => point[0]);
            const minLineX = Math.min(...xs);
            const maxLineX = Math.max(...xs);

            series.push({
              name: `${metricLabel} regression`,
              type: 'line',
              xAxisIndex: i,
              yAxisIndex: i,
              symbol: 'none',
              silent: true,
              lineStyle: {
                color: colorScale(metricLabel),
                type: 'dashed',
              },
              data: [
                [minLineX, reg.m * minLineX + reg.b],
                [maxLineX, reg.m * maxLineX + reg.b],
              ],
            });
          }
        }
      });
    });

    const graphic = panelKeys.map((panelKey, i) => ({
      type: 'text',
      left: `${leftPct + i * (panelWidthPct + gapPct) + panelWidthPct / 2}%`,
      top: chartTitle ? '9%' : '4%',
      style: {
        text: panelKey,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
      },
    }));

    const legendPositions: Record<string, any> = {
      top: { top: legendMargin, orient: 'horizontal' },
      bottom: { bottom: legendMargin, orient: 'horizontal' },
      left: { left: legendMargin, top: 'middle', orient: 'vertical' },
      right: { right: legendMargin, top: 'middle', orient: 'vertical' },
    };

    const tooltipFormatter = (params: any) => {
      const items = Array.isArray(params) ? [...params] : [params];
      if (tooltipSortByMetric) {
        items.sort((left, right) => Number(right.value?.[1] || 0) - Number(left.value?.[1] || 0));
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
        const percentage = total ? ` (${((value / total) * 100).toFixed(1)}%)` : '';
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
      title: chartTitle
        ? {
            text: chartTitle,
            left: 'center',
            top: 0,
          }
        : undefined,
      tooltip: {
        trigger: richTooltip ? 'axis' : 'item',
        formatter: tooltipFormatter,
      },
      legend: {
        type: legendType,
        show: showLegend,
        data: metricOrder,
        ...legendPositions[legendOrientation],
      },
      grid,
      xAxis,
      yAxis,
      series,
      graphic,
      dataZoom: zoomable
        ? [
            {
              type: 'slider',
              xAxisIndex: panelKeys.map((_, index) => index),
            },
            {
              type: 'inside',
              xAxisIndex: panelKeys.map((_, index) => index),
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
    pointSize,
    richTooltip,
    showLegend,
    showTooltipPercentage,
    showTooltipTotal,
    showRegressionLine,
    showValue,
    showXAxis,
    showYAxis,
    sortSeriesAscending,
    sortSeriesType,
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
    yColumn,
    yMax,
    yMin,
    yAxisPrefix,
    yAxisSuffix,
    yAxisTitle,
    yAxisTitleMargin,
    yAxisTitlePosition,
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
