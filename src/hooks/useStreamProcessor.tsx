import { Plot } from "@/lib/Plot";
import { MetricProps } from "@/utils/reducer";
import { useCallback } from "react";

interface StreamProcessorProps {
  onMetricsUpdate: (metrics: MetricProps) => void;
  onStatesUpdate: (states: number[][][][]) => void;
  onPlotsUpdate: (plots: Plot<number, number>[]) => void;
}

export const useStreamProcessor = ({
  onMetricsUpdate,
  onStatesUpdate,
  onPlotsUpdate,
}: StreamProcessorProps) => {
  return useCallback(async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    const states: number[][][][] = [];
    const plots: Plot<number, number>[] = [];

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const messages = chunk.split("\n").filter(Boolean);

        for (const message of messages) {
          const data = JSON.parse(message);

          switch (data.type) {
            case "metrics":
              onMetricsUpdate(data.data);
              break;
            case "states":
              states[data.index] = data.data;
              onStatesUpdate(states);
              break;
            case "plots":
              plots.push(...data.data);
              if (data.index + data.data.length >= data.total) {
                onPlotsUpdate(plots);
              }
              break;
          }
        }
      }
    } catch (error) {
      console.error("Error processing stream:", error);
    }
  }, [onMetricsUpdate, onStatesUpdate, onPlotsUpdate]);
};