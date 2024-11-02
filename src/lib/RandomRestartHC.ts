import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";

export class RandomRestartHC extends LocalSearch {
  // Search state
  private cube: MagicCube;
  private restartCount: number;
  private iterationCount: number[]; // number iteration each restart

  // Constructor
  constructor(cube: MagicCube) {
    super();
    this.cube = cube;
    this.restartCount = 0;
    this.iterationCount = [];
  }
  public solve(maxRestarts: number) {
    do {
      // Initialize a new random cube for each restart
      this.cube.initializeCube();

      //   to detect peak
      let isLocalOptimum = false;

      //   Ascent Logic
      while (!isLocalOptimum) {
        let iterationNumber = 0;
        // Get the best neighbor
        const bestNeighbor = this.cube.getBestSuccessor();

        // Calculate objective functions
        const currentValue = this.cube.calculateObjectiveFunction();
        const neighborValue = bestNeighbor.calculateObjectiveFunction();

        // Goal state
        if (neighborValue <= currentValue) {
          // Global optimum
          if (currentValue === 0) {
            return;
          }
          //   Stuck local optimum
          else {
            isLocalOptimum = true;
          }
          this.iterationCount.push(iterationNumber);
        }
        // Move to neighbor for better value
        else {
          iterationNumber++;
          this.cube = bestNeighbor;
        }
      }

      this.restartCount++;
    } while (this.restartCount <= maxRestarts);
  }
}
