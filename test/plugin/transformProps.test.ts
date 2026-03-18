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
    panel_column: 'panel_id',
    x_column: 'name',
    y_column: 'sum__num',
    label_column: 'name',
    panel_count: '7',
    point_size: '12',
    x_min: '0',
    x_max: '50',
    y_min: '',
    y_max: '100',
    show_regression_line: true,
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
      panelColumn: 'panel_id',
      xColumn: 'name',
      yColumn: 'sum__num',
      labelColumn: 'name',
      panelCount: 7,
      pointSize: 12,
      xMin: 0,
      xMax: 50,
      yMin: null,
      yMax: 100,
      showRegressionLine: true,
      data: [{ name: 'Hulk', sum__num: 1 }],
    });
  });
});
