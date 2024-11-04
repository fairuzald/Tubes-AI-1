import { randInt } from "three/src/math/MathUtils.js";
import { LocalSearch } from "./LocalSearch";
import { MagicCube } from "./MagicCube";
import { Plot } from "./Plot";
import { SearchDto } from "./SearchDto";

// type Position = [number, number, number];

export class GeneticAlgorithm extends LocalSearch
{
        private iterations: number;
        private population_count: number;
        private population: MagicCube[] = [];
        private averagePlot: Plot<number, number>;
        
        constructor(iterations: number = 10, population_count: number = 10) 
        {
                super(new MagicCube());
                this.iterations = iterations;
                this.population_count = population_count;
                this.initializePopulation();
                this.averagePlot = {
                        labelX: "Iterasi",
                        labelY: "Objective Average",
                        data: [],
                };
        }
        
        public initializePopulation(): void 
        {
                this.population = Array.from(
                        { length: this.population_count }, 
                        () => new MagicCube()
                );
        }

        private partiallyMappedCrossover(parent1: number[], parent2: number[]): number[] {
                const length = parent1.length;
                if (length !== 125 || parent2.length !== 125) {
                    throw new Error("Both parents must be arrays of length 125");
                }
            
                // Initialize the child with -1 (indicating empty positions)
                const child = new Array(length).fill(-1);
            
                // Select two random crossover points
                let crossoverPoint1 = Math.floor(Math.random() * length);
                let crossoverPoint2 = Math.floor(Math.random() * length);
                while (crossoverPoint2 === crossoverPoint1) {
                    crossoverPoint2 = Math.floor(Math.random() * length);
                }
            
                // Ensure crossoverPoint1 is less than crossoverPoint2
                if (crossoverPoint1 > crossoverPoint2) {
                    [crossoverPoint1, crossoverPoint2] = [crossoverPoint2, crossoverPoint1];
                }
            
                // Copy the segment from parent1 to the child
                for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
                    child[i] = parent1[i];
                }
            
                // Map the elements from parent2 to the child
                for (let i = crossoverPoint1; i <= crossoverPoint2; i++) {
                    const element = parent2[i];
                    if (!child.includes(element)) {
                        let position = i;
                        while (child[position] !== -1) {
                            position = parent2.indexOf(parent1[position]);
                        }
                        child[position] = element;
                    }
                }
            
                // Fill in the remaining positions from parent2
                for (let i = 0; i < length; i++) {
                    if (child[i] === -1) {
                        child[i] = parent2[i];
                    }
                }
            
                return child;
        }
            
        public combine(p1: MagicCube, p2: MagicCube): MagicCube {

                const parent1 = [];
                const parent2 = [];
                for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                for (let k = 0; k < 5; k++)
                {
                        parent1.push(p1.getElement([i, j, k]));
                        parent2.push(p2.getElement([i, j, k]));
                }

                const child = this.partiallyMappedCrossover(parent1, parent2);
                const childCube = new MagicCube();
                for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                for (let k = 0; k < 5; k++)
                childCube.setElement([i, j, k], child[i * 25 + j * 5 + k]);
                return childCube;
        }

        public sortPopulation()
        {
                this.population.sort((a: MagicCube, b: MagicCube) => 
                        a.calculateObjectiveFunction() - b.calculateObjectiveFunction()
                )
        }

        public nextGeneration()
        {
                const chances = this.population.map(
                        cube => -cube.calculateObjectiveFunction());
                
                // for (let i = 0; i < this.population_count; i++)
                chances.sort((a, b) => a - b);
                
                this.sortPopulation();
                this.addStateEntry(this.population[this.population_count - 1]);

                const nextPopulation = this.population.slice(this.population_count / 2, undefined);
                for (let i = 1; i < this.population_count; ++i)
                chances[i] += chances[i - 1];
                this.addAveragePlotEntry(this.iterationCount, 
                        - chances[this.population_count-1] / this.population_count);

                chances.unshift(0);
                for (let i = 0; i < this.population_count / 2; i++)
                {
                        let mn = chances[0];
                        let mx = chances[chances.length-1];
                        let RANDVAL = randInt(mn, mx);
                        let l = 0;
                        let r = this.population_count;
                        while (r - l > 1)
                        {
                                const m = (l + r) >> 1;
                                if (chances[m] > RANDVAL) r = m;
                                else l = m;
                        } const p1 = this.population[l];
                        
                        mn = chances[0];
                        mx = chances[chances.length-1];
                        RANDVAL = randInt(mn, mx);
                        l = 0;
                        r = this.population_count;
                        while (r - l > 1)
                        {
                                const m = (l + r) >> 1;
                                if (chances[m] > RANDVAL) r = m;
                                else l = m;
                        } const p2 = this.population[l];

                        nextPopulation.push(this.combine(p1, p2));
                }

                this.population = nextPopulation;
        }

        public run(): void
        {
                this.startTimer();
                while(this.iterations--)
                {
                        this.addIterationCount();
                        this.addObjectiveFunctionPlotEntry(this.iterationCount, this.population[this.population_count-1].calculateObjectiveFunction());
                        this.nextGeneration();

                }
                this.sortPopulation();
                this.addStateEntry(this.population[this.population_count-1]);
                this.endTimer();
                
        }

        public addAveragePlotEntry(iteration: number, value: number): void
        {
                this.averagePlot.data.push({ x: iteration, y: value });
        }
        public toSearchDto() : SearchDto {
                return {
                    duration: this.getDuration(),
                    iterationCount : this.getIterationCount(),
                    finalStateValue : this.getFinalObjectiveFunction(),
                    states : this.getStates(),
                    plots : [this.getObjectiveFunctionPlot(), this.averagePlot]
                }
        }
}
