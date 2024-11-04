export const dynamic = 'force-dynamic';
import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";
import { NextResponse, type NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const magicCube = new MagicCube();

  const minimumTemperature = Number.MIN_VALUE;
  const initialTemperature = 200;
  const alpha = 0.99955;
  const temperatureFunction = TemperatureFactory.exponentialDecay(
    initialTemperature,
    alpha
  );

  const simulatedAnnealing = new SimulatedAnnealing(
    magicCube,
    temperatureFunction,
    minimumTemperature
  );

  // Solve
  simulatedAnnealing.solve();

  console.log("Iteration count:", simulatedAnnealing.getIterationCount());
  console.log("Search Duration: ", simulatedAnnealing.getDuration());
  console.log("Final result:", simulatedAnnealing.getFinalObjectiveFunction());
  console.log(
    "Stuck counter: ",
    simulatedAnnealing.getStuckLocalOptimaCounter()
  );

  const encoder = new TextEncoder();
  const stream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(JSON.stringify(chunk) + "\n"));
    },
  });
  const writer = stream.writable.getWriter();

  // Handle the streaming in a separate async function
  (async () => {
    try {
      const startStreamingTime = Date.now();

      // Send metrics
      console.log("Sending metrics");
      await writer.write({
        type: "metrics",
        data: {
          finalStateValue: simulatedAnnealing.getFinalObjectiveFunction(),
          duration: simulatedAnnealing.getDuration(),
          iterationCount: simulatedAnnealing.getIterationCount(),
          stuckLocalOptimaCounter:
            simulatedAnnealing.getStuckLocalOptimaCounter(),
        },
      });
      console.log("Metrics sent");

      // states (in batches)
      // rough estimate:
      // 1 number ~ 64 bit = 8 byte (js number)
      // 1 state ~ 5 ** 3 = 125 numbers
      // 1 state ~ 125 * 8 = 1000 byte = 1 kB
      // stream per 1 MB = 1000 states
      const stateBatchSize = 5 * 1000;
      console.log("Sending states");
      const states = simulatedAnnealing.getStates();
      for (let i = 0; i < states.length; i += stateBatchSize) {
        const endSlice = Math.min(i + stateBatchSize, states.length);

        const batch = states.slice(i, endSlice);
        const batchIdx = Math.floor(i / stateBatchSize);

        await writer.write({
          type: "states",
          index: batchIdx,
          data: batch,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      console.log("States sent");

      // objective function plot meta
      console.log("Sending objective function plot meta");
      await writer.write({
        type: "objectiveFunctionPlotMeta",
        data: {
          labelX: "Iteration",
          labelY: "Objective Function",
        },
      });
      console.log("Objective function plot meta sent");

      // probability plot meta
      console.log("Sending probability plot meta");
      await writer.write({
        type: "probabilityPlotMeta",
        data: {
          labelX: "Iteration",
          labelY: "Probability",
        },
      });
      console.log("Probability plot meta sent");

      // objective function plot data
      // rough estimate:
      // each data point ~ 64 bit = 8 byte (js number)
      // 1 plot data contains 2 numbers
      // 1 plot data ~ 16 byte
      // stream per 1 MB = 1000 * 1000 / 16 = 62500 data points
      const plotDataBatchSize = 62500 * 5;
      console.log("Sending objective function plot data");
      const objectiveFunctionPlotData =
        simulatedAnnealing.getAggregatedObjectiveFunctionPlot(100).data;
      for (
        let i = 0;
        i < objectiveFunctionPlotData.length;
        i += plotDataBatchSize
      ) {
        const endSlice = Math.min(
          i + plotDataBatchSize,
          objectiveFunctionPlotData.length
        );

        const batch = objectiveFunctionPlotData.slice(i, endSlice);
        const batchIdx = Math.floor(i / plotDataBatchSize);

        await writer.write({
          type: "objectiveFunctionPlotData",
          index: batchIdx,
          data: batch,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      console.log("Objective function plot data sent");

      // probability plot data
      console.log("Sending probability plot data");
      const probabilityPlotData =
        simulatedAnnealing.getAggregatedProbabilityPlot(100).data;
      for (let i = 0; i < probabilityPlotData.length; i += plotDataBatchSize) {
        const endSlice = Math.min(
          i + plotDataBatchSize,
          probabilityPlotData.length
        );

        const batch = probabilityPlotData.slice(i, endSlice);
        const batchIdx = Math.floor(i / plotDataBatchSize);

        await writer.write({
          type: "probabilityPlotData",
          index: batchIdx,
          data: batch,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      console.log("Probability plot data sent");

      // Close the writer to end the stream
      await writer.close();

      const endStreamingTime = Date.now();
      console.log(
        "Streaming duration:",
        Math.floor((endStreamingTime - startStreamingTime) / 1000)
      );
    } catch (error) {
      console.error("Streaming error:", error);
      // Send error message before closing

      // Close the writer to end the stream
      await writer.close();
      return NextResponse.json(
        { message: "An error occurred while streaming the data" },
        { status: 500 }
      );
    }
  })();

  // Handle the abort signal
  req.signal.onabort = async () => {
    await writer.ready;
    await writer.close();
  };

  // Return the response
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
};
