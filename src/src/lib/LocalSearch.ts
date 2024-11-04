import { MagicCube } from "./MagicCube";
import { Plot, PlotData } from "./Plot";

// LocalSearch class for handling search operations
export abstract class LocalSearch {
  protected states: MagicCube[];
  protected objectiveFunctionPlot: Plot<number, number>;
  protected iterationCount: number;
  private startTime: number;
  private endTime: number;
  protected duration: number;

  constructor(initialState: MagicCube) {
    this.states = [initialState.clone()];
    this.objectiveFunctionPlot = {
      labelX: "Iteration",
      labelY: "Objective Function",
      data: [],
    };
    this.iterationCount = 0;
    this.startTime = 0;
    this.endTime = 0;
    this.duration = 0;
  }

  public getInitialState(): MagicCube {
    return this.states[0];
  }

  public getFinalState(): MagicCube {
    return this.states[this.states.length - 1];
  }

  public getFinalObjectiveFunction(): number {
    return this.getFinalState().calculateObjectiveFunction();
  }

  public getStates(): number[][][][] {
    const matrices = this.states.map((state) => state.getCube());
    return matrices;
  }

  public getDuration() {
    return this.duration;
  }

  public getIterationCount() {
    return this.iterationCount;
  }

  public getObjectiveFunctionPlot() {
    return this.objectiveFunctionPlot;
  }

  /**
   * Get the aggregated objective function plot data
   * Groupped by monotonicity of the objective function over the iterations
   * @param plotData Plot<number, number>[]
   * @param n number (minimum number of iterations to take for the middle values)
   * @returns Plot<number, number>[]
   */
  protected aggregatePlotData(
    plotData: PlotData<number, number>[],
    n: number
  ): PlotData<number, number>[] {
    type Range = [number, number];

    if (plotData.length < 2) {
      return plotData.length ? [{ x: 0, y: 0 }] : [];
    }

    // Group by monotonicity
    const ranges: Range[] = [];
    let start = 0;
    let currentTrend: "increasing" | "decreasing" | "constant" =
      plotData[1] > plotData[0]
        ? "increasing"
        : plotData[1] < plotData[0]
        ? "decreasing"
        : "constant";

    for (let i = 1; i < plotData.length; i++) {
      let newTrend: typeof currentTrend;

      if (i < plotData.length - 1) {
        if (plotData[i + 1] > plotData[i]) {
          newTrend = "increasing";
        } else if (plotData[i + 1] < plotData[i]) {
          newTrend = "decreasing";
        } else {
          newTrend = "constant";
        }

        if (newTrend !== currentTrend) {
          ranges.push([start, i]);
          start = i;
          currentTrend = newTrend;
        }
      } else {
        // Handle the last range
        ranges.push([start, i]);
      }
    }

    // For each range, take the first, &middle values and last value (if final range)
    const aggregatedPlotData: PlotData<number, number>[] = [];
    for (let rIdx = 0; rIdx < ranges.length; rIdx++) {
      const [startIdx, endIdx] = ranges[rIdx];

      aggregatedPlotData.push({
        x: plotData[startIdx].x,
        y: plotData[startIdx].y,
      });

      if (rIdx == ranges.length - 1) {
        aggregatedPlotData.push({
          x: plotData[endIdx].x,
          y: plotData[endIdx].y,
        });
      }

      // Middle values
      // Take a minimum of n iterations for the middle values, or all if less than 10
      if (endIdx - startIdx - 1 < n) {
        // If less than n iterations, take all
        for (let i = startIdx + 1; i < endIdx; i++) {
          aggregatedPlotData.push({
            x: plotData[i].x,
            y: plotData[i].y,
          });
        }
      } else {
        const delta = Math.floor((endIdx - startIdx) / n);
        for (let i = startIdx + 1; i < endIdx; i += delta) {
          aggregatedPlotData.push({
            x: plotData[i].x,
            y: plotData[i].y,
          });
        }
      }
    }

    return aggregatedPlotData;
  }

  public getAggregatedObjectiveFunctionPlot(n: number): Plot<number, number> {
    const aggregatedData = this.aggregatePlotData(
      this.objectiveFunctionPlot.data,
      n
    );
    aggregatedData.sort((a, b) => a.x - b.x);

    console.log(this.objectiveFunctionPlot.data);

    return {
      labelX: this.objectiveFunctionPlot.labelX,
      labelY: this.objectiveFunctionPlot.labelY,
      data: aggregatedData,
    };
  }

  protected addStateEntry(state: MagicCube): void {
    this.states.push(state.clone());
  }

  protected addObjectiveFunctionPlotEntry(x: number, y: number): void {
    this.objectiveFunctionPlot.data.push({ x, y });
  }

  protected startTimer(): void {
    this.startTime = performance.now();
  }

  protected endTimer(): void {
    this.endTime = performance.now();
    this.duration = (this.endTime - this.startTime) / 1000;
  }

  protected addIterationCount() {
    this.iterationCount++;
  }
}
