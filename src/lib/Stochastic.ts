import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { SearchDto } from "./SearchDto";
export class Stochastic extends LocalSearch {
    private cube: MagicCube;


    constructor(cube: MagicCube) {
        super(cube);
        this.cube = cube;
      
    }

    public solve(nmax : number = 1000): void {
      let currentState = this.cube;

      for(let i = 0; i < nmax; i++){
        const nextState = currentState.generateRandomSuccessor();
        const currentObj = currentState.calculateObjectiveFunction();
        const nextObj = nextState.
        calculateObjectiveFunction();
        console.log(nextObj);

        const deltaE = nextObj - currentObj;

        this.addStateEntry(currentState);
        this.addObjectiveFunctionPlotEntry(this.iterationCount, currentObj); 
        
        this.addIterationCount();
        if(deltaE > 0){
          currentState = nextState;
        }
      }

    }

    public toSearchDto(): SearchDto {
        return {
            duration: this.getDuration(),
            iterationCount: this.getIterationCount(),
            finalStateValue: this.getFinalObjectiveFunction(),
            states: this.getStates(),
            plots: [this.getObjectiveFunctionPlot()]
        }
    }
}
