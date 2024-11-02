import { SearchDto } from "./SearchDto";
import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";

export class SimulatedAnnealing extends LocalSearch {
  // Simulated annealing specific attributes
  private minimumTemperature: number;
  private temperatureFunction;
  private staticProbabilityValue: number | null;

  // Search state
  private cube: MagicCube;

  // Plot result
  private probabilityPlot: Plot<number, number>;

  // Constructor
  constructor(
    cube: MagicCube,
    temperatureFunction: (t: number) => number,
    minimumTemperature: number = 0,
    staticProbabilityValue: number | null = null
  ) {
    super(cube);
    this.temperatureFunction = temperatureFunction;
    this.minimumTemperature = minimumTemperature;
    this.staticProbabilityValue = staticProbabilityValue;
    this.cube = cube;
    this.probabilityPlot = {
      labelX: "Iterasi",
      labelY: "e^(dE/T)",
      data: [],
    };
  }

  // Solver
  public solve(): void {
    this.startTimer();

    let currentState = this.cube;
    let t = 1;
    let temperature = this.temperatureFunction(t);

    while (temperature > this.minimumTemperature) {
      console.log(temperature);
      const currentStateValue = currentState.calculateObjectiveFunction();
      const nextState = this.cube.generateRandomSuccessor();
      const nextStateValue = nextState.calculateObjectiveFunction();

      const deltaE = nextStateValue - currentStateValue;

      const probability = this.staticProbabilityValue ?? Math.random();
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
      temperature = this.temperatureFunction(t);
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

  // Convert to DTO
  public toSearchDto(): SearchDto {
    const result: SearchDto = {
      duration: this.getDuration(),
      iterationCount: this.getIterationCount(),
      finalStateValue: this.getFinalObjectiveFunction(),
      states: this.getStates(),
      plots: [this.getObjectiveFunctionPlot(), this.getProbabilityPlot()],
    };

    return result;
  }
}

export class TemperatureFactory {
  // T(t) = T0 * alpha^t
  static exponentialDecay(initialTemperature: number, alpha: number) {
    return (t: number) => initialTemperature * Math.pow(alpha, t);
  }

  // T(t) = T0 * (1 - t/tmax)
  static linearDecay(initialTemperature: number, tMax: number) {
    return (t: number) => initialTemperature * (1 - t / tMax);
  }

  // T(t) = T0/log(1 + t)
  static logarithmicDecay(initialTemperature: number) {
    return (t: number) => initialTemperature / Math.log(1 + t);
  }
}
