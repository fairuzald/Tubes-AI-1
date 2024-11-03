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

  const responseDto = simulatedAnnealing.toSearchDto();

  console.log(Date.now());
  console.log(responseDto.duration);
  console.log(responseDto.finalStateValue);
  console.log(responseDto.iterationCount);

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
      // Send metrics
      console.log("Sending metrics");
      await writer.write({
        type: "metrics",
        data: {
          finalStateValue: responseDto.finalStateValue,
          duration: responseDto.duration,
          iterationCount: responseDto.iterationCount,
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
      for (let i = 0; i < responseDto.states.length; i += stateBatchSize) {
        const endSlice = Math.min(
          i + stateBatchSize,
          responseDto.states.length
        );
        const batch = responseDto.states.slice(i, endSlice);

        await writer.write({
          type: "states",
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
      for (
        let i = 0;
        i < responseDto.plots[1].data.length;
        i += plotDataBatchSize
      ) {
        const endSlice = Math.min(
          i + plotDataBatchSize,
          responseDto.plots[1].data.length
        );
        const batch = responseDto.plots[1].data.slice(i, endSlice);

        await writer.write({
          type: "objectiveFunctionPlotData",
          index: i,
          data: batch,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      console.log("Objective function plot data sent");

      // probability plot data
      console.log("Sending probability plot data");
      for (
        let i = 0;
        i < responseDto.plots[0].data.length;
        i += plotDataBatchSize
      ) {
        const endSlice = Math.min(
          i + plotDataBatchSize,
          responseDto.plots[0].data.length
        );
        const batch = responseDto.plots[0].data.slice(i, endSlice);

        await writer.write({
          type: "probabilityPlotData",
          index: i,
          data: batch,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      console.log("Probability plot data sent");

      // Send completion message
      console.log("Sending completion message");
      await writer.write({
        type: "complete",
        timestamp: Date.now(),
      });
      console.log("Completion message sent");

      // Close the writer to end the stream
      await writer.close();
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

  req.signal.onabort = async () => {
    await writer.ready;
    await writer.close();
  };

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
};
