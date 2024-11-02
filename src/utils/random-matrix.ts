const generateRandomMatrix = (): number[][][] => {
  // Create an array of numbers from 1 to 125
  const numbers: number[] = Array.from({ length: 125 }, (_, i) => i + 1);

  // Fisher-Yates shuffle algorithm
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  const matrix: number[][][] = [];
  let index = 0;

  // Fill the 5x5x5 matrix with shuffled numbers
  for (let z = 0; z < 5; z++) {
    const plane: number[][] = [];
    for (let y = 0; y < 5; y++) {
      const row: number[] = [];
      for (let x = 0; x < 5; x++) {
        row.push(numbers[index]);
        index++;
      }
      plane.push(row);
    }
    matrix.push(plane);
  }

  return matrix;
};

export { generateRandomMatrix };
