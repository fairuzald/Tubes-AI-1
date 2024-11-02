// Position type for cube coordinates
type Position = [number, number, number];

// MagicCube class for representing the cube and its basic operations
export class MagicCube {
  private cube: number[][][];
  private m: number;

  constructor() {
    this.m = 5;
    this.cube = [];
    this.initializeCube();
  }


  public getElement(pos: Position)
  {
    const [i, j, k] = pos;
    return this.cube[i][j][k];
  }

  public setElement(pos: Position, val: number)
  {
    const [i, j, k] = pos;
    this.cube[i][j][k] = val;
  }

  private initializeCube(): void {

    // Create a list of numbers from 1 to m^3
    const numbers = Array.from(
      { length: Math.pow(this.m, 3) },
      (_, i) => i + 1
    );

    // Shuffle the numbers
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Initialize 3D array
    this.cube = Array(this.m)
      .fill(null)
      .map(() =>
        Array(this.m)
          .fill(null)
          .map(() => Array(this.m).fill(null))
      );

    // Fill the cube with shuffled numbers
    let index = 0;
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.m; j++) {
        for (let k = 0; k < this.m; k++) {
          this.cube[i][j][k] = numbers[index++];
        }
      }
    }
  }

  public swap(pos1: Position, pos2: Position): void {
    const [i1, j1, k1] = pos1;
    const [i2, j2, k2] = pos2;
    const temp = this.cube[i1][j1][k1];
    this.cube[i1][j1][k1] = this.cube[i2][j2][k2];
    this.cube[i2][j2][k2] = temp;
  }

  public getAllLines(): number[][] {
    const lines: number[][] = [];

    // Rows
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.m; j++) {
        const row = Array(this.m)
          .fill(0)
          .map((_, k) => this.cube[i][j][k]);
        lines.push(row);
      }
    }

    // Columns
    for (let i = 0; i < this.m; i++) {
      for (let k = 0; k < this.m; k++) {
        const column = Array(this.m)
          .fill(0)
          .map((_, j) => this.cube[i][j][k]);
        lines.push(column);
      }
    }

    // Pillars
    for (let j = 0; j < this.m; j++) {
      for (let k = 0; k < this.m; k++) {
        const pillar = Array(this.m)
          .fill(0)
          .map((_, i) => this.cube[i][j][k]);
        lines.push(pillar);
      }
    }

    // Space diagonals
    const spaceDiagonal1 = Array(this.m)
      .fill(0)
      .map((_, i) => this.cube[i][i][i]);
    const spaceDiagonal2 = Array(this.m)
      .fill(0)
      .map((_, i) => this.cube[i][i][this.m - 1 - i]);
    const spaceDiagonal3 = Array(this.m)
      .fill(0)
      .map((_, i) => this.cube[i][this.m - 1 - i][i]);
    const spaceDiagonal4 = Array(this.m)
      .fill(0)
      .map((_, i) => this.cube[this.m - 1 - i][i][i]);
    lines.push(spaceDiagonal1, spaceDiagonal2, spaceDiagonal3, spaceDiagonal4);

    // Plane diagonals
    // Frontal planes (yz planes)
    for (let i = 0; i < this.m; i++) {
      const diagonal1 = Array(this.m)
        .fill(0)
        .map((_, j) => this.cube[i][j][j]);
      const diagonal2 = Array(this.m)
        .fill(0)
        .map((_, j) => this.cube[i][j][this.m - 1 - j]);
      lines.push(diagonal1, diagonal2);
    }

    // Sagittal planes (xz planes)
    for (let j = 0; j < this.m; j++) {
      const diagonal3 = Array(this.m)
        .fill(0)
        .map((_, i) => this.cube[i][j][i]);
      const diagonal4 = Array(this.m)
        .fill(0)
        .map((_, i) => this.cube[i][j][this.m - 1 - i]);
      lines.push(diagonal3, diagonal4);
    }

    // Horizontal planes (xy planes)
    for (let k = 0; k < this.m; k++) {
      const diagonal5 = Array(this.m)
        .fill(0)
        .map((_, i) => this.cube[i][i][k]);
      const diagonal6 = Array(this.m)
        .fill(0)
        .map((_, i) => this.cube[i][this.m - 1 - i][k]);
      lines.push(diagonal5, diagonal6);
    }

    return lines;
  }

  public calculateObjectiveFunction(): number {
    const magicNumber = (this.m * (Math.pow(this.m, 3) + 1)) / 2;
    let totalDeviation = 0;

    const allLines = this.getAllLines();
    for (const line of allLines) {
      const lineSum = line.reduce((a, b) => a + b, 0);
      totalDeviation += lineSum === magicNumber ? 0 : -1;
    }

    return totalDeviation;
  }

  public getAllPositions(): Position[] {
    const positions: Position[] = [];
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.m; j++) {
        for (let k = 0; k < this.m; k++) {
          positions.push([i, j, k]);
        }
      }
    }
    return positions;
  }

  public clone(): MagicCube {
    const newCube = new MagicCube();
    newCube.cube = JSON.parse(JSON.stringify(this.cube));
    return newCube;
  }

  public generateAllSuccessors(): MagicCube[] {
    const successors: MagicCube[] = [];
    const positions = this.getAllPositions();

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const newCube = this.clone();
        newCube.swap(positions[i], positions[j]);
        successors.push(newCube);
      }
    }

    return successors;
  }

  public getBestSuccessor(): MagicCube {
    const successors = this.generateAllSuccessors();
    let bestSuccessor = successors[0];
    let bestValue = bestSuccessor.calculateObjectiveFunction();

    for (const successor of successors) {
      const value = successor.calculateObjectiveFunction();
      if (value > bestValue) {
        bestSuccessor = successor;
        bestValue = value;
      }
    }

    return bestSuccessor;
  }

  public generateRandomSuccessor(): MagicCube {
    const positions = this.getAllPositions();
    const pos1 = positions[Math.floor(Math.random() * positions.length)];
    let pos2;
    do {
      pos2 = positions[Math.floor(Math.random() * positions.length)];
    } while (pos1 === pos2);

    const newCube = this.clone();
    newCube.swap(pos1, pos2);
    return newCube;
  }
}
