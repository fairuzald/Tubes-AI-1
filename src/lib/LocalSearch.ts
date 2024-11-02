interface LocalSearch {
  generateAllSuccessors(): MagicCube[];
  getBestSuccessor(): MagicCube;
  generateRandomSuccessor(): MagicCube;
}

// LocalSearch class for handling search operations
abstract class LocalSearch implements LocalSearch {
  private cube: MagicCube;

  constructor(cube: MagicCube) {
    this.cube = cube;
  }

  public generateAllSuccessors(): MagicCube[] {
    const successors: MagicCube[] = [];
    const positions = this.cube.getAllPositions();

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const newCube = this.cube.clone();
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
    const positions = this.cube.getAllPositions();
    const pos1 = positions[Math.floor(Math.random() * positions.length)];
    let pos2;
    do {
      pos2 = positions[Math.floor(Math.random() * positions.length)];
    } while (pos1 === pos2);

    const newCube = this.cube.clone();
    newCube.swap(pos1, pos2);
    return newCube;
  }
}
