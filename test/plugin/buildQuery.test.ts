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

  it('should build one shared query for configured panel filters with shared x-axis and metric', () => {
    const queryContext = buildQuery({
      datasource: '5__table',
      granularity_sqla: 'ds',
      x_axis: 'event_time',
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
      viz_type: 'my_chart',
    });

    expect(queryContext.queries).toHaveLength(1);
    expect(queryContext.queries[0].columns).toEqual(['event_time', 'nest_num']);
    expect(queryContext.queries[0].metrics).toEqual(['AVG(top_adhesive_od)']);
    expect(queryContext.queries[0].orderby).toEqual([['event_time', true]]);
  });

  it('should preserve adhoc x-axis columns and include filter subjects once', () => {
    const adhocXAxis = {
      label: 'PalletDate Time',
      sqlExpression: 'PalletDate Time',
      expressionType: 'SQL',
    };

    const queryContext = buildQuery({
      datasource: '5__table',
      granularity_sqla: 'ds',
      x_axis: adhocXAxis as any,
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
      viz_type: 'my_chart',
    });

    expect(queryContext.queries).toHaveLength(1);
    expect(queryContext.queries[0].columns).toEqual([adhocXAxis, 'NestNum']);
    expect(queryContext.queries[0].orderby).toEqual([['PalletDate Time', true]]);
  });
});
