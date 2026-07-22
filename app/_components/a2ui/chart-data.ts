/* ---------------------------------------------------------------------------
 * Chart.js dataset transforms.
 *
 * Each chart type needs its own `ChartData<TType>` shape because the
 * generic argument narrows the dataset schema (pie vs line vs bar).
 * Keep the four functions here so the renderer file stays a thin
 * dispatcher.
 * ------------------------------------------------------------------------- */

import type { ChartData } from "chart.js";

import { paletteColor } from "./chart-palette";
import type { ChartProps } from "./chart-renderer";

/**
 * Line: one dataset per series; translucent fill, opaque stroke,
 * smooth tension.
 */
export function toLineData(props: ChartProps): ChartData<"line"> {
  return {
    labels: props.data.labels,
    datasets: props.data.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: paletteColor(i, 0.22),
      borderColor: paletteColor(i),
      borderWidth: 2,
      tension: 0.25,
      pointRadius: 3,
    })),
  };
}

/**
 * Bar: one dataset per series; semi-opaque fill, opaque border.
 */
export function toBarData(props: ChartProps): ChartData<"bar"> {
  return {
    labels: props.data.labels,
    datasets: props.data.datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: paletteColor(i, 0.55),
      borderColor: paletteColor(i),
      borderWidth: 1,
    })),
  };
}

function toCategorical(props: ChartProps): {
  labels: string[];
  values: number[];
  label: string;
} {
  const ds = props.data.datasets[0] ?? { label: "", values: [] };
  return {
    labels: props.data.labels,
    values: ds.values,
    label: ds.label,
  };
}

/**
 * Pie: single series, one color per label slice.
 */
export function toPieData(props: ChartProps): ChartData<"pie"> {
  const { labels, values, label } = toCategorical(props);
  return {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) => paletteColor(i, 0.78)),
        borderColor: labels.map((_, i) => paletteColor(i)),
        borderWidth: 1,
      },
    ],
  };
}

/**
 * Doughnut: identical shape to pie (different chart type registry).
 */
export function toDoughnutData(props: ChartProps): ChartData<"doughnut"> {
  const { labels, values, label } = toCategorical(props);
  return {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: labels.map((_, i) => paletteColor(i, 0.78)),
        borderColor: labels.map((_, i) => paletteColor(i)),
        borderWidth: 1,
      },
    ],
  };
}
