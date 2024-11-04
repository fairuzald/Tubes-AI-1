import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { SearchDto } from "./SearchDto";

export class SteepestAscent extends LocalSearch{

    private cube : MagicCube;

    constructor(cube:MagicCube){
        super(cube);
        this.cube = cube;
    }

    public solve(): void {

        this.startTimer();
        
        let currentState = this.cube;
        
        while(currentState.calculateObjectiveFunction() !=  0){
            const nextState = currentState.getBestSuccessor();

            const currentObj = currentState.calculateObjectiveFunction();
            const nextObj = nextState.calculateObjectiveFunction();

            const deltaE = nextObj - currentObj;

            this.addStateEntry(currentState);
            this.addObjectiveFunctionPlotEntry(this.iterationCount, currentObj);

            if(deltaE > 0){
                this.addIterationCount();
                currentState = nextState;
            }
            else{
                break;
            }
        }
        this.endTimer();
      
    }

    public toSearchDto() : SearchDto {
        return {
            duration: this.getDuration(),
            iterationCount : this.getIterationCount(),
            finalStateValue : this.getFinalObjectiveFunction(),
            states : this.getStates(),
            plots : [this.getObjectiveFunctionPlot()]
        }
    }

}