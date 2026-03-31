/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { ChartProps, supersetTheme } from '@superset-ui/core';
import transformProps from '../../src/plugin/transformProps';

describe('SupersetPluginChartScatterStrip transformProps', () => {
  const formData = {
    datasource: '3__table',
    granularity_sqla: 'ds',
    chart_title: 'Scatter Strip',
    x_axis: 'name',
    groupby: ['panel_id', 'name'],
    metrics: ['sum__num'],
    panel_count: '7',
    point_size: '12',
    x_axis_bounds: ['0', '50'],
    y_axis_bounds: ['', '100'],
    show_regression_line: true,
    color_scheme: 'supersetColors',
  };
  const chartProps = new ChartProps({
    formData,
    width: 800,
    height: 600,
    theme: supersetTheme,
    queriesData: [{
      data: [{ name: 'Hulk', sum__num: 1 }],
    }],
  });

  it('should transform chart props for viz', () => {
    expect(transformProps(chartProps)).toEqual({
      width: 800,
      height: 600,
      chartTitle: 'Scatter Strip',
      panelHeaderTitle: '',
      queryMode: 'split_by_dimension',
      xAxisColumn: 'name',
      metricLabels: ['sum__num'],
      groupby: ['panel_id', 'name'],
      panelQueries: [],
      panelColumn: undefined,
      xColumn: 'name',
      yColumn: undefined,
      labelColumn: undefined,
      panelCount: 7,
      pointSize: 12,
      xMin: null,
      xMax: null,
      yMin: null,
      yMax: null,
      specBandMin: null,
      specBandMax: null,
      xAxisBounds: [0, 50],
      yAxisBounds: [null, 100],
      showSpecBand: true,
      showSpecLabels: true,
      specBandColor: 'rgba(214, 239, 196, 0.85)',
      specLineColor: '#c62828',
      showXAxis: true,
      xAxisTitle: '',
      xAxisTitleMargin: 28,
      xAxisTimeFormat: 'smart_date',
      xAxisLabelRotation: 0,
      xAxisLabelInterval: 'auto',
      showYAxis: true,
      yAxisTitle: '',
      yAxisTitleMargin: 40,
      yAxisTitlePosition: 'Left',
      yAxisFormat: 'SMART_NUMBER',
      currencyFormat: 'number',
      yAxisPrefix: '',
      yAxisSuffix: '',
      currency: '',
      sortSeriesType: 'name',
      sortSeriesAscending: true,
      colorScheme: 'supersetColors',
      showValue: false,
      stack: false,
      area: false,
      markerEnabled: true,
      zoomable: false,
      minorTicks: false,
      minorSplitLine: false,
      showLegend: false,
      legendType: 'scroll',
      legendOrientation: 'top',
      legendMargin: 0,
      richTooltip: true,
      showTooltipTotal: false,
      showTooltipPercentage: false,
      tooltipSortByMetric: true,
      tooltipTimeFormat: 'smart_date',
      truncateXAxis: false,
      truncateYAxis: false,
      logAxis: false,
      contributionMode: undefined,
      showRegressionLine: true,
      data: [{ name: 'Hulk', sum__num: 1 }],
    });
  });

  it('should transform panel query mode into ordered panel configs', () => {
    const panelQueryChartProps = new ChartProps({
      formData: {
        datasource: '3__table',
        x_axis: 'ds',
        metrics: ['AVG(top_adhesive_od)'],
        query_mode: 'panel_queries',
        query_1_title: 'Nest 1',
        query_1_filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'nest_num',
            operator: '==',
            comparator: '1',
          },
        ],
        query_2_title: 'Nest 2',
        query_2_filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'nest_num',
            operator: '==',
            comparator: '2',
          },
        ],
      },
      width: 800,
      height: 600,
      theme: supersetTheme,
      queriesData: [
        {
          data: [
            { ds: '2026-03-18', nest_num: '1', 'AVG(top_adhesive_od)': 7.2 },
            { ds: '2026-03-18', nest_num: '2', 'AVG(top_adhesive_od)': 7.1 },
          ],
        },
      ],
    });

    const transformed = transformProps(panelQueryChartProps);

    expect(transformed.queryMode).toBe('panel_queries');
    expect(transformed.panelQueries).toEqual([
      {
        key: 'query_1',
        title: 'Nest 1',
        yField: 'AVG(top_adhesive_od)',
        yFieldType: 'metric',
        filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'nest_num',
            operator: '==',
            comparator: '1',
          },
        ],
        data: [
          { ds: '2026-03-18', nest_num: '1', 'AVG(top_adhesive_od)': 7.2 },
          { ds: '2026-03-18', nest_num: '2', 'AVG(top_adhesive_od)': 7.1 },
        ],
      },
      {
        key: 'query_2',
        title: 'Nest 2',
        yField: 'AVG(top_adhesive_od)',
        yFieldType: 'metric',
        filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'nest_num',
            operator: '==',
            comparator: '2',
          },
        ],
        data: [
          { ds: '2026-03-18', nest_num: '1', 'AVG(top_adhesive_od)': 7.2 },
          { ds: '2026-03-18', nest_num: '2', 'AVG(top_adhesive_od)': 7.1 },
        ],
      },
    ]);
  });

  it('should resolve shared panel metrics with adhoc x-axis labels for rendering', () => {
    const panelQueryChartProps = new ChartProps({
      formData: {
        datasource: '3__table',
        x_axis: {
          label: 'PalletDate Time',
          sqlExpression: 'PalletDate Time',
          expressionType: 'SQL',
        } as any,
        metrics: ['AVG(TopAdhesiveOD)'],
        query_mode: 'panel_queries',
        query_1_title: 'Nest 1',
        query_1_filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'NestNum',
            operator: '==',
            comparator: '1',
          },
        ],
      },
      width: 800,
      height: 600,
      theme: supersetTheme,
      queriesData: [
        {
          data: [
            {
              'PalletDate Time': '2026-03-18T10:00:00',
              NestNum: '1',
              'AVG(TopAdhesiveOD)': 7.2,
            },
          ],
        },
      ],
    });

    const transformed = transformProps(panelQueryChartProps);

    expect(transformed.xAxisColumn).toBe('PalletDate Time');
    expect(transformed.panelQueries).toEqual([
      {
        key: 'query_1',
        title: 'Nest 1',
        yField: 'AVG(TopAdhesiveOD)',
        yFieldType: 'metric',
        filters: [
          {
            clause: 'WHERE',
            expressionType: 'SIMPLE',
            subject: 'NestNum',
            operator: '==',
            comparator: '1',
          },
        ],
        data: [
          {
            'PalletDate Time': '2026-03-18T10:00:00',
            NestNum: '1',
            'AVG(TopAdhesiveOD)': 7.2,
          },
        ],
      },
    ]);
  });
});
