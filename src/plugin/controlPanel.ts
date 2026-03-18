import { t } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

const getChoices = (state: any) =>
  state?.datasource?.columns?.map((c: any) => [
    c.column_name,
    c.column_name,
  ]) || [];

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'panel_column',
            config: {
              type: 'SelectControl',
              label: t('Panel column'),
              renderTrigger: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                choices: getChoices(state),
              }),
              description: t(
                'Column that identifies each panel, such as Nest 1 to Nest 7',
              ),
            },
          },
        ],
        [
          {
            name: 'x_column',
            config: {
              type: 'SelectControl',
              label: t('X column'),
              renderTrigger: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                choices: getChoices(state),
              }),
            },
          },
          {
            name: 'y_column',
            config: {
              type: 'SelectControl',
              label: t('Y column'),
              renderTrigger: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                choices: getChoices(state),
              }),
            },
          },
        ],
        [
          {
            name: 'label_column',
            config: {
              type: 'SelectControl',
              label: t('Label column'),
              renderTrigger: true,
              freeForm: false,
              clearable: true,
              mapStateToProps: (state: any) => ({
                choices: getChoices(state),
              }),
              description: t('Optional point label used in tooltip'),
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: t('Customize'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'panel_count',
            config: {
              type: 'TextControl',
              label: t('Panel count'),
              default: '7',
              renderTrigger: true,
            },
          },
          {
            name: 'point_size',
            config: {
              type: 'TextControl',
              label: t('Point size'),
              default: '10',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_min',
            config: {
              type: 'TextControl',
              label: t('X min'),
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'x_max',
            config: {
              type: 'TextControl',
              label: t('X max'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'y_min',
            config: {
              type: 'TextControl',
              label: t('Y min'),
              default: '',
              renderTrigger: true,
            },
          },
          {
            name: 'y_max',
            config: {
              type: 'TextControl',
              label: t('Y max'),
              default: '',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'show_regression_line',
            config: {
              type: 'CheckboxControl',
              label: t('Show regression line'),
              default: false,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;