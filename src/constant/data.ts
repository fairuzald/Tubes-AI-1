const PLAYBACK_SPEEDS = [1, 1.5, 2, 3, 4, 5,8,10,15,20] as const;
const ALGORITHMS = {
  STEEPEST_ASCENT: "Steepest Ascent Hill Climbing",
  SIDEWAYS_MOVE: "Sideways Move Hill Climbing",
  STOCHASTIC: "Stochastic Hill Climbing",
  RANDOM_RESTART: "Random Restart Hill Climbing",
  SIMULATED_ANNEALING: "Simulated Annealing",
  GENETIC: "Genetic Algorithm",
} as const;

const INTERVAL_DURATION = 500;

type AlgorithmType = (typeof ALGORITHMS)[keyof typeof ALGORITHMS] | null;

export { PLAYBACK_SPEEDS, ALGORITHMS, type AlgorithmType, INTERVAL_DURATION };
