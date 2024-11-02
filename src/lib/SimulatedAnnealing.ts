class SimulatedAnnealing extends LocalSearch {
  // Search state
  private cube: MagicCube;

  // Plot result
  private probabilityPlot: Plot;

  // Constructor
  constructor(cube: MagicCube) {
    super();
    this.cube = cube;
    this.probabilityPlot = {
      labelX: "Iterasi",
      labelY: "e^(dE/T)",
      data: [],
    };
  }

  // Solver
  public solve(
    schedule: (t: number) => number,
    staticProbabilityValue: number | null = null
  ): MagicCube {
    let currentState = this.cube;
    let t = 1;
    let temperature = schedule(t);

    while (temperature > 0) {
      const nextState = this.cube.generateRandomSuccessor();
      const deltaE =
        nextState.calculateObjectiveFunction() -
        currentState.calculateObjectiveFunction();

      const probability = staticProbabilityValue ?? Math.random();
      const edET = Math.exp(deltaE / temperature);
      if (deltaE > 0 || probability < edET) {
        currentState = nextState;
      }

      t++;
      temperature = schedule(t);
      this.probabilityPlot.data.push({ x: t, y: edET });
    }

    return currentState;
  }

  // Get cube state
  public getCube(): MagicCube {
    return this.cube;
  }

  // Get plot data
  public getProbabilityPlot(): Plot {
    return this.probabilityPlot;
  }
}
