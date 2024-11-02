export const convertToCSV = (matrices: number[][][][]) => {
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

  return csvContent;
};

export const renderStateCSV = (text: string, size:number): number[][][][] => {
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
