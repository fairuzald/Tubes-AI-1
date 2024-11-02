import { Plot } from "./Plot";

export interface SearchDto {
  states: number[][][][];
  finalStateValue: number;
  duration: number;
  iterationCount: number;
  plots: Plot<number, number>[];
}
