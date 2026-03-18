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
  showRegressionLine: boolean;
}

export type SupersetPluginChartScatterStripQueryFormData = QueryFormData &
  {
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
