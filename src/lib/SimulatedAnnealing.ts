import { LocalSearch } from "./LocalSearch";

export class SimulatedAnnealing extends LocalSearch {
  // Search state
  private cube: MagicCube;

  // Plot result
  private probabilityPlot: Plot<number, number>;

  // Constructor
  constructor(cube: MagicCube) {
    super(cube);

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
  ): void {
    this.startTimer();

    let currentState = this.cube;
    let t = 1;
    let temperature = schedule(t);

    while (temperature > 0) {
      const currentStateValue = currentState.calculateObjectiveFunction();
      const nextState = this.cube.generateRandomSuccessor();
      const nextStateValue = nextState.calculateObjectiveFunction();

      const deltaE = nextStateValue - currentStateValue;

      const probability = staticProbabilityValue ?? Math.random();
      const edET = Math.exp(deltaE / temperature);
      if (deltaE > 0 || probability < edET) {
        currentState = nextState;
      }

      // Update plot data + history states
      this.addStateEntry(currentState);
      this.addIterationCount();
      this.addObjectiveFunctionPlotEntry(
        this.iterationCount,
        currentStateValue
      );
      this.addProbabilityPlotEntry(t, edET);

      // Update search state
      t++;
      temperature = schedule(t);
    }

    this.endTimer();
  }

  // Get plot data
  public getProbabilityPlot(): Plot<number, number> {
    return this.probabilityPlot;
  }

  // Add plot entry
  private addProbabilityPlotEntry(x: number, y: number) {
    this.probabilityPlot.data.push({ x, y });
  }
}
