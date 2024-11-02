import { LocalSearch } from "./LocalSearch";

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
        const nextObj = nextState.calculateObjectiveFunction();

        const deltaE = nextObj - currentObj;

        this.addStateEntry(currentState);
        this.addObjectiveFunctionPlotEntry(this.iterationCount, currentObj); 
        
        this.addIterationCount();
        if(deltaE > 0){
          currentState = nextState;
        }
      }

    }
}
