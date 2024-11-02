import { DataUtils } from "three";
import { randInt } from "three/src/math/MathUtils.js";

class GeneticAlgorithm
{
        private iterations: number;
        private population_count: number;
        private population: MagicCube[] = [];
        
        constructor(iterations: number, population_count: number, cubeSize: number) 
        {
                this.iterations = iterations;
                this.population_count = population_count;
                this.initializePopulation(cubeSize);
        }
        
        public initializePopulation(cubeSize: number): void 
        {
                this.population = Array.from(
                        { length: this.population_count }, 
                        () => new MagicCube(cubeSize)
                );
        }

        public combine(p1: MagicCube, p2: MagicCube)
        {
                let seen = new Array(125).fill(false);
                let dupe_positions = [];
                let child = new MagicCube(5);
                let cnt = 0;
                for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                for (let k = 0; k < 5; k++)
                child.setElement([i, j, k], (cnt++ < 63 ? p1 : p2).getElement([i, j, k]));
                for (let i = 0; i < 5; i++)
                for (let j = 0; j < 5; j++)
                for (let k = 0; k < 5; k++)
                seen[25*i + 5*j + k - 1] ?
                dupe_positions.push(25*i + 5*j + k - 1):
                seen[25*i + 5*j + k - 1] = true;
                let i = 0;
                for (let x of dupe_positions) 
                {
                        while(seen[i])i++;
                        child.setElement([
                                Math.floor(x / 25), 
                                Math.floor((x % 25) / 5), 
                                Math.floor((x % 25) % 5)
                        ], ++i);
                }
                return child;
        }

        public sortPopulation()
        {
                this.population.sort((a: MagicCube, b: MagicCube) => 
                        a.calculateObjectiveFunction() - b.calculateObjectiveFunction()
                )
        }

        public nextGeneration()
        {
                let nextPopulation: MagicCube[] = [];
                let chances = this.population.map(
                        cube => cube.calculateObjectiveFunction());
                chances[0] += 109;
                for (let i = 1; i < this.population_count; ++i)
                chances[i] += chances[i - 1];
                for (let i = 0; i < this.population_count; i += 2)
                {
                        let mx = chances[-1];
                        let mn = 0;
                        let RANDVAL = randInt(mn, mx);
                        let l = 0;
                        let r = this.population_count;
                        while (r - l > 1)
                        {
                                let m = (l + r) >> 1;
                                if (chances[m] > RANDVAL) r = m;
                                else l = m;
                        } let p1 = this.population[l];
                        
                        mx = chances[-1];
                        mn = 0;
                        RANDVAL = randInt(mn, mx);
                        l = 0;
                        r = this.population_count;
                        while (r - l > 1)
                        {
                                let m = (l + r) >> 1;
                                if (chances[m] > RANDVAL) r = m;
                                else l = m;
                        } let p2 = this.population[l];

                        nextPopulation.push(this.combine(p1, p2));
                        nextPopulation.push(this.combine(p2, p1));
                }

                this.population = nextPopulation;
        }

        public run(): MagicCube
        {
                while(this.iterations--)
                this.nextGeneration();
                this.sortPopulation();
                return this.population[0];
        }
}
