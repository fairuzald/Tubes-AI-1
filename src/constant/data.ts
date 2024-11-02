const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;
const ALGORITHMS = {
  STEEPEST_ASCENT: "Steepest Ascent Hill Climbing",
  SIDEWAYS_MOVE: "Sideways Move Hill Climbing",
  STOCHASTIC: "Stochastic Hill Climbing",
  RANDOM_RESTART: "Random Restart Hill Climbing",
  SIMULATED_ANNEALING: "Simulated Annealing",
  GENETIC: "Genetic Algorithm",
} as const;

const INTERVAL_DURATION = 500;

type AlgorithmType = (typeof ALGORITHMS)[keyof typeof ALGORITHMS];

export { PLAYBACK_SPEEDS, ALGORITHMS, type AlgorithmType, INTERVAL_DURATION };
