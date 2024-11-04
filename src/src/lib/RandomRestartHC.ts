import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";
import { SearchDto } from "./SearchDto";

export interface RandomRestartSearchDto extends SearchDto {
  restartCount: number;
  iterationCounter: number[];
  plots: Plot<number, number>[];
}

export class RandomRestartHC extends LocalSearch {
  private readonly maxRestarts: number;
  private restartCount = 0;
  private iterationCounter: number[] = [];
  private bestObjectiveFunction = -Infinity;
  private plots: Plot<number, number>[] = [];
  private currentPlotData: { x: number; y: number }[] = [];

  constructor(private cube: MagicCube, maxRestarts: number) {
    super(cube);
    this.maxRestarts = maxRestarts;
  }

  public solve(): void {
    this.startTimer();
    this.plots = []; // Reset plots at the start

    while (this.restartCount < this.maxRestarts) {
      // Initialize new plot data for this restart
      this.currentPlotData = [];

      if (this.performSingleRestart()) {
        break; // Found global optimum
      }

      // After each restart, create a plot entry
      this.plots.push({
        labelX: `Iteration Number, Number Restart ${this.restartCount + 1}`,
        labelY: "Objective Function Value",
        data: [...this.currentPlotData],
      });

      this.restartCount++;
    }

    this.endTimer();
  }

  private performSingleRestart(): boolean {
    this.cube = new MagicCube();
    let iterationNumber = 0;

    while (true) {
      const currentValue = this.cube.calculateObjectiveFunction();
      const bestNeighbor = this.cube.getBestSuccessor();
      const neighborValue = bestNeighbor.calculateObjectiveFunction();

      // Record current state for plotting
      this.updateSearchState(iterationNumber, currentValue);

      if (neighborValue <= currentValue) {
        this.handlePeak(currentValue, iterationNumber);
        return currentValue === 0; // Return true if global optimum found
      }

      this.cube = bestNeighbor;
      iterationNumber++;
    }
  }

  private updateSearchState(
    iterationNumber: number,
    currentValue: number
  ): void {
    this.addStateEntry(this.cube);

    // Add data point for current iteration
    this.currentPlotData.push({
      x: iterationNumber,
      y: currentValue,
    });
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
      plots: this.plots, // Return all plots for all restarts
    };
  }

  public getPlots(): Plot<number, number>[] {
    return this.plots;
  }

  private calculateTotalIterations(): number {
    return this.iterationCounter.reduce((sum, count) => sum + count, 0);
  }
}
