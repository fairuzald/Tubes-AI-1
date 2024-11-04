import { Plot } from "@/lib/Plot";

interface StateMetrics {
  finalValue?: number | null;
  duration?: number | null;
  iterationCount?: number;
  iterationCounter?: number[];
  populationCount?: number;
  restartCount?: number;
  stuckFrequency?: number;
}

type MetricKey = keyof StateMetrics;

export const convertToCSV = (
  matrices: number[][][][],
  plots: Plot<number, number>[],
  metrics: StateMetrics
): string[] => {
  const chunks: string[] = [];
  const CHUNK_SIZE = 50;

  // Process matrices in chunks
  for (let i = 0; i < matrices.length; i += CHUNK_SIZE) {
    const chunkMatrices = matrices.slice(i, i + CHUNK_SIZE);
    let chunkContent = "";

    chunkMatrices.forEach((matrix, index) => {
      const values: number[] = [];

      for (let z = 0; z < matrix.length; z++) {
        for (let y = 0; y < matrix[z].length; y++) {
          for (let x = 0; x < matrix[z][y].length; x++) {
            values.push(matrix[z][y][x]);
          }
        }
      }

      chunkContent += values.join(",");
      if (index < chunkMatrices.length - 1) {
        chunkContent += "\n";
      }
    });

    chunks.push(chunkContent);
  }

  // Add plots data
  let plotChunk = "SPLITTER\n";
  plots.forEach((plot, index) => {
    plotChunk += `${plot.labelX},${plot.labelY}\n`;
    plot.data.forEach((point) => {
      plotChunk += `${point.x},${point.y}\n`;
    });
    if (index < plots.length - 1) {
      plotChunk += "\n";
    }
  });
  chunks.push(plotChunk);

  // Add metrics data as the final chunk
  let metricsChunk = "METRICS\n";
  Object.entries(metrics).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        metricsChunk += `${key}:${value.join(";")}\n`;
      } else {
        metricsChunk += `${key}:${value}\n`;
      }
    }
  });
  chunks.push(metricsChunk);

  return chunks;
};

// Type guard to check if a key is array-based metric
const isArrayMetric = (key: string): key is 'iterationCounter' => {
  return key === 'iterationCounter';
};
interface StateMetrics {
  finalValue?: number | null;
  duration?: number | null;
  iterationCount?: number;
  iterationCounter?: number[];
  populationCount?: number;
  restartCount?: number;
  stuckFrequency?: number;
}

// Type guard to check if a key is a valid metric key
const isValidMetricKey = (key: string): key is MetricKey => {
  return [
    'finalValue',
    'duration',
    'iterationCount',
    'iterationCounter',
    'populationCount',
    'restartCount',
    'stuckFrequency'
  ].includes(key);
};


// Updated download function
export const downloadCSV = (
  matrices: number[][][][],
  plots: Plot<number, number>[],
  finalValue?: number | null,
  duration?: number | null,
  iterationCount?: number,
  iterationCounter?: number[],
  populationCount?: number,
  restartCount?: number,
  stuckFrequency?: number
) => {
  const metrics: StateMetrics = {
    finalValue,
    duration,
    iterationCount,
    iterationCounter,
    populationCount,
    restartCount,
    stuckFrequency,
  };

  const chunks = convertToCSV(matrices, plots, metrics);

  let filename =
    window.prompt("Enter a filename for your CSV:", "magic_cube_state") ||
    "magic_cube_state";
  if (!filename.toLowerCase().endsWith(".csv")) {
    filename += ".csv";
  }

  const blob = new Blob(chunks, { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};


// Parse CSV content back into matrices
export const renderStateCSV = (text: string, size: number): number[][][][] => {
  const lines = text.split("\n").filter((line) => line.trim() !== "");

  const matrices: number[][][][] = [];

  // Process each line as a separate matrix
  lines.forEach((line) => {
    const values = line.split(",").map(Number);

    const matrix: number[][][] = [];

    let valueIndex = 0;
    for (let z = 0; z < size; z++) {
      const plane: number[][] = [];
      for (let y = 0; y < size; y++) {
        const row: number[] = [];
        for (let x = 0; x < size; x++) {
          row.push(values[valueIndex++]);
        }
        plane.push(row);
      }
      matrix.push(plane);
    }

    matrices.push(matrix);
  });


  return matrices;
};


export const parseCSV = (
  csvContent: string,
  size: number
): {
  matrices: number[][][][];
  plots: Plot<number, number>[];
  metrics: StateMetrics;
} => {
  // Split the content first by SPLITTER, then find METRICS in the second part if it exists
  const [matricesPart, restPart = ''] = csvContent.split('SPLITTER');
  const [plotsPart, metricsPart = ''] = restPart.split('METRICS');

  // Parse matrices
  const matrices = renderStateCSV(matricesPart.trim(), size);

  // Parse plots - only pass the clean plots section
  const plots = plotsPart ? parseCSVToPlots(plotsPart.trim()) : [];

  // Parse metrics
  const metrics: StateMetrics = {};
  if (metricsPart) {
    const metricLines = metricsPart.trim().split("\n");
    metricLines.forEach((line) => {
      const [key, value] = line.split(":");
      if (key && value && isValidMetricKey(key)) {
        if (isArrayMetric(key)) {
          metrics[key] = value.split(";").map(Number);
        } else {
          const numericValue = Number(value);
          if (!isNaN(numericValue)) {
            metrics[key] = numericValue;
          }
        }
      }
    });
  }

  return { matrices, plots, metrics };
};

// Updated parseCSVToPlots to be more strict about plot data format
export const parseCSVToPlots = (plotSection: string): Plot<number, number>[] => {
  const lines = plotSection.split("\n");
  const plots: Plot<number, number>[] = [];
  let currentPlot: Plot<number, number> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [x, y] = line.split(",").map(val => val.trim());
    
    // Skip any lines that might be part of metrics or other sections
    if (!x || !y || x.includes(':') || y.includes(':')) continue;

    // If either value is NaN, this is a header line with labels
    if (isNaN(Number(x)) || isNaN(Number(y))) {
      // Only create a new plot if both labels are present and don't contain 'METRICS'
      if (!x.includes('METRICS') && !y.includes('METRICS')) {
        if (currentPlot) {
          plots.push(currentPlot);
        }
        currentPlot = {
          labelX: x,
          labelY: y,
          data: [],
        };
      }
    } else {
      // Add point to current plot only if we have a valid plot context
      if (currentPlot) {
        currentPlot.data.push({
          x: Number(x),
          y: Number(y),
        });
      }
    }
  }

  // Add the last plot if it's valid
  if (currentPlot && currentPlot.data.length > 0) {
    plots.push(currentPlot);
  }

  return plots;
};