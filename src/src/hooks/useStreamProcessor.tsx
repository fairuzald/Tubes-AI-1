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
  const plotDataRef = useRef<PlotData>({
    objectiveFunctionPlot: null,
    probabilityPlot: null,
    states: [],
    stuckCounter: 0,
  });

  const updatePlotsIfReady = useCallback(() => {
    const { objectiveFunctionPlot, probabilityPlot } = plotDataRef.current;
    if (objectiveFunctionPlot && probabilityPlot) {
      // Create new plot objects to avoid reference issues
      const plots = [
        { ...objectiveFunctionPlot, data: [...objectiveFunctionPlot.data] },
        { ...probabilityPlot, data: [...probabilityPlot.data] }
      ];
      onPlotsUpdate(plots);
    }
  }, [onPlotsUpdate]);

  const processStreamedData = useCallback(
    async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

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
                  // Create a new array to avoid reference issues
                  const updatedStates = [...plotDataRef.current.states, ...data.data];
                  plotDataRef.current.states = updatedStates;
                  onStatesUpdate(updatedStates);
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
                    // Create a new array and use spread operator to avoid mutation
                    const newData = [...plot.data];
                    newData.splice(data.index, 0, ...data.data);
                    plot.data = newData;
                    // Throttle updates to prevent stack overflow
                    requestAnimationFrame(() => updatePlotsIfReady());
                  }
                  break;

                case "probabilityPlotData":
                  if (plotDataRef.current.probabilityPlot) {
                    const plot = plotDataRef.current.probabilityPlot;
                    // Create a new array and use spread operator to avoid mutation
                    const newData = [...plot.data];
                    newData.splice(data.index, 0, ...data.data);
                    plot.data = newData;
                    // Throttle updates to prevent stack overflow
                    requestAnimationFrame(() => updatePlotsIfReady());
                  }
                  break;
              }
            } catch (error) {
              console.error("Error parsing message:", error, message);
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