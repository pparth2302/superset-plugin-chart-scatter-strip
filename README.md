# superset-plugin-chart-scatter-strip

`superset-plugin-chart-scatter-strip` is a custom Apache Superset visualization plugin built with Apache ECharts. It renders a scatter plot as a horizontal strip of small multiples, with one panel per process, nest, lane, or station. The current chart is optimized for a `1 x N` layout and defaults to `7` panels.

## Basic Info

This plugin lets you compare multiple related scatter plots side by side while keeping the same visual structure across panels. Each panel represents one category from a chosen column, and each point uses:

- one column for the panel/group
- one column for the x-axis
- one column for the y-axis
- an optional label column for tooltip detail

It also supports:

- configurable panel count
- configurable point size
- optional x/y min and max bounds
- optional per-panel regression lines

## Why It Exists

Standard scatter plots are useful for exploring relationships between two variables, but they become harder to compare when several parallel processes need to be reviewed at once. This plugin exists to make those comparisons easier.

It is especially useful when you want to:

- compare the same measurement across multiple nests, lanes, tools, or stations
- spot outliers in one panel versus the others
- see whether trends are consistent across parallel equipment
- keep a shared visual layout for operational or industrial analytics

## How to Install It

### 1. Install dependencies and build the plugin

From this repo:

```bash
cd superset-plugin-chart-scatter-strip
npm install
npm run build
```

### 2. Add the plugin to your Superset frontend

From your `superset-frontend` project, configure the GitHub Packages scope in `.npmrc`:

```bash
@pparth2302:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Keep the registry scoped to `@pparth2302`. Do not run `npm install` with
`--registry=https://npm.pkg.github.com`, because that makes npm try to fetch
public dependencies such as `echarts` from GitHub Packages instead of npmjs.org.

Then install the package normally:

```bash
npm install -S @pparth2302/superset-plugin-chart-scatter-strip
```

If you see `404 Not Found - GET https://npm.pkg.github.com/echarts`, your
registry override is too broad. Remove the global `--registry` flag and keep the
scope mapping in `.npmrc` instead.

### 3. Register the plugin

Import and register it in your Superset frontend setup:

```js
import { SupersetPluginChartScatterStrip } from '@pparth2302/superset-plugin-chart-scatter-strip';

new SupersetPluginChartScatterStrip()
  .configure({ key: 'superset-plugin-chart-scatter-strip' })
  .register();
```

Add that registration wherever your Superset build registers custom chart plugins.

### 4. Rebuild Superset frontend assets

```bash
npm run build
```

If your Superset setup uses a different frontend build workflow, use that project's normal rebuild process.

## How to Use It

After the plugin is registered and your frontend is rebuilt:

1. Open Superset and create a new chart.
2. Select the visualization named `Scatter Strip 1x7`.
3. Choose a dataset that includes:
   - a panel/group column such as `nest_id`, `lane`, or `station`
   - an x-axis numeric column
   - a y-axis numeric column
   - an optional label column for tooltip text
4. In the chart controls:
   - set `Panel column`
   - set `X column`
   - set `Y column`
   - optionally set `Label column`
   - optionally adjust `Panel count`
   - optionally set point size and axis bounds
   - optionally enable `Show regression line`
5. Run the chart.

The plugin will group rows by the selected panel column and render each group in its own small scatter panel.

## Sample Dataset

Here is a simple example dataset structure:

| nest_id | measurement_x | measurement_y | serial_no |
| --- | ---: | ---: | --- |
| Nest 1 | 10.2 | 98.4 | A1001 |
| Nest 1 | 10.7 | 99.1 | A1002 |
| Nest 2 | 9.8 | 97.9 | B2001 |
| Nest 2 | 10.1 | 98.6 | B2002 |
| Nest 3 | 11.0 | 100.2 | C3001 |
| Nest 3 | 10.6 | 99.8 | C3002 |

Recommended chart mapping:

- `Panel column`: `nest_id`
- `X column`: `measurement_x`
- `Y column`: `measurement_y`
- `Label column`: `serial_no`


## Screenshots

Screenshots can be added here later to show:

- the chart in Superset Explore view
- a dashboard example
- a tooltip example
- a regression-line example
