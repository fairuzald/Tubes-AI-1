import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { SearchDto } from "./SearchDto";

export interface RandomRestartSearchDto extends SearchDto {
  restartCount: number;
  iterationCounter: number[];
}

export class RandomRestartHC extends LocalSearch {
  private readonly maxRestarts: number;
  private restartCount = 0;
  private iterationCounter: number[] = [];
  private bestObjectiveFunction = -Infinity;

  constructor(private cube: MagicCube, maxRestarts: number) {
    super(cube);
    this.maxRestarts = maxRestarts;
  }

  // Random Restart Hill Climbing
  public solve(): void {
    this.startTimer();

    // Perform restarts until global optimum is found
    while (this.restartCount < this.maxRestarts) {
      if (this.performSingleRestart()) {
        return; // Found global optimum
      }
      this.restartCount++;
    }

    this.endTimer();
  }

  private performSingleRestart(): boolean {
    this.cube.initializeCube();
    let iterationNumber = 0;

    while (true) {
      const currentValue = this.cube.calculateObjectiveFunction();
      const bestNeighbor = this.cube.getBestSuccessor();
      const neighborValue = bestNeighbor.calculateObjectiveFunction();

      this.updateSearchState(iterationNumber, currentValue);

      // If no better neighbor found
      if (neighborValue <= currentValue) {
        // Update state
        this.handlePeak(currentValue, iterationNumber);
        return currentValue === 0; // Return true if global optimum found
      }

      // Move to best neighbor
      this.cube = bestNeighbor;
      iterationNumber++;
    }
  }

  private updateSearchState(
    iterationNumber: number,
    currentValue: number
  ): void {
    this.addStateEntry(this.cube);
    this.addObjectiveFunctionPlotEntry(iterationNumber, currentValue);
  }

  private handlePeak(currentValue: number, iterationNumber: number): void {
    if (currentValue > this.bestObjectiveFunction) {
      this.bestObjectiveFunction = currentValue;
    }
    this.iterationCounter.push(iterationNumber);
  }

  public toSearchDto(): RandomRestartSearchDto {
    return {
      duration: this.getDuration(),
      finalStateValue: this.bestObjectiveFunction,
      iterationCount: this.calculateTotalIterations(),
      states: this.getStates(),
      restartCount: this.restartCount,
      iterationCounter: this.iterationCounter,
      plots: [this.getObjectiveFunctionPlot()],
    };
  }

  private calculateTotalIterations(): number {
    return this.iterationCounter.reduce((sum, count) => sum + count, 0);
  }
}
