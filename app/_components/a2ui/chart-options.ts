/* ---------------------------------------------------------------------------
 * Chart.js option transforms.
 *
 * Each chart type needs its own `ChartOptions<TType>` because the
 * generic argument narrows the scale + dataset option types. Shared
 * legend/title config lives in `legendAndTitle` below.
 * ------------------------------------------------------------------------- */

import type { ChartOptions } from "chart.js";

import type { ChartProps } from "./chart-renderer";

/**
 * Common legend (bottom) + title (top, bold). Used by every chart
 * type so the four option functions below stay tiny. Typed as the
 * common ``plugins`` block so each chart type can spread it without
 * a generic mismatch.
 */
function legendAndTitle(props: ChartProps) {
  return {
    plugins: {
      legend: { display: true, position: "bottom" as const },
      title: props.title
        ? {
            display: true,
            text: props.title,
            font: { size: 14, weight: 600 },
          }
        : { display: false },
    },
  };
}

/** Cartesian scales (x/y labels) are present on line and bar only. */
function cartesianScales(props: ChartProps) {
  return {
    x: {
      title: props.xLabel ? { display: true, text: props.xLabel } : undefined,
    },
    y: {
      title: props.yLabel ? { display: true, text: props.yLabel } : undefined,
      beginAtZero: false,
    },
  };
}

export function toLineOptions(props: ChartProps): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    ...legendAndTitle(props),
    scales: cartesianScales(props),
  };
}

export function toBarOptions(props: ChartProps): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    ...legendAndTitle(props),
    scales: {
      ...cartesianScales(props),
      y: { ...cartesianScales(props).y, beginAtZero: true },
    },
  };
}

export function toPieOptions(props: ChartProps): ChartOptions<"pie"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    ...legendAndTitle(props),
  };
}

export function toDoughnutOptions(
  props: ChartProps,
): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    ...legendAndTitle(props),
  };
}
