import React, { useEffect, useMemo, useRef } from 'react';
import * as echarts from 'echarts';
import { SupersetPluginChartScatterStripProps } from './types';

function toNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  showRegressionLine,
}: SupersetPluginChartScatterStripProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  const option = useMemo(() => {
    if (!panelColumn || !xColumn || !yColumn) {
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

    const grouped = new Map<string, Record<string, any>[]>();

    for (const row of data) {
      const panel = String(row[panelColumn]);
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
      .slice(0, panelCount);

    const gapPct = 1;
    const leftPct = 4;
    const rightPct = 2;
    const usablePct = 100 - leftPct - rightPct - gapPct * (panelCount - 1);
    const panelWidthPct = usablePct / panelCount;

    const grid = panelKeys.map((_, i) => ({
      left: `${leftPct + i * (panelWidthPct + gapPct)}%`,
      top: '12%',
      width: `${panelWidthPct}%`,
      height: '72%',
      containLabel: true,
    }));

    const xAxis = panelKeys.map((_, i) => ({
      type: 'value',
      gridIndex: i,
      min: xMin ?? 'dataMin',
      max: xMax ?? 'dataMax',
      name: i === 0 ? String(xColumn) : '',
      nameLocation: 'middle',
      nameGap: 28,
    }));

    const yAxis = panelKeys.map((_, i) => ({
      type: 'value',
      gridIndex: i,
      min: yMin ?? 'dataMin',
      max: yMax ?? 'dataMax',
      name: i === 0 ? String(yColumn) : '',
      nameLocation: 'middle',
      nameGap: 40,
      splitLine: { show: true },
    }));

    const series: any[] = [];

    panelKeys.forEach((panelKey, i) => {
      const rows = grouped.get(panelKey) || [];

      const pts = rows
        .map(r => {
          const x = toNum(r[xColumn]);
          const y = toNum(r[yColumn]);
          const lbl = labelColumn ? String(r[labelColumn]) : '';
          if (x === null || y === null) return null;
          return [x, y, lbl];
        })
        .filter(Boolean) as [number, number, string][];

      series.push({
        name: panelKey,
        type: 'scatter',
        xAxisIndex: i,
        yAxisIndex: i,
        symbolSize: pointSize,
        data: pts,
        tooltip: {
          formatter: (params: any) => {
            const [x, y, lbl] = params.data;
            return `${panelKey}<br/>x: ${x}<br/>y: ${y}${lbl ? `<br/>label: ${lbl}` : ''}`;
          },
        },
      });

      if (showRegressionLine) {
        const xy = pts.map(([x, y]) => [x, y] as [number, number]);
        const reg = linearRegression(xy);

        if (reg) {
          const xs = xy.map(p => p[0]);
          const minLineX = xMin ?? Math.min(...xs);
          const maxLineX = xMax ?? Math.max(...xs);

          series.push({
            name: `${panelKey} regression`,
            type: 'line',
            xAxisIndex: i,
            yAxisIndex: i,
            symbol: 'none',
            silent: true,
            data: [
              [minLineX, reg.m * minLineX + reg.b],
              [maxLineX, reg.m * maxLineX + reg.b],
            ],
          });
        }
      }
    });

    const graphic = panelKeys.map((panelKey, i) => ({
      type: 'text',
      left: `${leftPct + i * (panelWidthPct + gapPct) + panelWidthPct / 2}%`,
      top: '4%',
      style: {
        text: panelKey,
        textAlign: 'center',
        fontSize: 14,
        fontWeight: 600,
      },
    }));

    return {
      animation: false,
      tooltip: { trigger: 'item' },
      grid,
      xAxis,
      yAxis,
      series,
      graphic,
    };
  }, [
    data,
    labelColumn,
    panelColumn,
    panelCount,
    pointSize,
    showRegressionLine,
    xColumn,
    xMax,
    xMin,
    yColumn,
    yMax,
    yMin,
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
