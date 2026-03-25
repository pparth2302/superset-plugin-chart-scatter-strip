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
      xAxisColumn: 'name',
      metricLabels: ['sum__num'],
      groupby: ['panel_id', 'name'],
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
      xAxisBounds: [0, 50],
      yAxisBounds: [null, 100],
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
      showLegend: true,
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
});
