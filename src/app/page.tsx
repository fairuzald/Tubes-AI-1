"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ALGORITHMS, AlgorithmType } from "@/constant/data";
import { downloadCSV, renderStateCSV } from "@/utils/state-processor";
import { CustomLineChart } from "@/components/CustomLineChart";
import Visualizer from "@/components/Visualizer";
import PlaybackControls from "@/components/PlaybackControlsProps";
import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";

interface Plot {
  data: Array<{ x: number; y: number }>;
  labelX: string;
  labelY: string;
}

interface State {
  selectedAlgorithm: AlgorithmType | null;
  isLoading: boolean;
  magicCubes: number[][][][] | null;
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number;
  fileData: File | null;
  plots: Plot[] | null;
  finalValue: number | null;
  duration: number;
}

// Initial state configuration
const initialState: State = {
  selectedAlgorithm: null,
  isLoading: false,
  magicCubes: null,
  currentStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  fileData: null,
  plots: null,
  finalValue: null,
  duration: 0,
};

export default function MagicCubeSolver() {
  // State and refs initialization
  const [state, setState] = useState<State>(initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Calculate maximum step based on available matrices
  const maxStep = state.magicCubes ? state.magicCubes.length - 1 : 0;

  /**
   * Cleanup interval on component unmount
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  /**
   * Handle automatic playback of cube states
   */
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (state.isPlaying && state.magicCubes) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.currentStep >= maxStep) {
            clearInterval(intervalRef.current);
            return { ...prev, isPlaying: false };
          }
          return { ...prev, currentStep: prev.currentStep + 1 };
        });
      }, 1000 / state.playbackSpeed);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isPlaying, state.playbackSpeed, maxStep, state.magicCubes]);

  /**
   * Handle slider value changes
   */
  const handleSliderChange = useCallback((value: number[]) => {
    setState((prev) => ({ ...prev, currentStep: value[0] }));
  }, []);

  /**
   * Handle step changes (previous/next)
   */
  const handleStepChange = useCallback(
    (direction: "prev" | "next") => () => {
      setState((prev) => {
        const newStep =
          direction === "prev"
            ? Math.max(0, prev.currentStep - 1)
            : Math.min(maxStep, prev.currentStep + 1);
        return { ...prev, currentStep: newStep };
      });
    },
    [maxStep]
  );

  /**
   * Fetch data for Random Restart algorithm
   */
  const fetchRandomRestartData = async () => {
    try {
      const response = await fetch(
        "/api/local-search/random-restart?maxRestarts=1"
      );
      const data: RandomRestartSearchDto = await response.json();

      setState((prev) => ({
        ...prev,
        magicCubes: data.states,
        plots: data.plots,
        finalValue: data.finalStateValue,
        duration: data.duration,
      }));
    } catch (error) {
      console.error("Error fetching random restart data:", error);
      // Handle error appropriately
    }
  };
  console.log(state.magicCubes);
  /**
   * Handle form submission for solving
   */
  const handleSubmit = useCallback(async () => {
    if (!state.selectedAlgorithm) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    if (state.selectedAlgorithm === ALGORITHMS.RANDOM_RESTART) {
      await fetchRandomRestartData();
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  }, [state.selectedAlgorithm]);

  /**
   * Handle file loading
   */
  const handleFileLoad = useCallback(() => {
    if (!state.fileData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const matrices = renderStateCSV(text, 5);
      setState((prev) => ({
        ...prev,
        magicCubes: matrices,
        currentStep: 0,
        isPlaying: false,
      }));
    };

    reader.readAsText(state.fileData);
  }, [state.fileData]);

  /**
   * Clear loaded file and reset state
   */
  const handleClearFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setState((prev) => ({
      ...prev,
      magicCubes: null,
      currentStep: 0,
      isPlaying: false,
    }));
  }, []);

  /**
   * Toggle play/pause state
   */
  const handlePlayPause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  return (
    <main className="px-8 sm:px-10 md:px-14 lg:px-16 2xl:px-20 py-10">
      {/* Main Title */}
      <h1 className="text-center text-3xl font-bold mb-6">
        Diagonal Magic Cube Solver
      </h1>

      {/* Control Panel */}
      <div className="m-auto flex flex-col gap-4 items-center justify-center">
        {/* Algorithm Selection and File Upload */}
        <div className="grid grid-cols-2 gap-4">
          {/* Algorithm Selection */}
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold">Select Algorithm</p>
            <Select
              onValueChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  selectedAlgorithm: value as AlgorithmType,
                }))
              }
              defaultValue=""
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
            <Button onClick={handleSubmit}>Solve</Button>
          </div>

          {/* File Upload */}
          <div className="flex flex-col items-center gap-2">
            <label className="font-bold">Load CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  fileData: e.target.files?.[0] || null,
                }))
              }
              ref={fileInputRef}
              className="border p-2 rounded"
            />
            <Button onClick={handleFileLoad}>Load</Button>
          </div>
        </div>

        {/* File Status and Actions */}
        {state.magicCubes && (
          <>
            <div>
              <p className="text-green-600">
                Loaded {state.magicCubes.length} matrices successfully
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => downloadCSV(state.magicCubes!)}>
                Download CSV
              </Button>
              <Button onClick={handleClearFile}>Clear</Button>
            </div>
          </>
        )}

        {/* Results Display */}
        {state.finalValue !== null && state.duration !== 0 && (
          <div className="flex gap-3 items-center justify-center">
            <p className="font-semibold">
              Duration:{" "}
              {Number.isInteger(state.duration)
                ? state.duration
                : Math.round(state.duration * 100) / 100}
              s
            </p>
            <p className="font-semibold">Final Value: {state.finalValue}</p>
          </div>
        )}
      </div>

      {/* Visualization Area */}
      {state.isLoading ? (
        <Skeleton className="w-[1000px] h-[400px] m-auto mt-4" />
      ) : (
        <Visualizer
          matrixNumber={
            state.magicCubes ? state.magicCubes[state.currentStep] : null
          }
          width={1000}
          height={400}
        />
      )}

      {/* Controls and Plots */}
      <div className="flex flex-col w-full items-center justify-center max-w-[1000px] m-auto">
        <div className="mt-4 mb-4 flex flex-col w-full items-center justify-center gap-4">
          <div className="flex flex-col w-full items-center justify-center gap-4">
            <Slider
              defaultValue={[0]}
              value={[state.currentStep]}
              min={0}
              max={maxStep}
              step={1}
              onValueChange={handleSliderChange}
              className={cn("w-[60%]")}
              disabled={!state.magicCubes || state.isPlaying}
            />
            <div className="text-sm text-gray-600">
              Step: {state.currentStep + 1} / {maxStep + 1}
            </div>
            <PlaybackControls
              isPlaying={state.isPlaying}
              disabled={!state.magicCubes}
              onPrev={handleStepChange("prev")}
              onNext={handleStepChange("next")}
              onPlayPause={handlePlayPause}
              onSpeedChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  playbackSpeed: parseFloat(value),
                }))
              }
            />
          </div>
        </div>
        {state.plots?.map((plot, index) => (
          <div key={index} className="w-full mt-10">
            <CustomLineChart
              chartData={plot.data}
              cardTitle={`${plot.labelY} vs ${plot.labelX}`}
              cardDescription="Algorithm progression over time"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
