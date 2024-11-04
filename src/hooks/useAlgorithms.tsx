import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";
import { SearchDto } from "@/lib/SearchDto";
import { useCallback } from "react";
import { useToast } from "./use-toast";

export const useAlgorithms = (
  onSolutionUpdate: (data: SearchDto | RandomRestartSearchDto) => void
) => {
  const { toast } = useToast();

  const fetchRandomRestartData = useCallback(
    async (restartNumber: number) => {
      const toastId = toast({
        title: "Processing",
        description: "Running Random Restart Hill Climbing...",
      }).id;

      try {
        const response = await fetch(
          `/api/local-search/random-restart?maxRestarts=${restartNumber}`
        );
        const data: RandomRestartSearchDto = await response.json();
        onSolutionUpdate(data);
        
        toast({
          id: toastId,
          title: "Success",
          description: "Random Restart Hill Climbing completed!",
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        toast({
          id: toastId,
          title: "Error",
          description: "Failed to run Random Restart Hill Climbing",
          variant: "destructive",
        });
      }
    },
    [onSolutionUpdate, toast]
  );

  const fetchSimulatedAnnealingStream = useCallback(
    async (
      abortController: AbortController,
      processStreamedData: (
        reader: ReadableStreamDefaultReader<Uint8Array>
      ) => Promise<void>
    ) => {
      const toastId = toast({
        title: "Processing",
        description: "Running Simulated Annealing...",
      }).id;

      try {
        const response = await fetch("/api/local-search/simulated-annealing", {
          signal: abortController.signal,
        });
        
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        await processStreamedData(reader);
        
        toast({
          id: toastId,
          title: "Success",
          description: "Simulated Annealing completed!",
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        toast({
          id: toastId,
          title: "Error",
          description: "Failed to run Simulated Annealing",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const fetchSteepestAscentData = async () => {
    const toastId = toast({
      title: "Processing",
      description: "Running Steepest Ascent...",
    }).id;

    try {
      const response = await fetch(`/api/local-search/steepest-ascent`);
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
      
      toast({
        id: toastId,
        title: "Success",
        description: "Steepest Ascent completed!",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        id: toastId,
        title: "Error",
        description: "Failed to run Steepest Ascent",
        variant: "destructive",
      });
    }
  };

  const fetchSidewaysMoveData = async (sidewaysNumber: number) => {
    const toastId = toast({
      title: "Processing",
      description: "Running Sideways Move...",
    }).id;

    try {
      const response = await fetch(
        `/api/local-search/sideways?maxSideways=${sidewaysNumber}`
      );
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
      
      toast({
        id: toastId,
        title: "Success",
        description: "Sideways Move completed!",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        id: toastId,
        title: "Error",
        description: "Failed to run Sideways Move",
        variant: "destructive",
      });
    }
  };

  const fetchStochasticData = async (nmax: number) => {
    const toastId = toast({
      title: "Processing",
      description: "Running Stochastic Hill Climbing...",
    }).id;

    try {
      const response = await fetch(`/api/local-search/stochastic?nmax=${nmax}`);
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
      
      toast({
        id: toastId,
        title: "Success",
        description: "Stochastic Hill Climbing completed!",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        id: toastId,
        title: "Error",
        description: "Failed to run Stochastic Hill Climbing",
        variant: "destructive",
      });
    }
  };

  const fetchGeneticData = async (
    populationSize?: number,
    iterations?: number
  ) => {
    const toastId = toast({
      title: "Processing",
      description: "Running Genetic Algorithm...",
    }).id;

    try {
      const response = await fetch(
        `/api/local-search/genetic?population_count=${populationSize}&iterations=${iterations}`
      );
      const data: SearchDto = await response.json();
      onSolutionUpdate(data);
      
      toast({
        id: toastId,
        title: "Success",
        description: "Genetic Algorithm completed!",
        variant: "success",
      });
    } catch (error) {
      console.error(error);
      toast({
        id: toastId,
        title: "Error",
        description: "Failed to run Genetic Algorithm",
        variant: "destructive",
      });
    }
  };

  return {
    fetchRandomRestartData,
    fetchSimulatedAnnealingStream,
    fetchSteepestAscentData,
    fetchSidewaysMoveData,
    fetchGeneticData,
    fetchStochasticData,
  };
};