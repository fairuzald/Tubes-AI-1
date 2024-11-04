import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ALGORITHMS, AlgorithmType } from "@/constant/data";
import { Button } from "../ui/button";

interface AlgorithmSelectorProps {
  onAlgorithmChange: (algorithm: AlgorithmType) => void;
  maxRestart: number;
  onMaxRestartChange: (value: number) => void;
  maxSideways: number;
  onMaxSidewaysChange: (value: number) => void;
  nmax: number;
  onNmaxChange: (value: number) => void;
  selectedAlgorithm: AlgorithmType | null;
  disabled?: boolean;
  iterations?: number;
  onIterationsChange: (value: number) => void;
  populationCount: number;
  onPopulationCountChange: (value: number) => void;
  onSubmit: () => void;
}

export const AlgorithmSelector = ({
  onAlgorithmChange,
  maxRestart,
  onMaxRestartChange,
  maxSideways,
  onMaxSidewaysChange,
  nmax,
  disabled,
  onSubmit,
  onNmaxChange,
  selectedAlgorithm,
  populationCount,
  onPopulationCountChange,
  iterations,
  onIterationsChange,
}: AlgorithmSelectorProps) => (
  <div className="flex flex-col items-center gap-2">
    <p className="font-bold">Select Algorithm</p>
    <Select
      onValueChange={(value) => onAlgorithmChange(value as AlgorithmType)}
      defaultValue={""}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Algorithm" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Algorithms</SelectLabel>
          {Object.values(ALGORITHMS).map((algo) => (
            <SelectItem key={algo} value={algo}>
              {algo}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>

    {selectedAlgorithm === ALGORITHMS.RANDOM_RESTART && (
      <div className="w-full mt-1">
        <label className="text-sm ml-2" htmlFor="maxRestart" id="maxRestartLabel">
          Max Restarts
        </label>
        <Input
          id="maxRestart"
          type="number"
          value={maxRestart}
          onChange={(e) => onMaxRestartChange(parseInt(e.target.value))}
          placeholder="Max Restarts"
          aria-labelledby="maxRestartLabel"
        />
      </div>
    )}

    {selectedAlgorithm === ALGORITHMS.SIDEWAYS_MOVE && (
      <div className="w-full mt-1">
        <label className="text-sm ml-2" htmlFor="maxSideways" id="maxSidewaysLabel">
          Max Sideways
        </label>
        <Input
          id="maxSideways"
          type="number"
          value={maxSideways}
          onChange={(e) => onMaxSidewaysChange(parseInt(e.target.value))}
          placeholder="Max Sideways"
          aria-labelledby="maxSidewaysLabel"
        />
      </div>
    )}

    {selectedAlgorithm === ALGORITHMS.STOCHASTIC && (
      <div className="w-full mt-1">
        <label className="text-sm ml-2" htmlFor="nmax" id="nmaxLabel">
          Maximum Iterations
        </label>
        <Input
          id="nmax"
          type="number"
          max={5000}
          value={nmax}
          onChange={(e) => onNmaxChange(parseInt(e.target.value))}
          placeholder="nmax"
          aria-labelledby="nmaxLabel"
        />
      </div>
    )}

    {selectedAlgorithm === ALGORITHMS.GENETIC && (
      <div className="w-full mt-1">
        <label className="text-sm ml-2" htmlFor="iterations" id="iterationsLabel">
          Iterations
        </label>
        <Input
          id="iterations"
          type="number"
          value={iterations}
          onChange={(e) => onIterationsChange(parseInt(e.target.value))}
          placeholder="Iterations"
          aria-labelledby="iterationsLabel"
        />
        <label className="text-sm ml-2" htmlFor="populationCount" id="populationCountLabel">
          Population Count
        </label>
        <Input
          id="populationCount"
          type="number"
          value={populationCount}
          onChange={(e) => onPopulationCountChange(parseInt(e.target.value))}
          placeholder="Population Count"
          aria-labelledby="populationCountLabel"
        />
      </div>
    )}

    <Button disabled={disabled} onClick={onSubmit}>
      Solve
    </Button>
  </div>
);
