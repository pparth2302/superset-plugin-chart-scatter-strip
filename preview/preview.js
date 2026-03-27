const SAMPLE_DATA = [
  { nest_id: "Nest 1", measurement_x: 10.2, measurement_y: 98.4, serial_no: "A1001" },
  { nest_id: "Nest 1", measurement_x: 10.7, measurement_y: 99.1, serial_no: "A1002" },
  { nest_id: "Nest 1", measurement_x: 9.9, measurement_y: 97.8, serial_no: "A1003" },
  { nest_id: "Nest 2", measurement_x: 9.8, measurement_y: 97.9, serial_no: "B2001" },
  { nest_id: "Nest 2", measurement_x: 10.1, measurement_y: 98.6, serial_no: "B2002" },
  { nest_id: "Nest 2", measurement_x: 10.5, measurement_y: 99.0, serial_no: "B2003" },
  { nest_id: "Nest 3", measurement_x: 11.0, measurement_y: 100.2, serial_no: "C3001" },
  { nest_id: "Nest 3", measurement_x: 10.6, measurement_y: 99.8, serial_no: "C3002" },
  { nest_id: "Nest 3", measurement_x: 10.8, measurement_y: 100.4, serial_no: "C3003" },
  { nest_id: "Nest 4", measurement_x: 9.4, measurement_y: 96.7, serial_no: "D4001" },
  { nest_id: "Nest 4", measurement_x: 9.7, measurement_y: 97.5, serial_no: "D4002" },
  { nest_id: "Nest 4", measurement_x: 10.0, measurement_y: 98.1, serial_no: "D4003" },
  { nest_id: "Nest 5", measurement_x: 11.2, measurement_y: 100.8, serial_no: "E5001" },
  { nest_id: "Nest 5", measurement_x: 11.5, measurement_y: 101.4, serial_no: "E5002" },
  { nest_id: "Nest 5", measurement_x: 11.1, measurement_y: 100.6, serial_no: "E5003" },
  { nest_id: "Nest 6", measurement_x: 8.9, measurement_y: 95.8, serial_no: "F6001" },
  { nest_id: "Nest 6", measurement_x: 9.2, measurement_y: 96.4, serial_no: "F6002" },
  { nest_id: "Nest 6", measurement_x: 9.5, measurement_y: 97.0, serial_no: "F6003" },
  { nest_id: "Nest 7", measurement_x: 10.9, measurement_y: 99.7, serial_no: "G7001" },
  { nest_id: "Nest 7", measurement_x: 10.4, measurement_y: 99.1, serial_no: "G7002" },
  { nest_id: "Nest 7", measurement_x: 10.7, measurement_y: 99.5, serial_no: "G7003" }
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumber(value) {
  if (value === "" || value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function linearRegression(points) {
  const n = points.length;
  if (n < 2) {
    return null;
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) {
    return null;
  }

  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildOption(config, chartWidth, chartHeight) {
  const grouped = new Map();

  for (const row of SAMPLE_DATA) {
    const panel = String(row.nest_id);
    if (!grouped.has(panel)) {
      grouped.set(panel, []);
    }
    grouped.get(panel).push(row);
  }

  const panelKeys = Array.from(grouped.keys()).slice(0, config.panelCount);
  const panelTotal = Math.max(panelKeys.length, 1);
  const frameLeftPct = 1.2;
  const frameRightPct = 1.2;
  const frameTopPct = 4;
  const frameBottomPct = 8;
  const headerHeightPct = 8;
  const plotLeftPct = 7;
  const plotRightPct = 1.5;
  const plotTopPct = frameTopPct + headerHeightPct;
  const plotBottomPct = 9;
  const plotHeightPct = 100 - plotTopPct - plotBottomPct;
  const panelWidthPct = (100 - plotLeftPct - plotRightPct) / panelTotal;
  const dividerColor = "#b8b8b8";
  const splitLineColor = "#dfe7f3";
  const frameFill = "#ffffff";
  const frameStrokeColor = "#adadad";
  const pointColor = "#5c7ac7";
  const toPixelX = pct => (chartWidth * pct) / 100;
  const toPixelY = pct => (chartHeight * pct) / 100;

  const allYValues = SAMPLE_DATA.map(row => toNumber(row.measurement_y)).filter(
    value => value !== null,
  );
  const yMin =
    config.yMin ?? (allYValues.length ? Math.min(...allYValues) : 0);
  const yMax =
    config.yMax ?? (allYValues.length ? Math.max(...allYValues) : 1);
  const safeYMin = yMin === yMax ? yMin - 1 : yMin;
  const safeYMax = yMin === yMax ? yMax + 1 : yMax;

  const projectYToPixel = value => {
    const ratio = (safeYMax - value) / (safeYMax - safeYMin || 1);
    const pct = clamp(plotTopPct + ratio * plotHeightPct, plotTopPct, plotTopPct + plotHeightPct);
    return toPixelY(pct);
  };

  const grid = panelKeys.map((_, index) => ({
    left: `${plotLeftPct + index * panelWidthPct}%`,
    top: `${plotTopPct}%`,
    width: `${panelWidthPct}%`,
    height: `${plotHeightPct}%`,
    containLabel: false
  }));

  const xAxis = panelKeys.map((_, index) => ({
    type: "value",
    gridIndex: index,
    min: config.xMin ?? "dataMin",
    max: config.xMax ?? "dataMax",
    boundaryGap: false,
    axisLine: {
      show: true,
      lineStyle: { color: dividerColor }
    },
    axisTick: { show: true },
    axisLabel: {
      color: "#333333",
      margin: 10
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: splitLineColor
      }
    }
  }));

  const yAxis = panelKeys.map((_, index) => ({
    type: "value",
    gridIndex: index,
    min: safeYMin,
    max: safeYMax,
    name: index === 0 ? "measurement_y" : "",
    nameLocation: "middle",
    nameGap: 40,
    axisLine: {
      show: index === 0,
      lineStyle: { color: dividerColor }
    },
    axisTick: { show: index === 0 },
    axisLabel: {
      show: index === 0,
      color: "#333333"
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: splitLineColor
      }
    }
  }));

  const series = [];

  panelKeys.forEach((panelKey, index) => {
    const points = (grouped.get(panelKey) || [])
      .map(row => {
        const x = toNumber(row.measurement_x);
        const y = toNumber(row.measurement_y);
        const label = row.serial_no || "";

        if (x === null || y === null) {
          return null;
        }

        return {
          value: [x, y],
          label
        };
      })
      .filter(Boolean);

    series.push({
      name: panelKey,
      type: "scatter",
      xAxisIndex: index,
      yAxisIndex: index,
      symbolSize: config.pointSize,
      itemStyle: {
        color: pointColor,
        opacity: 0.9
      },
      data: points,
      tooltip: {
        formatter(params) {
          const [x, y] = params.data.value;
          const { label } = params.data;
          return `${panelKey}<br/>measurement_x: ${x}<br/>measurement_y: ${y}${label ? `<br/>serial_no: ${label}` : ""}`;
        }
      }
    });

    if (config.showRegressionLine) {
      const xy = points.map(point => point.value);
      const regression = linearRegression(xy);

      if (regression) {
        const xs = xy.map(point => point[0]);
        const minLineX = config.xMin ?? Math.min(...xs);
        const maxLineX = config.xMax ?? Math.max(...xs);

        series.push({
          name: `${panelKey} regression`,
          type: "line",
          xAxisIndex: index,
          yAxisIndex: index,
          symbol: "none",
          silent: true,
          lineStyle: {
            color: "#0f766e",
            width: 1.5,
            type: "dashed"
          },
          data: [
            [minLineX, regression.m * minLineX + regression.b],
            [maxLineX, regression.m * maxLineX + regression.b]
          ]
        });
      }
    }
  });

  const graphic = [
    {
      type: "rect",
      z: -20,
      shape: {
        x: toPixelX(frameLeftPct),
        y: toPixelY(frameTopPct),
        width: toPixelX(100 - frameLeftPct - frameRightPct),
        height: toPixelY(100 - frameTopPct - frameBottomPct)
      },
      style: {
        fill: frameFill,
        stroke: frameStrokeColor,
        lineWidth: 1
      },
      silent: true
    },
    {
      type: "line",
      z: 15,
      shape: {
        x1: toPixelX(plotLeftPct),
        y1: toPixelY(plotTopPct),
        x2: toPixelX(100 - plotRightPct),
        y2: toPixelY(plotTopPct)
      },
      style: {
        stroke: dividerColor,
        lineWidth: 1
      },
      silent: true
    },
    {
      type: "text",
      z: 20,
      left: chartWidth / 2,
      top: toPixelY(frameTopPct + 1.2),
      style: {
        text: "Nest or Pallet #",
        textAlign: "center",
        fill: "#1f2328",
        fontSize: 16,
        fontWeight: 600
      },
      silent: true
    },
    {
      type: "text",
      z: 20,
      left: chartWidth / 2,
      top: toPixelY(100 - 3.8),
      style: {
        text: "measurement_x",
        textAlign: "center",
        fill: "#333333",
        fontSize: 13
      },
      silent: true
    }
  ];

  panelKeys.forEach((panelKey, index) => {
    const xPct = plotLeftPct + index * panelWidthPct;

    graphic.push({
      type: "text",
      z: 20,
      left: toPixelX(xPct + panelWidthPct / 2),
      top: toPixelY(frameTopPct + 4),
      style: {
        text: panelKey.replace("Nest ", ""),
        textAlign: "center",
        fill: "#1f2328",
        fontSize: 14,
        fontWeight: 500
      },
      silent: true
    });

    if (index > 0) {
      graphic.push({
        type: "line",
        z: 15,
        shape: {
          x1: toPixelX(xPct),
          y1: toPixelY(frameTopPct),
          x2: toPixelX(xPct),
          y2: toPixelY(100 - frameBottomPct)
        },
        style: {
          stroke: dividerColor,
          lineWidth: 1
        },
        silent: true
      });
    }
  });

  return {
    animation: false,
    backgroundColor: "transparent",
    tooltip: { trigger: "item" },
    grid,
    xAxis,
    yAxis,
    series,
    graphic
  };
}

const chartDom = document.getElementById("chart");
const chart = echarts.init(chartDom);

const controls = {
  panelCount: document.getElementById("panelCount"),
  pointSize: document.getElementById("pointSize"),
  xMin: document.getElementById("xMin"),
  xMax: document.getElementById("xMax"),
  yMin: document.getElementById("yMin"),
  yMax: document.getElementById("yMax"),
  showRegressionLine: document.getElementById("showRegressionLine")
};

function render() {
  const config = {
    panelCount: Math.max(1, Math.min(7, Number(controls.panelCount.value) || 7)),
    pointSize: Math.max(2, Number(controls.pointSize.value) || 6),
    xMin: parseOptionalNumber(controls.xMin.value),
    xMax: parseOptionalNumber(controls.xMax.value),
    yMin: parseOptionalNumber(controls.yMin.value),
    yMax: parseOptionalNumber(controls.yMax.value),
    showRegressionLine: controls.showRegressionLine.checked
  };

  chart.setOption(
    buildOption(config, chart.getWidth(), chart.getHeight()),
    true,
  );
}

Object.values(controls).forEach(control => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

window.addEventListener("resize", () => {
  chart.resize();
  render();
});

render();
