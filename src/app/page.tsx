"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { CustomLineChart } from "@/components/CustomLineChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import Visualizer from "@/components/Visualizer";
import { Plot } from "@/lib/Plot";
import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";
import { cn } from "@/lib/utils";
import { downloadCSV, renderStateCSV } from "@/utils/state-processor";

const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
const ALGORITHMS = {
  STEEPEST_ASCENT: "Steepest Ascent Hill Climbing",
  SIDEWAYS_MOVE: "Sideways Move Hill Climbing",
  STOCHASTIC: "Stochastic Hill Climbing",
  RANDOM_RESTART: "Random Restart Hill Climbing",
  SIMULATED_ANNEALING: "Simulated Annealing",
  GENETIC: "Genetic Algorithm",
} as const;

type AlgorithmType = (typeof ALGORITHMS)[keyof typeof ALGORITHMS];

interface PlaybackControlsProps {
  isPlaying: boolean;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onSpeedChange: (value: string) => void;
}

// Extracted PlaybackControls component for better organization
const PlaybackControls = ({
  isPlaying,
  disabled,
  onPrev,
  onNext,
  onPlayPause,
  onSpeedChange,
}: PlaybackControlsProps) => (
  <div className="flex w-full items-center justify-center gap-3">
    <Button onClick={onPrev} disabled={disabled}>
      {"<<"}
    </Button>
    <Button
      onClick={onPlayPause}
      disabled={disabled}
      className={cn(
        isPlaying
          ? "bg-red-500 hover:bg-red-600"
          : "bg-green-500 hover:bg-green-600"
      )}
    >
      {isPlaying ? "Pause" : "Play"}
    </Button>
    <Select onValueChange={onSpeedChange} defaultValue="1" disabled={disabled}>
      <SelectTrigger className="w-[80px]">
        <SelectValue placeholder="Speed" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Playbacks</SelectLabel>
          {PLAYBACK_SPEEDS.map((speed) => (
            <SelectItem key={speed} value={speed.toString()}>
              {speed}x
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    <Button onClick={onNext} disabled={disabled}>
      {">>"}
    </Button>
  </div>
);

export default function Home() {
  const [state, setState] = useState({
    selectedAlgorithm: null as AlgorithmType | null,
    magicCubes: null as number[][][][] | null,
    isLoading: false,
    fileData: null as Blob | null,
    isPlaying: false,
    currentStep: 0,
    playbackSpeed: 1,
    plots: null as Plot<number, number>[] | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackInterval = useRef<NodeJS.Timeout>();

  const maxStep = useMemo(
    () => (state.magicCubes ? state.magicCubes.length - 1 : 0),
    [state.magicCubes]
  );

  const handlePlayback = useCallback(() => {
    if (state.isPlaying && state.magicCubes) {
      playbackInterval.current = setInterval(() => {
        setState((prev) => {
          if (prev.currentStep >= maxStep) {
            return { ...prev, isPlaying: false, currentStep: 0 };
          }
          return { ...prev, currentStep: prev.currentStep + 1 };
        });
      }, 500 / state.playbackSpeed);
    }
    return () => {
      if (playbackInterval.current) {
        clearInterval(playbackInterval.current);
      }
    };
  }, [state.isPlaying, state.magicCubes, state.playbackSpeed, maxStep]);

  // Effect for playback
  useEffect(() => {
    const cleanup = handlePlayback();
    return cleanup;
  }, [handlePlayback]);

  const handleSliderChange = useCallback((value: number[]) => {
    setState((prev) => ({ ...prev, currentStep: value[0] }));
  }, []);

  const onNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, maxStep),
    }));
  }, [maxStep]);

  const onPrev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  }, []);

  const onRandomRestart = useCallback(async () => {
    try {
      const data: RandomRestartSearchDto = await fetch(
        "/api/local-search/random-restart?maxRestarts=1"
      ).then((res) => res.json());

      setState((prev) => ({
        ...prev,
        magicCubes: data.states,
        plots: data.plots,
      }));
    } catch (error) {
      console.error("Failed to fetch random restart data:", error);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    setState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const handleSpeedChange = useCallback((value: string) => {
    setState((prev) => ({ ...prev, playbackSpeed: parseFloat(value) }));
  }, []);

  const onSubmit = useCallback(async () => {
    if (!state.selectedAlgorithm) return;

    setState((prev) => ({ ...prev, isLoading: true }));

    if (state.selectedAlgorithm === ALGORITHMS.RANDOM_RESTART) {
      await onRandomRestart();
    }

    setState((prev) => ({ ...prev, isLoading: false }));
  }, [state.selectedAlgorithm, onRandomRestart]);

  const loadMatrices = useCallback(() => {
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

  const clearFile = useCallback(() => {
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

  return (
    <main className="px-8 sm:px-10 md:px-14 lg:px-16 2xl:px-20 py-10">
      <h1 className="text-center text-3xl font-bold mb-6">
        Diagonal Magic Cube Solver
      </h1>

      <div className="m-auto flex flex-col gap-4 items-center justify-center">
        <div className="grid grid-cols-2 gap-4">
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
            <Button onClick={onSubmit}>Solve</Button>
          </div>
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
            <Button onClick={loadMatrices}>Load</Button>
          </div>
        </div>

        {state.magicCubes && (
          <>
            <div>
              <p className="text-green-600">
                Loaded {state.magicCubes.length} matrices successfully!
              </p>
            </div>
            <div className="flex space-x-4">
              <Button onClick={() => downloadCSV(state.magicCubes!)}>
                Download CSV
              </Button>
              <Button onClick={clearFile}>Clear</Button>
            </div>
          </>
        )}
      </div>

      {state.isLoading ? (
        <Skeleton className="w-[1000px] h-[400px]" />
      ) : (
        <Visualizer
          matrixNumber={
            state.magicCubes ? state.magicCubes[state.currentStep] : null
          }
          width={1000}
          height={400}
        />
      )}

      <div className="flex flex-col w-full items-center justify-center max-w-[1000px] m-auto">
        <div className="mt-4 mb-4 flex flex-col w-full items-center justify-center gap-4">
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
            Step: {state.currentStep} / {maxStep}
          </div>

          <PlaybackControls
            isPlaying={state.isPlaying}
            disabled={!state.magicCubes}
            onPrev={onPrev}
            onNext={onNext}
            onPlayPause={handlePlayPause}
            onSpeedChange={handleSpeedChange}
          />
        </div>

        {state.plots?.map((plot, index) => (
          <div key={index} className="w-full mt-10">
            <CustomLineChart
              chartData={plot.data}
              cardTitle="Performance Metrics"
              cardDescription="Algorithm progression over time"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
