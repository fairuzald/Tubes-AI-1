import { SearchDto } from "./SearchDto";
import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";

export class SimulatedAnnealing extends LocalSearch {
  // Simulated annealing specific attributes
  private minimumTemperature: number;
  private temperatureFunction;
  private staticProbabilityValue: number | null;

  // Current state
  private currentState: MagicCube;

  // Plot result
  private probabilityPlot: Plot<number, number>;

  // Constructor
  constructor(
    initialCube: MagicCube,
    temperatureFunction: (t: number) => number,
    minimumTemperature: number = 0,
    staticProbabilityValue: number | null = null
  ) {
    super(initialCube);
    this.temperatureFunction = temperatureFunction;
    this.minimumTemperature = minimumTemperature;
    this.staticProbabilityValue = staticProbabilityValue;
    this.currentState = initialCube;
    this.probabilityPlot = {
      labelX: "Iterasi",
      labelY: "e^(dE/T)",
      data: [],
    };
  }

  // Solver
  public solve(): void {
    this.startTimer();

    let t = 1;

    while (true) {
      let temperature = this.temperatureFunction(t);

      // Stop
      if (temperature < this.minimumTemperature) break;

      const currentStateValue = this.currentState.calculateObjectiveFunction();

      // Update plot data + history states
      this.addStateEntry(this.currentState);
      this.addIterationCount();
      this.addObjectiveFunctionPlotEntry(
        this.iterationCount,
        currentStateValue
      );

      const nextState = this.currentState.generateRandomSuccessor();
      const nextStateValue = nextState.calculateObjectiveFunction();

      const deltaE = nextStateValue - currentStateValue;
      if (deltaE > 0) {
        this.currentState = nextState;
      } else {
        const probability = this.staticProbabilityValue ?? Math.random();
        const edET = Math.exp(deltaE / temperature);
        if (edET > probability) {
          this.currentState = nextState;
        }

        // Update probability plot
        this.addProbabilityPlotEntry(this.getIterationCount(), edET);
      }

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

  static fastExponentialDecay(initialTemperature: number, alpha: number) {
    return (t: number) => initialTemperature * Math.pow(alpha, t * t);
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
