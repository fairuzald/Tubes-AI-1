"use client";
import { useCallback, useRef, useReducer, useState } from "react";
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
import { downloadCSV, parseCSV } from "@/utils/state-processor";
import { CustomLineChart } from "@/components/CustomLineChart";
import Visualizer from "@/components/Visualizer";
import PlaybackControls from "@/components/PlaybackControlsProps";
import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";
import { initialState, reducer } from "@/utils/reducer";
import { useInterval } from "@/hooks/useInterval";
import { SearchDto } from "@/lib/SearchDto";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function MagicCubeSolver() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maxRestart, setMaxRestart] = useState(1);

  const maxStep = state.magicCubes ? state.magicCubes.length - 1 : 0;

  // Playback interval
  useInterval(
    () => {
      if (state.currentStep >= maxStep) {
        dispatch({ type: "SET_PLAYING", payload: false });
        return;
      }
      dispatch({ type: "SET_CURRENT_STEP", payload: state.currentStep + 1 });
    },
    state.isPlaying ? 1000 / state.playbackSpeed : null
  );

  // API handlers
  const fetchRandomRestartData = async (restartNumber: number) => {
    try {
      const response = await fetch(
        `/api/local-search/random-restart?maxRestarts=${restartNumber}`
      );
      const data: RandomRestartSearchDto = await response.json();
      dispatch({ type: "SET_RANDOM_STATE_SOLUTION", payload: data });
    } catch (error) {
      console.error("Error fetching random restart data:", error);
    }
  };

  const fetchSimulatedAnnealingData = async () => {
    try {
      const response = await fetch(`/api/local-search/simulated-annealing`);
      const data: SearchDto = await response.json();
      dispatch({ type: "SET_SOLUTION", payload: data });
    } catch (error) {
      console.error("Error fetching random restart data:", error);
    }
  };

  // Event handlers
  const handleSubmit = useCallback(async () => {
    if (!state.selectedAlgorithm) return;

    dispatch({ type: "CLEAR_CUBES" });

    dispatch({ type: "SET_LOADING", payload: true });

    if (state.selectedAlgorithm === ALGORITHMS.RANDOM_RESTART) {
      await fetchRandomRestartData(Math.max(1, maxRestart));
    }
    if (state.selectedAlgorithm === ALGORITHMS.SIMULATED_ANNEALING) {
      await fetchSimulatedAnnealingData();
    }

    dispatch({ type: "SET_LOADING", payload: false });
  }, [maxRestart, state.selectedAlgorithm]);

  const handleFileLoad = useCallback(() => {
    if (!state.fileData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text, 5);
      dispatch({ type: "SET_MAGIC_CUBES", payload: data.matrices });
      dispatch({ type: "SET_PLOTS", payload: data.plots });
    };

    reader.readAsText(state.fileData);
  }, [state.fileData]);

  const handleClearFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.refresh();
    dispatch({ type: "RESET_STATE" });
  }, [router]);

  return (
    <main className="px-8 sm:px-10 md:px-14 lg:px-16 xl:px-28 py-10">
      <div className="flex gap-4 items-center justify-center mb-10">
        <Image src="/logo.png" alt="Magic Cube" width={50} height={50} />
        <h1 className="text-center text-3xl font-bold">
          Diagonal Magic Cube Solver
        </h1>
      </div>

      <div className="m-auto flex flex-col gap-4 items-center justify-center">
        <div className="grid grid-cols-2 gap-4">
          {/* Algorithm Selection */}
          <div className="flex flex-col items-center gap-2">
            <p className="font-bold">Select Algorithm</p>
            <Select
              onValueChange={(value) =>
                dispatch({
                  type: "SET_ALGORITHM",
                  payload: value as AlgorithmType,
                })
              }
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
            {state.selectedAlgorithm === ALGORITHMS.RANDOM_RESTART && (
              <Input
                type="number"
                value={maxRestart}
                onChange={(e) => setMaxRestart(parseInt(e.target.value))}
                placeholder="Max Restarts"
              />
            )}
            <Button
              disabled={!state.selectedAlgorithm || state.isLoading}
              onClick={handleSubmit}
            >
              Solve
            </Button>
          </div>

          {/* File Upload */}
          <div className="flex flex-col items-center gap-2">
            <label className="font-bold">Load CSV File</label>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) =>
                dispatch({
                  type: "SET_FILE_DATA",
                  payload: e.target.files?.[0] || null,
                })
              }
              ref={fileInputRef}
              className="border p-2 rounded"
            />
            <Button
              disabled={!state.fileData || state.isLoading}
              onClick={handleFileLoad}
            >
              Load
            </Button>
          </div>
        </div>

        {/* Results Display */}
        {state.magicCubes && (
          <>
            <div>
              <p className="text-green-600">
                Loaded {state.magicCubes.length} matrices successfully
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => downloadCSV(state.magicCubes!, state.plots!)}
              >
                Download CSV
              </Button>
              <Button onClick={handleClearFile}>Clear</Button>
            </div>
          </>
        )}

        {/* Result Information */}
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

      {/* Visualization */}
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
        {state.magicCubes && state.magicCubes.length > 0 && (
          <div className="mt-4 mb-4 flex flex-col w-full items-center justify-center gap-4">
            <div className="flex flex-col w-full items-center justify-center gap-4">
              <Slider
                defaultValue={[0]}
                value={[state.currentStep]}
                min={0}
                max={maxStep}
                step={1}
                onValueChange={(value) =>
                  dispatch({ type: "SET_CURRENT_STEP", payload: value[0] })
                }
                className={cn("w-[60%]")}
                disabled={!state.magicCubes || state.isPlaying}
              />
              <div className="text-sm text-gray-600">
                Step: {state.currentStep + 1} / {maxStep + 1}
              </div>
              <PlaybackControls
                isPlaying={state.isPlaying}
                disabled={!state.magicCubes}
                onPrev={() =>
                  dispatch({
                    type: "SET_CURRENT_STEP",
                    payload: Math.max(0, state.currentStep - 1),
                  })
                }
                onNext={() =>
                  dispatch({
                    type: "SET_CURRENT_STEP",
                    payload: Math.min(maxStep, state.currentStep + 1),
                  })
                }
                onPlayPause={() => {
                  if (state.currentStep === maxStep) {
                    dispatch({ type: "SET_CURRENT_STEP", payload: 0 });
                    dispatch({ type: "SET_PLAYING", payload: true });
                    return;
                  }

                  dispatch({ type: "SET_PLAYING", payload: !state.isPlaying });
                }}
                onSpeedChange={(value) =>
                  dispatch({
                    type: "SET_PLAYBACK_SPEED",
                    payload: parseFloat(value),
                  })
                }
              />
            </div>
          </div>
        )}

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
