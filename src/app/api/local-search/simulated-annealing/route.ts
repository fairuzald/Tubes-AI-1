import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";

// Utility function to chunk array into smaller pieces
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Utility function to create a safe stringifiable chunk
function createChunk<T>(type: string, index: number, data: T) {
  return {
    type,
    index,
    data,
    timestamp: Date.now(), // Optional: for tracking chunk order
  };
}

export const GET = async () => {
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

  // console.log(responseDto.duration);
  // console.log(responseDto.finalStateValue);
  // console.log(responseDto.iterationCount);
  const responseDto = simulatedAnnealing.toSearchDto();

  const encoder = new TextEncoder();

  const stream = new TransformStream({
    async start(controller) {
      try {
        // Send metrics first (small enough to send as one chunk)
        const metrics = {
          finalStateValue: responseDto.finalStateValue,
          duration: responseDto.duration,
          iterationCount: responseDto.iterationCount,
        };

        controller.enqueue(
          encoder.encode(
            JSON.stringify(createChunk("metrics", 0, metrics)) + "\n"
          )
        );

        // Stream states in smaller chunks
        // First, flatten the 4D array into chunks
        const stateChunks = responseDto.states.map((state, stateIndex) => {
          // Break down each state into manageable chunks
          return {
            stateIndex,
            chunks: chunkArray(state.flat(3), 1000), // Adjust chunk size as needed
          };
        });

        // Send state chunks
        for (const { stateIndex, chunks } of stateChunks) {
          for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify(
                  createChunk("state", stateIndex, {
                    chunkIndex,
                    totalChunks: chunks.length,
                    data: chunks[chunkIndex],
                  })
                ) + "\n"
              )
            );

            // Add small delay to prevent overwhelming the client
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        // Stream plots in smaller chunks
        const PLOTS_CHUNK_SIZE = 100;
        const plotChunks = chunkArray(responseDto.plots, PLOTS_CHUNK_SIZE);

        for (let i = 0; i < plotChunks.length; i++) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify(
                createChunk("plots", i, {
                  chunkIndex: i,
                  totalChunks: plotChunks.length,
                  data: plotChunks[i],
                })
              ) + "\n"
            )
          );

          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        controller.terminate();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
};
