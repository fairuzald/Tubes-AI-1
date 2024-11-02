import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";

export interface SearchDto {
  states: MagicCube[];
  finalStateValue: number;
  duration: number;
  iterationCount: number;
  plots: Plot<number, number>[];
}
