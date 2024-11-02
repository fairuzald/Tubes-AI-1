import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";

export class SidewaysMove extends LocalSearch {
    private cube : MagicCube;

    constructor(cube:MagicCube){
        super(cube);
        this.cube = cube;

    }

    public solve(maxSideways : number = 100) : void {

        this.startTimer();

        let currentState = this.cube;
        let currentSideways = 0;

        while(currentState.calculateObjectiveFunction() !=  0 && currentSideways < maxSideways){
            const nextState = currentState.getBestSuccessor();

            const currentObj = currentState.calculateObjectiveFunction();
            const nextObj = nextState.calculateObjectiveFunction();

            const deltaE = nextObj - currentObj;

            this.addStateEntry(currentState);
            this.addObjectiveFunctionPlotEntry(this.iterationCount, currentObj);

            if(deltaE >= 0){
                if(deltaE == 0){
                    currentSideways++;
                }
                this.addIterationCount();
                currentState = nextState;
                
            }
            else{
                break;
            }

        }
        this.endTimer();
    }
}