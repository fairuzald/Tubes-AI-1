import { Plot } from "@/lib/Plot";
import { MetricProps } from "@/utils/reducer";
import { useCallback, useRef } from "react";

interface StreamProcessorProps {
  onMetricsUpdate: (metrics: MetricProps) => void;
  onStatesUpdate: (states: number[][][][]) => void;
  onPlotsUpdate: (plots: Plot<number, number>[]) => void;
}

interface PlotData {
  objectiveFunctionPlot: Plot<number, number> | null;
  probabilityPlot: Plot<number, number> | null;
  states: number[][][][];
  stuckCounter: number;
}

export const useStreamProcessor = ({
  onMetricsUpdate,
  onStatesUpdate,
  onPlotsUpdate,
}: StreamProcessorProps) => {
  // Use ref to maintain data between renders and avoid race conditions
  const plotDataRef = useRef<PlotData>({
    objectiveFunctionPlot: null,
    probabilityPlot: null,
    states: [],
    stuckCounter: 0,
  });

  const updatePlotsIfReady = useCallback(() => {
    const { objectiveFunctionPlot, probabilityPlot } = plotDataRef.current;
    if (objectiveFunctionPlot && probabilityPlot) {
      onPlotsUpdate([objectiveFunctionPlot, probabilityPlot]);
    }
  }, [onPlotsUpdate]);

  const processStreamedData = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const decoder = new TextDecoder();
      let buffer = ""; // Buffer for incomplete messages

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append new chunk to buffer and process complete messages
          buffer += decoder.decode(value, { stream: true });

          let newlineIndex;
          while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const message = buffer.slice(0, newlineIndex);
            buffer = buffer.slice(newlineIndex + 1);

            if (!message) continue;

            try {
              const data = JSON.parse(message);

              switch (data.type) {
                case "metrics":
                  onMetricsUpdate(data.data);
                  break;

                case "states":
                  // Update states array
                  plotDataRef.current.states.push(...data.data);
                  onStatesUpdate(plotDataRef.current.states);
                  break;

                case "objectiveFunctionPlotMeta":
                  plotDataRef.current.objectiveFunctionPlot = {
                    labelX: data.data.labelX,
                    labelY: data.data.labelY,
                    data: [],
                  };
                  updatePlotsIfReady();
                  break;

                case "probabilityPlotMeta":
                  plotDataRef.current.probabilityPlot = {
                    labelX: data.data.labelX,
                    labelY: data.data.labelY,
                    data: [],
                  };
                  updatePlotsIfReady();
                  break;

                case "objectiveFunctionPlotData":
                  if (plotDataRef.current.objectiveFunctionPlot) {
                    const plot = plotDataRef.current.objectiveFunctionPlot;
                    // Ensure ordered insertion of data
                    plot.data.splice(data.index, 0, ...data.data);
                    updatePlotsIfReady();
                  }
                  break;

                case "probabilityPlotData":
                  if (plotDataRef.current.probabilityPlot) {
                    const plot = plotDataRef.current.probabilityPlot;
                    // Ensure ordered insertion of data
                    plot.data.splice(data.index, 0, ...data.data);
                    updatePlotsIfReady();
                  }
                  break;
              }
            } catch (error) {
              console.error("Error parsing message:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      }
    },
    [onMetricsUpdate, onStatesUpdate, updatePlotsIfReady]
  );

  return processStreamedData;
};
