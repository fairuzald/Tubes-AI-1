import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";

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
