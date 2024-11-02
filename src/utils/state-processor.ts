import { Plot } from "@/lib/Plot";

// Convert matrices and plots to CSV format
export const convertToCSV = (
  matrices: number[][][][],
  plots: Plot<number, number>[]
): string => {
  let csvContent = "";

  // For each matrix
  matrices.forEach((matrix, index) => {
    const values: number[] = [];

    // Flatten the 3D matrix into a 1D array
    for (let z = 0; z < matrix.length; z++) {
      for (let y = 0; y < matrix[z].length; y++) {
        for (let x = 0; x < matrix[z][y].length; x++) {
          values.push(matrix[z][y][x]);
        }
      }
    }

    // Add the values as a single line
    csvContent += values.join(",");

    // Add newline if it's not the last matrix
    if (index < matrices.length - 1) {
      csvContent += "\n";
    }
  });

  csvContent += "\nSPLITTER\n";

  // Add the plot data
  plots.forEach((plot, index) => {
    // Add plot headers
    csvContent += `${plot.labelX},${plot.labelY}\n`;

    // Add plot points
    plot.data.forEach((point) => {
      csvContent += `${point.x},${point.y}\n`;
    });

    // Add separator between plots if not the last plot
    if (index < plots.length - 1) {
      csvContent += "\n";
    }
  });

  return csvContent;
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

// Parse CSV content back into plots
export const parseCSVToPlots = (csvContent: string): Plot<number, number>[] => {
  const [, plotSection] = csvContent.split("SPLITTER");
  if (!plotSection) return [];

  const lines = plotSection.trim().split("\n");
  const plots: Plot<number, number>[] = [];

  let currentPlot: Plot<number, number> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [x, y] = line.split(",");

    // If either value is NaN, this is a header line with labels
    if (isNaN(Number(x)) || isNaN(Number(y))) {
      // Start a new plot
      if (currentPlot) {
        plots.push(currentPlot);
      }
      currentPlot = {
        labelX: x,
        labelY: y,
        data: [],
      };
    } else {
      // Add point to current plot
      if (currentPlot) {
        currentPlot.data.push({
          x: Number(x),
          y: Number(y),
        });
      }
    }
  }

  // Add the last plot
  if (currentPlot) {
    plots.push(currentPlot);
  }

  return plots;
};

// Parse entire CSV file content
export const parseCSV = (
  csvContent: string,
  size: number
): {
  matrices: number[][][][];
  plots: Plot<number, number>[];
} => {
  const [matricesSection, plotsSection] = csvContent.split("SPLITTER");

  // Parse matrices
  const matrices = renderStateCSV(matricesSection, size);

  // Parse plots if they exist
  const plots = plotsSection ? parseCSVToPlots(csvContent) : [];

  return { matrices, plots };
};

// Download CSV file
export const downloadCSV = (
  matrices?: number[][][][],
  plots?: Plot<number, number>[]
) => {
  if (!matrices || !plots) {
    return;
  }
  const csvContent = convertToCSV(matrices, plots);

  // Prompt user for filename
  let filename =
    window.prompt("Enter a filename for your CSV:", "matrix_coordinates") ||
    "matrix_coordinates"; // Use default if null or empty

  // Add .csv extension if not present
  if (!filename.toLowerCase().endsWith(".csv")) {
    filename += ".csv";
  }

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Utility function to create an empty 3D matrix of given size
export const createEmptyMatrix = (size: number): number[][][] => {
  const matrix: number[][][] = [];
  for (let z = 0; z < size; z++) {
    const plane: number[][] = [];
    for (let y = 0; y < size; y++) {
      const row: number[] = [];
      for (let x = 0; x < size; x++) {
        row.push(0);
      }
      plane.push(row);
    }
    matrix.push(plane);
  }
  return matrix;
};

// Utility function to validate matrix dimensions
export const validateMatrix = (matrix: number[][][], size: number): boolean => {
  if (matrix.length !== size) return false;

  for (const plane of matrix) {
    if (plane.length !== size) return false;
    for (const row of plane) {
      if (row.length !== size) return false;
    }
  }

  return true;
};
