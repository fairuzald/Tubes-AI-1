
import { AlgorithmType } from "@/constant/data";
import { Plot } from "@/lib/Plot";
import { RandomRestartSearchDto } from "@/lib/RandomRestartHC";

interface State {
  selectedAlgorithm: AlgorithmType | null;
  isLoading: boolean;
  magicCubes: number[][][][] | null;
  currentStep: number;
  isPlaying: boolean;
  playbackSpeed: number;
  fileData: File | null;
  plots: Plot<number, number>[] | null;
  finalValue: number | null;
  duration: number;
}

// Action types
type Action =
  | { type: "SET_ALGORITHM"; payload: AlgorithmType }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_MAGIC_CUBES"; payload: number[][][][] }
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_PLAYBACK_SPEED"; payload: number }
  | { type: "SET_FILE_DATA"; payload: File | null }
  | { type: "SET_PLOTS"; payload: Plot<number, number>[] }
  | { type: "SET_RANDOM_STATE_SOLUTION"; payload: RandomRestartSearchDto }
  | { type: "RESET_STATE" }
  | { type: "CLEAR_CUBES" };

// Initial state
const initialState: State = {
  selectedAlgorithm: null,
  isLoading: false,
  magicCubes: null,
  currentStep: 0,
  isPlaying: false,
  playbackSpeed: 1,
  fileData: null,
  plots: null,
  finalValue: null,
  duration: 0,
};

// Reducer function
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_ALGORITHM":
      return { ...state, selectedAlgorithm: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_MAGIC_CUBES":
      return {
        ...state,
        magicCubes: action.payload,
        currentStep: 0,
        isPlaying: false,
      };
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload };
    case "SET_PLAYBACK_SPEED":
      return { ...state, playbackSpeed: action.payload };
    case "SET_FILE_DATA":
      return { ...state, fileData: action.payload };
    case "SET_RANDOM_STATE_SOLUTION":
      return {
        ...state,
        magicCubes: action.payload.states,
        plots: action.payload.plots,
        finalValue: action.payload.finalStateValue,
        duration: action.payload.duration,
        currentStep: 0,
        isPlaying: false,
      };
    case "RESET_STATE":
      return initialState;
    case "CLEAR_CUBES":
      return {
        ...state,
        magicCubes: null,
        currentStep: 0,
        isPlaying: false,
        plots: null,
        finalValue: null,
        duration: 0,
      };
    case "SET_PLOTS":
      return { ...state, plots: action.payload };
    default:
      return state;
  }
}

export { initialState, reducer };

