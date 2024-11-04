"use client";
import { useCallback, useRef, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ALGORITHMS } from "@/constant/data";
import { downloadCSV, parseCSV } from "@/utils/state-processor";
import { CustomLineChart } from "@/components/CustomLineChart";
import Visualizer from "@/components/Visualizer";
import PlaybackControls from "@/components/PlaybackControlsProps";
import { useInterval } from "@/hooks/useInterval";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { initialState, reducer } from "@/utils/reducer";
import { useStreamProcessor } from "@/hooks/useStreamProcessor";
import { useAlgorithms } from "@/hooks/useAlgorithms";
import { ResultsDisplay } from "@/components/sections/ResultDisplay";
import { FileUploader } from "@/components/sections/FileUploader";
import { AlgorithmSelector } from "@/components/sections/AlgortithmSelector";
import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";
import useMobile from "@/hooks/useMobile";

export default function MagicCubeSolver() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [maxRestart, setMaxRestart] = useState(1);
  const [maxSideways, setMaxSideways] = useState(100);
  const [nmax, setNmax] = useState(5000);
  const [populationCount, setPopulationCount] = useState(100);
  const [iterations, setIterations] = useState(100);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { width, isMobile } = useMobile();

  const maxStep = state.magicCubes ? state.magicCubes.length - 1 : 0;

  // Playback interval
  useInterval(
    () => {
      if (state.currentStep >= maxStep) {
        dispatch({ type: "SET_PLAYING", payload: false });
        return;
      }
      // Skip frames if we have too many states
      const skipFrames = state.magicCubes && state.magicCubes.length > 5000 ? 5 : 1;
      dispatch({
        type: "SET_CURRENT_STEP",
        payload: Math.min(maxStep, state.currentStep + skipFrames),
      });
    },
    state.isPlaying ? 1000 / state.playbackSpeed : null
  );

  // Stream processor
  const processStreamedData = useStreamProcessor({
    onMetricsUpdate: (metrics) =>
      dispatch({ type: "SET_METRICS", payload: metrics }),
    onStatesUpdate: (states) =>
      dispatch({ type: "SET_MAGIC_CUBES", payload: states }),
    onPlotsUpdate: (plots) => dispatch({ type: "SET_PLOTS", payload: plots }),
  });
  // Algorithm hooks
  const {
    fetchRandomRestartData,
    fetchSimulatedAnnealingStream,
    fetchSidewaysMoveData,
    fetchSteepestAscentData,
    fetchStochasticData,
    fetchGeneticData,
  } = useAlgorithms((data) =>
    state.selectedAlgorithm === ALGORITHMS.RANDOM_RESTART
      ? dispatch({
          type: "SET_RANDOM_STATE_SOLUTION",
          payload: data as RandomRestartSearchDto,
        })
      : dispatch({ type: "SET_SOLUTION", payload: data })
  );

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!state.selectedAlgorithm) return;

    // Clear previous data
    dispatch({ type: "CLEAR_CUBES" });
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      // Fetch data based on selected algorithm
      switch (state.selectedAlgorithm) {
        // Random Restart
        case ALGORITHMS.RANDOM_RESTART:
          await fetchRandomRestartData(Math.max(1, maxRestart));
          break;
        // Simulated Annealing
        case ALGORITHMS.SIMULATED_ANNEALING:
          if (abortControllerRef.current) {
            abortControllerRef.current.abort();
          }
          abortControllerRef.current = new AbortController();
          await fetchSimulatedAnnealingStream(
            abortControllerRef.current,
            processStreamedData
          );
          break;
        // Steepest Ascent
        case ALGORITHMS.STEEPEST_ASCENT:
          await fetchSteepestAscentData();
          break;
        // Sideways Move
        case ALGORITHMS.SIDEWAYS_MOVE:
          await fetchSidewaysMoveData(Math.max(1, maxSideways));
          break;
        // Stochastic Hill Climbing
        case ALGORITHMS.STOCHASTIC:
          await fetchStochasticData(Math.max(1, nmax));
          break;
        // Genetic Algorithm
        case ALGORITHMS.GENETIC:
          await fetchGeneticData(
            Math.max(1, populationCount),
            Math.max(1, iterations)
          );
          break;
      }
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    state.selectedAlgorithm,
    fetchRandomRestartData,
    maxRestart,
    fetchSimulatedAnnealingStream,
    processStreamedData,
    fetchSteepestAscentData,
    fetchSidewaysMoveData,
    maxSideways,
    fetchStochasticData,
    nmax,
    fetchGeneticData,
    populationCount,
    iterations,
  ]);

  // Handle file load
  const handleFileLoad = useCallback(() => {
    if (!state.fileData) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { matrices, plots, metrics } = parseCSV(text, 5);

      // Set matrices and plots
      dispatch({ type: "SET_MAGIC_CUBES", payload: matrices });
      dispatch({ type: "SET_PLOTS", payload: plots });

      // If we have Random Restart metrics, use SET_RANDOM_STATE_SOLUTION
      if (
        metrics.restartCount !== undefined ||
        metrics.iterationCounter !== undefined
      ) {
        dispatch({
          type: "SET_RANDOM_STATE_SOLUTION",
          payload: {
            states: matrices,
            plots: plots,
            finalStateValue: metrics.finalValue ?? 0,
            duration: metrics.duration ?? 0,
            restartCount: metrics.restartCount ?? 0,
            iterationCount: metrics.iterationCount ?? 0,
            iterationCounter: metrics.iterationCounter ?? [],
          },
        });
      } else {
        // For other algorithms, use SET_METRICS
        dispatch({
          type: "SET_METRICS",
          payload: {
            finalStateValue: metrics.finalValue ?? undefined,
            duration: metrics.duration ?? undefined,
            iterationCount: metrics.iterationCount,
            stuckLocalOptimaCounter: metrics.stuckFrequency,
          },
        });
      }
    };

    reader.readAsText(state.fileData);
  }, [state.fileData]);

  // Handle clear file
  const handleClearFile = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.refresh();
    dispatch({ type: "RESET_STATE" });
  }, [router]);

  return (
    <div className="px-8 sm:px-10 md:px-14 lg:px-16 xl:px-28 py-10">
      <div className="flex gap-4 items-center justify-center mb-10">
        <Image src="/logo.png" alt="Magic Cube" width={50} height={50} />
        <h1 className="text-center text-3xl font-bold">
          Diagonal Magic Cube Solver
        </h1>
      </div>

      <div className="m-auto flex flex-col gap-4 items-center justify-center">
        {/* Process Data Params */}
        <div className="grid grid-cols-2 gap-4">
          {/* Using Algorithm */}
          <AlgorithmSelector
            onAlgorithmChange={(algo) =>
              dispatch({ type: "SET_ALGORITHM", payload: algo })
            }
            maxRestart={maxRestart}
            onMaxRestartChange={setMaxRestart}
            maxSideways={maxSideways}
            onMaxSidewaysChange={setMaxSideways}
            nmax={nmax}
            onNmaxChange={setNmax}
            iterations={iterations}
            onIterationsChange={setIterations}
            populationCount={populationCount}
            onPopulationCountChange={setPopulationCount}
            selectedAlgorithm={state.selectedAlgorithm}
            disabled={state.isLoading || !state.selectedAlgorithm}
            onSubmit={handleSubmit}
          />

          {/* File Uploader */}
          <FileUploader
            onFileChange={(file) =>
              dispatch({ type: "SET_FILE_DATA", payload: file })
            }
            onLoad={handleFileLoad}
            fileData={state.fileData}
            isLoading={state.isLoading}
            fileInputRef={fileInputRef}
          />
        </div>


        {/* Results Display */}
        {state.magicCubes && (
          <>
            <div>
              <p className="text-green-600">
                Loaded {state.magicCubes.length - 1} matrices successfully
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() =>
                  downloadCSV(
                    state.magicCubes!,
                    state.plots!,
                    state.finalValue,
                    state.duration,
                    state.iterationCount,
                    state.iterationCounter,
                    state.populationCount,
                    state.restartCount,
                    state.stuckFrequency
                  )
                }
              >
                Download CSV
              </Button>
              <Button onClick={handleClearFile}>Clear</Button>
            </div>
          </>
        )}

        <ResultsDisplay
          finalValue={state.finalValue}
          duration={state.duration}
          iterationCount={state.iterationCount}
          restartCount={state.restartCount}
          stuckFrequency={state.stuckFrequency}
          iterationCounter={state.iterationCounter}
        />
      </div>

      {/* Visualization */}
      {state.isLoading ? (
        <Skeleton
          className="m-auto mt-4"
          style={{
            width: isMobile ? width - 40 : 960,
            height: isMobile ? width : 400,
          }}
        />
      ) : (
        <Visualizer
          matrixNumber={
            state.magicCubes ? state.magicCubes[state.currentStep] : null
          }
          width={isMobile ? width - 40 : 1000}
          height={isMobile ? width : 400}
        />
      )}

      {/* Controls and Plots */}
      <div className="flex flex-col w-[90%] items-center justify-center max-w-[1000px] m-auto">
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
                disabled={
                  !state.magicCubes || state.isPlaying || state.isLoading
                }
              />
              <div className="text-sm text-gray-600">
                Step: {state.currentStep} / {maxStep}
              </div>
              <PlaybackControls
                isPlaying={state.isPlaying}
                disabled={!state.magicCubes || state.isLoading}
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
              labelX={plot.labelX}
              labelY={plot.labelY}
              chartData={plot.data}
              cardTitle={`${plot.labelY} vs ${plot.labelX}`}
              cardDescription="Algorithm progression over time"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
