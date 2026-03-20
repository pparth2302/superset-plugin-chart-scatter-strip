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

function buildOption(config) {
  const grouped = new Map();

  for (const row of SAMPLE_DATA) {
    const panel = String(row.nest_id);
    if (!grouped.has(panel)) {
      grouped.set(panel, []);
    }
    grouped.get(panel).push(row);
  }

  const panelKeys = Array.from(grouped.keys()).slice(0, config.panelCount);
  const gapPct = 1;
  const leftPct = 4;
  const rightPct = 2;
  const usablePct = 100 - leftPct - rightPct - gapPct * (config.panelCount - 1);
  const panelWidthPct = usablePct / config.panelCount;

  const grid = panelKeys.map((_, index) => ({
    left: `${leftPct + index * (panelWidthPct + gapPct)}%`,
    top: "12%",
    width: `${panelWidthPct}%`,
    height: "72%",
    containLabel: true
  }));

  const xAxis = panelKeys.map((_, index) => ({
    type: "value",
    gridIndex: index,
    min: config.xMin ?? "dataMin",
    max: config.xMax ?? "dataMax",
    name: index === 0 ? "measurement_x" : "",
    nameLocation: "middle",
    nameGap: 28
  }));

  const yAxis = panelKeys.map((_, index) => ({
    type: "value",
    gridIndex: index,
    min: config.yMin ?? "dataMin",
    max: config.yMax ?? "dataMax",
    name: index === 0 ? "measurement_y" : "",
    nameLocation: "middle",
    nameGap: 40,
    splitLine: { show: true }
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

        return [x, y, label];
      })
      .filter(Boolean);

    series.push({
      name: panelKey,
      type: "scatter",
      xAxisIndex: index,
      yAxisIndex: index,
      symbolSize: config.pointSize,
      data: points,
      tooltip: {
        formatter(params) {
          const [x, y, label] = params.data;
          return `${panelKey}<br/>x: ${x}<br/>y: ${y}${label ? `<br/>label: ${label}` : ""}`;
        }
      }
    });

    if (config.showRegressionLine) {
      const xy = points.map(([x, y]) => [x, y]);
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
            width: 2
          },
          data: [
            [minLineX, regression.m * minLineX + regression.b],
            [maxLineX, regression.m * maxLineX + regression.b]
          ]
        });
      }
    }
  });

  const graphic = panelKeys.map((panelKey, index) => ({
    type: "text",
    left: `${leftPct + index * (panelWidthPct + gapPct) + panelWidthPct / 2}%`,
    top: "4%",
    style: {
      text: panelKey,
      textAlign: "center",
      fontSize: 14,
      fontWeight: 600,
      fill: "#1f2328"
    }
  }));

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
    pointSize: Math.max(2, Number(controls.pointSize.value) || 10),
    xMin: parseOptionalNumber(controls.xMin.value),
    xMax: parseOptionalNumber(controls.xMax.value),
    yMin: parseOptionalNumber(controls.yMin.value),
    yMax: parseOptionalNumber(controls.yMax.value),
    showRegressionLine: controls.showRegressionLine.checked
  };

  chart.setOption(buildOption(config), true);
}

Object.values(controls).forEach(control => {
  control.addEventListener("input", render);
  control.addEventListener("change", render);
});

window.addEventListener("resize", () => chart.resize());

render();
