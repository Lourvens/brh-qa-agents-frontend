"use client";

/* ---------------------------------------------------------------------------
 * Chart renderer (thin dispatcher).
 *
 * Picks the right `react-chartjs-2` component for the requested type
 * and wires its data + options from the focused transform files.
 * The data and option transforms live in:
 *   - ./chart-data.ts
 *   - ./chart-options.ts
 *   - ./chart-palette.ts (used by chart-data)
 *
 * Element registration (CategoryScale, LinearScale, …) is the
 * side-effect import at the top so every consumer of this file gets
 * a working Chart.js without remembering to register.
 * ------------------------------------------------------------------------- */

import "../../_lib/chartjs-setup";

import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";

import {
  toBarData,
  toDoughnutData,
  toLineData,
  toPieData,
} from "./chart-data";
import {
  toBarOptions,
  toDoughnutOptions,
  toLineOptions,
  toPieOptions,
} from "./chart-options";

export type ChartKind = "line" | "bar" | "pie" | "doughnut";

export type ChartProps = {
  chartType: ChartKind;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  data: {
    labels: string[];
    datasets: { label: string; values: number[] }[];
  };
};

export function ChartRenderer(props: ChartProps) {
  // ``figure`` + ``figcaption`` give screen readers a labeled
  // container; the canvas itself carries ``aria-label`` from the
  // chart title (see below). The figcaption text is the prose
  // caption the agent supplied — operators reading aloud hear
  // title + caption.
  const figcaption = props.title || "Graphique";
  const figure = (
    <figure className="space-y-2">
      <div data-chart-kind={props.chartType} role="presentation">
        <ChartCanvas {...props} />
      </div>
      <figcaption className="text-xs text-muted-foreground text-center">
        {figcaption}
      </figcaption>
    </figure>
  );
  return figure;
}

function ChartCanvas(props: ChartProps) {
  switch (props.chartType) {
    case "line":
      return (
        <Line
          data={toLineData(props)}
          options={toLineOptions(props)}
          aria-label={props.title}
        />
      );
    case "bar":
      return (
        <Bar
          data={toBarData(props)}
          options={toBarOptions(props)}
          aria-label={props.title}
        />
      );
    case "pie":
      return (
        <Pie
          data={toPieData(props)}
          options={toPieOptions(props)}
          aria-label={props.title}
        />
      );
    case "doughnut":
      return (
        <Doughnut
          data={toDoughnutData(props)}
          options={toDoughnutOptions(props)}
          aria-label={props.title}
        />
      );
  }
}
