import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { SearchDto } from "./SearchDto";

// Create a new interface extending SearchDto
interface RandomRestartSearchDto extends SearchDto {
  restartCount: number;
  iterationCounter: number[];
}

export class RandomRestartHC extends LocalSearch {
  // Search state
  private cube: MagicCube;
  private restartCount: number;
  private maxRestarts: number;
  private iterationCounter: number[]; // number iteration each restart

  // Constructor
  constructor(cube: MagicCube, maxRestarts: number) {
    super(cube);
    this.cube = cube;
    this.restartCount = 0;
    this.iterationCounter = [];
    this.maxRestarts = maxRestarts;
  }

  public solve() {
    this.startTimer();

    do {
      // Initialize a new random cube for each restart
      this.cube.initializeCube();

      // to detect peak
      let isLocalOptimum = false;
      let iterationNumber = 0;

      // Ascent Logic
      while (!isLocalOptimum) {
        // Get the best neighbor
        const bestNeighbor = this.cube.getBestSuccessor();

        // Calculate objective functions
        const currentValue = this.cube.calculateObjectiveFunction();
        const neighborValue = bestNeighbor.calculateObjectiveFunction();

        this.addStateEntry(this.cube);
        this.addObjectiveFunctionPlotEntry(iterationNumber, currentValue);

        // Goal state
        if (neighborValue <= currentValue) {
          // Global optimum
          if (currentValue === 0) {
            return;
          }
          // Stuck local optimum
          else {
            isLocalOptimum = true;
          }
          this.iterationCounter.push(iterationNumber);
        }
        // Move to neighbor for better value
        else {
          iterationNumber++;
          this.cube = bestNeighbor;
        }
      }

      this.restartCount++;
    } while (this.restartCount < this.maxRestarts);

    this.endTimer();
  }

  public toSearchDto(): RandomRestartSearchDto {
    return {
      duration: this.getDuration(),
      finalStateValue: this.getFinalObjectiveFunction(),
      iterationCount: this.iterationCounter.reduce((sum, count) => sum + count, 0),
      states: this.getStates(),
      restartCount: this.restartCount,
      iterationCounter: this.iterationCounter,
      plots: [this.getObjectiveFunctionPlot()]
    };
  }
}
