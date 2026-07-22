"use client";

/* ---------------------------------------------------------------------------
 * Centralized Chart.js v4 element registration.
 *
 * Registering only the elements we use keeps the bundle lean via
 * tree-shaking. Import this module for its side effect exactly once
 * (the Chart renderer does so). Each chart type uses a subset:
 *   - line / bar:  CategoryScale, LinearScale, PointElement, LineElement,
 *                  BarElement, Tooltip, Legend, Title
 *   - pie / doughnut: ArcElement, Tooltip, Legend, Title
 * ------------------------------------------------------------------------- */

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
);

export {};
