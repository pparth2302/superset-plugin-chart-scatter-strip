import { t } from '@superset-ui/core';
import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';

const sortSeriesChoices = [
  ['name', t('Name')],
  ['sum', t('Sum')],
  ['avg', t('Average')],
  ['min', t('Minimum')],
  ['max', t('Maximum')],
];

const panelQuerySections: ControlPanelConfig['controlPanelSections'] = Array.from(
  { length: 7 },
  (_, zeroIndex) => {
  const index = zeroIndex + 1;
  return {
    label: t(`Query ${index}`),
    expanded: index === 1,
    tabOverride: 'data' as const,
    controlSetRows: [
      [
        {
          name: `query_${index}_title`,
          config: {
            type: 'TextControl',
            label: t(`Query ${index} Column Label`),
            default: '',
            renderTrigger: true,
            description: t('Optional text label shown for this graph.'),
          },
        },
      ],
      [
        {
          name: `query_${index}_filters`,
          config: {
            ...sharedControls.adhoc_filters,
            label: t(`Query ${index} Filter`),
            default: [],
            renderTrigger: true,
            description: t(
              'Filter this graph to a subset of the shared X and Y query, for example NestNum = 1.',
            ),
          },
        },
      ],
    ],
  };
});

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      tabOverride: 'data',
      controlSetRows: [
        [
          {
            name: 'query_mode',
            config: {
              type: 'SelectControl',
              label: t('Query Mode'),
              default: 'panel_queries',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['panel_queries', t('Panel Queries (1-7)')],
                ['split_by_dimension', t('Split by Dimension (Legacy)')],
              ],
              description: t(
                'Use Panel Queries to define up to seven joined panels with a shared X and Y plus separate filters.',
              ),
            },
          },
        ],
        [
          {
            name: 'x_axis',
            config: {
              ...sharedControls.series,
              label: t('X-axis'),
              description: t('Shared x-axis field used across all strip panels.'),
            },
          },
        ],
        ['time_grain_sqla'],
        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              label: t('Y-axis'),
              description: t('Shared Y metric used across all strip panels.'),
            },
          },
        ],
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('Dimensions'),
              description: t(
                'The first dimension defines the strip panel. Additional dimensions are included in point labels and tooltips.',
              ),
            },
          },
        ],
        [
          {
            name: 'contributionMode',
            config: {
              type: 'SelectControl',
              label: t('Contribution Mode'),
              clearable: true,
              renderTrigger: true,
              default: null,
              choices: [
                [null, t('None')],
                ['row', t('Row')],
                ['column', t('Column')],
              ],
              description: t('Normalize metric values by row or column contribution.'),
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'series_limit',
            config: {
              ...sharedControls.series_limit,
              label: t('Series limit'),
            },
          },
        ],
        [
          {
            name: 'series_limit_metric',
            config: {
              ...sharedControls.series_limit_metric,
              label: t('Sort query by'),
            },
          },
        ],
        [
          {
            name: 'order_desc',
            config: {
              type: 'CheckboxControl',
              label: t('Sort descending'),
              default: true,
              description: t('Whether the series limit sort should be descending.'),
            },
          },
        ],
        ['row_limit'],
        [
          {
            name: 'truncate_metric',
            config: {
              type: 'CheckboxControl',
              label: t('Truncate Metric'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_empty_columns',
            config: {
              type: 'CheckboxControl',
              label: t('Show empty columns'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      ...sections.advancedAnalyticsControls,
      tabOverride: 'data',
    },
    {
      ...sections.annotationsAndLayersControls,
      tabOverride: 'data',
    },
    ...panelQuerySections,
    {
      label: t('Chart Title'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'chart_title',
            config: {
              type: 'TextControl',
              label: t('Chart Title'),
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'panel_header_title',
            config: {
              type: 'TextControl',
              label: t('Panel Header Title'),
              default: '',
              renderTrigger: true,
              description: t('Centered label shown above the joined strip panels.'),
            },
          },
        ],
      ],
    },
    {
      label: t('X Axis'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_x_axis',
            config: {
              type: 'CheckboxControl',
              label: t('X Axis'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_axis_title',
            config: {
              type: 'TextControl',
              label: t('X Axis Title'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_axis_title_margin',
            config: {
              type: 'TextControl',
              label: t('X Axis Title Margin'),
              default: 28,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        ['x_axis_time_format'],
        [
          {
            name: 'x_axis_label_rotation',
            config: {
              type: 'TextControl',
              label: t('Rotate x axis label'),
              default: 0,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_axis_label_interval',
            config: {
              type: 'TextControl',
              label: t('X Axis Label Interval'),
              default: 'auto',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'truncateXAxis',
            config: {
              type: 'CheckboxControl',
              label: t('Truncate X Axis'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_axis_bounds',
            config: {
              type: 'BoundsControl',
              label: t('X Axis Bounds'),
              default: [null, null],
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Y Axis'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_y_axis',
            config: {
              type: 'CheckboxControl',
              label: t('Y Axis'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'y_axis_title',
            config: {
              type: 'TextControl',
              label: t('Y Axis Title'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'y_axis_title_margin',
            config: {
              type: 'TextControl',
              label: t('Y Axis Title Margin'),
              default: 40,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'y_axis_title_position',
            config: {
              type: 'SelectControl',
              label: t('Y Axis Title Position'),
              default: 'Left',
              clearable: false,
              renderTrigger: true,
              choices: [
                ['Left', t('Left')],
                ['Right', t('Right')],
              ],
            },
          },
        ],
        ['y_axis_format'],
        [
          {
            name: 'currency_format',
            config: {
              type: 'SelectControl',
              label: t('Currency format'),
              default: 'number',
              renderTrigger: true,
              choices: [
                ['number', t('Number')],
                ['prefix', t('Prefix or suffix')],
                ['currency', t('Currency')],
              ],
            },
          },
        ],
        [
          {
            name: 'y_axis_prefix',
            config: {
              type: 'TextControl',
              label: t('Prefix or suffix'),
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'currency',
            config: {
              type: 'TextControl',
              label: t('Currency'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'logAxis',
            config: {
              type: 'CheckboxControl',
              label: t('Logarithmic y-axis'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'spec_band_min',
            config: {
              type: 'TextControl',
              label: t('Spec Min'),
              default: '',
              renderTrigger: true,
              description: t('Lower red limit line and green band boundary.'),
            },
          },
          {
            name: 'spec_band_max',
            config: {
              type: 'TextControl',
              label: t('Spec Max'),
              default: '',
              renderTrigger: true,
              description: t('Upper red limit line and green band boundary.'),
            },
          },
        ],
        [
          {
            name: 'show_spec_band',
            config: {
              type: 'CheckboxControl',
              label: t('Show spec band'),
              default: true,
              renderTrigger: true,
            },
          },
          {
            name: 'show_spec_labels',
            config: {
              type: 'CheckboxControl',
              label: t('Show spec labels'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'spec_band_color',
            config: {
              type: 'TextControl',
              label: t('Spec band color'),
              default: 'rgba(214, 239, 196, 0.85)',
              renderTrigger: true,
            },
          },
          {
            name: 'spec_line_color',
            config: {
              type: 'TextControl',
              label: t('Spec line color'),
              default: '#c62828',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'minorSplitLine',
            config: {
              type: 'CheckboxControl',
              label: t('Minor Split Line'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'truncateYAxis',
            config: {
              type: 'CheckboxControl',
              label: t('Truncate Y Axis'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'y_axis_bounds',
            config: {
              type: 'BoundsControl',
              label: t('Y Axis Bounds'),
              default: [null, null],
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'sort_series_type',
            config: {
              type: 'SelectControl',
              label: t('Sort Series By'),
              default: 'name',
              renderTrigger: true,
              choices: sortSeriesChoices,
            },
          },
          {
            name: 'panel_count',
            config: {
              type: 'TextControl',
              label: t('Panel count'),
              default: 7,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'sort_series_ascending',
            config: {
              type: 'CheckboxControl',
              label: t('Sort Series Ascending'),
              default: true,
              renderTrigger: true,
            },
          },
          {
            name: 'point_size',
            config: {
              type: 'TextControl',
              label: t('Point size'),
              default: 6,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
        ['color_scheme'],
        [
          {
            name: 'show_value',
            config: {
              type: 'CheckboxControl',
              label: t('Show Value'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'stack',
            config: {
              type: 'CheckboxControl',
              label: t('Stacked Style'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'area',
            config: {
              type: 'CheckboxControl',
              label: t('Area Chart'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'marker_enabled',
            config: {
              type: 'CheckboxControl',
              label: t('Marker'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'zoomable',
            config: {
              type: 'CheckboxControl',
              label: t('Data Zoom'),
              default: false,
              renderTrigger: true,
            },
          },
          {
            name: 'show_regression_line',
            config: {
              type: 'CheckboxControl',
              label: t('Regression line'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'minor_ticks',
            config: {
              type: 'CheckboxControl',
              label: t('Minor ticks'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Legend'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'show_legend',
            config: {
              type: 'CheckboxControl',
              label: t('Show legend'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'legend_type',
            config: {
              type: 'SelectControl',
              label: t('Type'),
              default: 'scroll',
              renderTrigger: true,
              choices: [
                ['plain', t('Plain')],
                ['scroll', t('Scroll')],
              ],
            },
          },
        ],
        [
          {
            name: 'legend_orientation',
            config: {
              type: 'SelectControl',
              label: t('Orientation'),
              default: 'top',
              renderTrigger: true,
              choices: [
                ['top', t('Top')],
                ['bottom', t('Bottom')],
                ['left', t('Left')],
                ['right', t('Right')],
              ],
            },
          },
        ],
        [
          {
            name: 'legend_margin',
            config: {
              type: 'TextControl',
              label: t('Margin'),
              default: 0,
              isInt: true,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Tooltip'),
      expanded: true,
      tabOverride: 'customize',
      controlSetRows: [
        [
          {
            name: 'rich_tooltip',
            config: {
              type: 'CheckboxControl',
              label: t('Rich tooltip'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_tooltip_total',
            config: {
              type: 'CheckboxControl',
              label: t('Show total'),
              default: false,
              renderTrigger: true,
            },
          },
          {
            name: 'show_tooltip_percentage',
            config: {
              type: 'CheckboxControl',
              label: t('Show percentage'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'tooltip_sort_by_metric',
            config: {
              type: 'CheckboxControl',
              label: t('Tooltip sort by metric'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'tooltip_time_format',
            config: {
              type: 'TextControl',
              label: t('Tooltip time format'),
              default: 'smart_date',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
