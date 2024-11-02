import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";
import { type NextRequest } from "next/server";

export const GET = async (req: NextRequest) => {
  const magicCube = new MagicCube();
  const minimumTemperature = Number.MIN_VALUE;
  const initialTemperature = 200;
  const alpha = 0.99955;
  const temperatureFunction =
    // TemperatureFactory.logarithmicDecay(initialTemperature);
    TemperatureFactory.exponentialDecay(initialTemperature, alpha);

  const simulatedAnnealing = new SimulatedAnnealing(
    magicCube,
    temperatureFunction,
    minimumTemperature
  );

  // Solve
  simulatedAnnealing.solve();

  const responseDto = simulatedAnnealing.toSearchDto();

  // console.log(responseDto.duration);
  // console.log(responseDto.finalStateValue);
  // console.log(responseDto.iterationCount);

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Handle the streaming in a separate async function
  (async () => {
    try {
      // Send metrics
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: "metrics",
            data: {
              finalStateValue: 100,
              duration: 5000,
              iterationCount: 1000,
            },
          }) + "\n"
        )
      );

      for (let i = 0; i < responseDto.states.length; i++) {
        // console.log(i);
        await writer.write(
          encoder.encode(
            JSON.stringify({
              type: "states",
              index: i,
              data: responseDto.states[i],
            }) + "\n"
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const BATCH_SIZE = 100;
      for (let i = 0; i < responseDto.plots.length; i += BATCH_SIZE) {
        // console.log(i);
        const batch = responseDto.plots.slice(i, i + BATCH_SIZE);
        await writer.write(
          encoder.encode(
            JSON.stringify({
              type: "plots",
              index: i,
              total: responseDto.plots.length,
              data: batch,
            }) + "\n"
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Send completion message
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: "complete",
            timestamp: Date.now(),
          }) + "\n"
        )
      );

      // Close the writer to end the stream
      await writer.close();
    } catch (error) {
      console.error("Streaming error:", error);
      // Send error message before closing
      await writer.write(
        encoder.encode(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          }) + "\n"
        )
      );
      await writer.close();
    }
  })();

  // Clean up if client disconnects
  req.signal.addEventListener("abort", () => {
    writer.close();
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
