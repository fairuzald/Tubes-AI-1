import { NextResponse } from "next/server";
import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";

interface BenchmarkResult {
  initialTemperature: number;
  alpha: number;
  finalStateValue: number;
  iterationCount: number;
  duration: number;
}

interface BenchmarkEntry {
  initialTemperature: number;
  alpha: number;
  avgStateValue: number;
  avgIterations: number;
  avgDuration: number;
}

export const GET = async () => {
  const NUM_RUNS = 5; // Number of runs per configuration
  const MINIMUM_TEMPERATURE = Number.MIN_VALUE;

  // Define ranges for parameters
  const initialTempRange = {
    start: 50,
    end: 200,
    step: 25,
  };

  const alphaRange = {
    start: 0.999,
    end: 0.9999,
    step: 0.0,
  };

  let bestResult: BenchmarkResult = {
    initialTemperature: 0,
    alpha: 0,
    finalStateValue: Number.MIN_VALUE,
    iterationCount: 0,
    duration: 0,
  };

  const allResults: BenchmarkEntry[] = [];

  // Iterate through all combinations
  for (
    let temp = initialTempRange.start;
    temp <= initialTempRange.end;
    temp += initialTempRange.step
  ) {
    console.log(temp);

    for (
      let alpha = alphaRange.start;
      alpha <= alphaRange.end;
      alpha += alphaRange.step
    ) {
      // Run multiple times and average results
      let totalStateValue = 0;
      let totalIterations = 0;
      let totalDuration = 0;

      for (let run = 0; run < NUM_RUNS; run++) {
        const magicCube = new MagicCube();
        const temperatureFunction = TemperatureFactory.exponentialDecay(
          temp,
          alpha
        );

        const simulatedAnnealing = new SimulatedAnnealing(
          magicCube,
          temperatureFunction,
          MINIMUM_TEMPERATURE
        );

        simulatedAnnealing.solve();
        const result = simulatedAnnealing.toSearchDto();

        totalStateValue += result.finalStateValue;
        totalIterations += result.iterationCount;
        totalDuration += result.duration;
      }

      // Calculate averages
      const avgStateValue = totalStateValue / NUM_RUNS;
      const avgIterations = totalIterations / NUM_RUNS;
      const avgDuration = totalDuration / NUM_RUNS;

      // Store this configuration's results
      allResults.push({
        initialTemperature: temp,
        alpha: alpha,
        avgStateValue: avgStateValue,
        avgIterations: avgIterations,
        avgDuration: avgDuration,
      });

      // Update best result if current configuration is better
      if (avgStateValue > bestResult.finalStateValue) {
        bestResult = {
          initialTemperature: temp,
          alpha: alpha,
          finalStateValue: avgStateValue,
          iterationCount: avgIterations,
          duration: avgDuration,
        };
      }
    }
  }

  return NextResponse.json({
    bestResult: {
      initialTemperature: bestResult.initialTemperature.toFixed(2),
      alpha: bestResult.alpha.toFixed(4),
      finalStateValue: bestResult.finalStateValue.toFixed(2),
      iterationCount: Math.round(bestResult.iterationCount),
      duration: Math.round(bestResult.duration),
    },
    allResults: allResults.map((result) => ({
      initialTemperature: result.initialTemperature.toFixed(2),
      alpha: result.alpha.toFixed(4),
      avgStateValue: result.avgStateValue.toFixed(2),
      avgIterations: Math.round(result.avgIterations),
      avgDuration: Math.round(result.avgDuration),
    })),
    benchmarkSettings: {
      runsPerConfiguration: NUM_RUNS,
      initialTemperature: initialTempRange,
      alpha: alphaRange,
    },
  });
};
