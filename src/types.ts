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
import {
  QueryFormData,
  TimeseriesDataRecord,
} from '@superset-ui/core';

export interface SupersetPluginChartScatterStripStylesProps {
  height: number;
  width: number;
}

export interface SupersetPluginChartScatterStripCustomizeProps {
  chartTitle: string;
  xAxisColumn?: string;
  metricLabels: string[];
  groupby: string[];
  panelColumn?: string;
  xColumn?: string;
  yColumn?: string;
  labelColumn?: string;
  panelCount: number;
  pointSize: number;
  xMin: number | null;
  xMax: number | null;
  yMin: number | null;
  yMax: number | null;
  xAxisBounds: [number | string | null, number | string | null];
  yAxisBounds: [number | string | null, number | string | null];
  showXAxis: boolean;
  xAxisTitle: string;
  xAxisTitleMargin: number;
  xAxisTimeFormat: string;
  xAxisLabelRotation: number;
  xAxisLabelInterval: string | number;
  showYAxis: boolean;
  yAxisTitle: string;
  yAxisTitleMargin: number;
  yAxisTitlePosition: 'Left' | 'Right';
  yAxisFormat: string;
  currencyFormat: string;
  yAxisPrefix: string;
  yAxisSuffix: string;
  currency: string;
  sortSeriesType: string;
  sortSeriesAscending: boolean;
  colorScheme: string;
  showValue: boolean;
  stack: boolean;
  area: boolean;
  markerEnabled: boolean;
  zoomable: boolean;
  minorTicks: boolean;
  minorSplitLine: boolean;
  showLegend: boolean;
  legendType: string;
  legendOrientation: string;
  legendMargin: number;
  richTooltip: boolean;
  showTooltipTotal: boolean;
  showTooltipPercentage: boolean;
  tooltipSortByMetric: boolean;
  tooltipTimeFormat: string;
  truncateXAxis: boolean;
  truncateYAxis: boolean;
  logAxis: boolean;
  contributionMode?: string | null;
  showRegressionLine: boolean;
}

export type SupersetPluginChartScatterStripQueryFormData = QueryFormData &
  {
    chart_title?: string;
    x_axis?: string;
    metrics?: unknown[];
    groupby?: string[];
    contributionMode?: string | null;
    series_limit?: string | number;
    series_limit_metric?: unknown;
    timeseries_limit_metric?: unknown;
    order_desc?: boolean;
    truncate_metric?: boolean;
    show_empty_columns?: boolean;
    show_x_axis?: boolean;
    x_axis_title?: string;
    x_axis_title_margin?: string | number;
    x_axis_time_format?: string;
    x_axis_label_rotation?: string | number;
    x_axis_label_interval?: string | number;
    show_y_axis?: boolean;
    y_axis_title?: string;
    y_axis_title_margin?: string | number;
    y_axis_title_position?: 'Left' | 'Right';
    y_axis_format?: string;
    currency_format?: string;
    y_axis_prefix?: string;
    y_axis_suffix?: string;
    currency?: string;
    sort_series_type?: string;
    sort_series_ascending?: boolean;
    color_scheme?: string;
    show_value?: boolean;
    stack?: boolean;
    area?: boolean;
    marker_enabled?: boolean;
    marker_size?: string | number;
    zoomable?: boolean;
    minor_ticks?: boolean;
    minorSplitLine?: boolean;
    show_legend?: boolean;
    legend_type?: string;
    legend_orientation?: string;
    legend_margin?: string | number;
    rich_tooltip?: boolean;
    show_tooltip_total?: boolean;
    show_tooltip_percentage?: boolean;
    tooltip_sort_by_metric?: boolean;
    tooltip_time_format?: string;
    truncateXAxis?: boolean;
    x_axis_bounds?: [string | number | null, string | number | null];
    truncateYAxis?: boolean;
    y_axis_bounds?: [string | number | null, string | number | null];
    logAxis?: boolean;
    panelColumn?: string;
    xColumn?: string;
    yColumn?: string;
    labelColumn?: string;
    panelCount?: string | number;
    pointSize?: string | number;
    xMin?: string | number;
    xMax?: string | number;
    yMin?: string | number;
    yMax?: string | number;
    showRegressionLine?: boolean;
    panel_column?: string;
    x_column?: string;
    y_column?: string;
    label_column?: string;
    panel_count?: string | number;
    point_size?: string | number;
    x_min?: string | number;
    x_max?: string | number;
    y_min?: string | number;
    y_max?: string | number;
    show_regression_line?: boolean;
    row_limit?: string | number;
    // Backward-compatible fallback used by the starter test/template.
    series?: string;
  };

export type SupersetPluginChartScatterStripProps = SupersetPluginChartScatterStripStylesProps &
  SupersetPluginChartScatterStripCustomizeProps & {
    data: TimeseriesDataRecord[];
  };
