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
      <Input
        type="number"
        value={maxRestart}
        onChange={(e) => onMaxRestartChange(parseInt(e.target.value))}
        placeholder="Max Restarts"
      />
    )}
    {selectedAlgorithm === ALGORITHMS.SIDEWAYS_MOVE && (
      <Input
        type="number"
        value={maxSideways}
        onChange={(e) => onMaxSidewaysChange(parseInt(e.target.value))}
        placeholder="Max Sideways"
      />
    )}
    {selectedAlgorithm === ALGORITHMS.STOCHASTIC && (
      <Input
        type="number"
        value={nmax}
        onChange={(e) => onNmaxChange(parseInt(e.target.value))}
        placeholder="nmax"
      />
    )}
    {selectedAlgorithm === ALGORITHMS.GENETIC && (
      <>
        <Input
          type="number"
          value={iterations}
          onChange={(e) => onIterationsChange(parseInt(e.target.value))}
          placeholder="Iterations"
        />
        <Input
          type="number"
          value={populationCount}
          onChange={(e) => onPopulationCountChange(parseInt(e.target.value))}
          placeholder="Population Count"
        />
      </>
    )}
    <Button disabled={disabled} onClick={onSubmit}>
      Load
    </Button>
  </div>
);
