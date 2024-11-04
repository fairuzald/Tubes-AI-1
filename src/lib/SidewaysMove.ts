import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { SearchDto } from "./SearchDto";

export class SidewaysMove extends LocalSearch {
    private cube : MagicCube;

    private visitedStates = new Set<string>();

    constructor(cube:MagicCube){
        super(cube);
        this.cube = cube;

    }

    private serializeState(state : MagicCube) : string {
        return JSON.stringify(state);
    }

    public solve(maxSideways : number = 100) : void {

        this.startTimer();

        let currentState = this.cube;
        let currentSideways = 0;

        this.visitedStates.add(this.serializeState(currentState));

        while(currentState.calculateObjectiveFunction() !=  0 && currentSideways < maxSideways){
            const nextState = currentState.getBestSuccessor();

            const currentObj = currentState.calculateObjectiveFunction();
            const nextObj = nextState.calculateObjectiveFunction();

            const deltaE = nextObj - currentObj;

            this.addStateEntry(currentState);
            this.addObjectiveFunctionPlotEntry(this.iterationCount, currentObj);

            const serializedNextState = this.serializeState(nextState);

            if(deltaE >= 0){
                if(deltaE == 0){
                    currentSideways++;
                }
                this.addIterationCount();
                currentState = nextState;
                
                this.visitedStates.add(serializedNextState);
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