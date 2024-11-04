import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";
import { SearchDto } from "@/lib/SearchDto";
import { useCallback } from "react";

export const useAlgorithms = (
  onSolutionUpdate: (data: SearchDto | RandomRestartSearchDto) => void
) => {
  const fetchRandomRestartData = useCallback(
    async (restartNumber: number) => {
      try {
        const response = await fetch(
          `/api/local-search/random-restart?maxRestarts=${restartNumber}`
        );
        const data: RandomRestartSearchDto = await response.json();
        onSolutionUpdate(data);
      } catch (error) {
        console.error("Error fetching random restart data:", error);
      }
    },
    [onSolutionUpdate]
  );

  const fetchSimulatedAnnealingStream = useCallback(
    async (abortController: AbortController, processStreamedData: (reader: ReadableStreamDefaultReader<Uint8Array>) => Promise<void>) => {
      try {
        const response = await fetch("/api/local-search/simulated-annealing", {
          signal: abortController.signal,
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        await processStreamedData(reader);
      } catch (error) {
        console.error("Error fetching simulated annealing data:", error);
      }
    },
    []
  );

  const fetchSteepestAscentData = async () => {
    try {
      const response = await fetch(`/api/local-search/steepest-ascent`);
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
    } catch (error) {
      console.error("Error fetching steepest ascent data:", error);
    }
  };

  const fetchSidewaysMoveData = async (sidewaysNumber: number) => {
    try {
      const response = await fetch(
        `/api/local-search/sideways?maxSideways=${sidewaysNumber}`
      );
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
    } catch (error) {
      console.error("Error fetching sideways move data:", error);
    }
  };

  const fetchStochasticData = async (nmax: number) => {
    try {
      const response = await fetch(`/api/local-search/stochastic?nmax=${nmax}`);
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
    } catch (error) {
      console.error("Error fetching stochastic data:", error);
    }
  };

  return {
    fetchRandomRestartData,
    fetchSimulatedAnnealingStream,
    fetchSteepestAscentData,
    fetchSidewaysMoveData,
    fetchStochasticData,
  };
};
