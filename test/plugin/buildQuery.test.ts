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
import buildQuery from '../../src/plugin/buildQuery';

describe('SupersetPluginChartScatterStrip buildQuery', () => {
  const formData = {
    datasource: '5__table',
    granularity_sqla: 'ds',
    x_axis: 'foo',
    groupby: ['panel_id', 'name'],
    metrics: ['sum__bar'],
    series_limit_metric: 'sum__bar',
    order_desc: true,
    viz_type: 'my_chart',
  };

  it('should build the selected scatter-strip columns in query context', () => {
    const queryContext = buildQuery(formData);
    const [query] = queryContext.queries;
    expect(query.columns).toEqual(['foo', 'panel_id', 'name']);
    expect(query.metrics).toEqual(['sum__bar']);
    expect(query.orderby).toEqual([['sum__bar', false]]);
  });

  it('should build one query per configured panel query with shared x-axis', () => {
    const queryContext = buildQuery({
      datasource: '5__table',
      granularity_sqla: 'ds',
      x_axis: 'event_time',
      label_column: 'serial_no',
      query_mode: 'panel_queries',
      query_1_title: 'Nest 1',
      query_1_y_column: 'nest_1_value',
      query_2_title: 'Nest 2',
      query_2_metric: 'MAX(nest_2_value)',
      viz_type: 'my_chart',
    });

    expect(queryContext.queries).toHaveLength(2);
    expect(queryContext.queries[0].columns).toEqual([
      'event_time',
      'nest_1_value',
      'serial_no',
    ]);
    expect(queryContext.queries[0].metrics).toEqual([]);
    expect(queryContext.queries[0].orderby).toEqual([['event_time', true]]);
    expect(queryContext.queries[0].extras?.where).toBeUndefined();

    expect(queryContext.queries[1].columns).toEqual(['event_time']);
    expect(queryContext.queries[1].metrics).toEqual(['MAX(nest_2_value)']);
    expect(queryContext.queries[1].orderby).toEqual([['event_time', true]]);
    expect(queryContext.queries[1].extras?.where).toBeUndefined();
  });
});
