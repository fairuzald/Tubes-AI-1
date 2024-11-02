import { GeneticAlgorithm } from "@/lib/GeneticAlgorithm"
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req : NextRequest) => {

    const searchParams = req.nextUrl.searchParams;
    const iterations = searchParams.get("iterations");
    const population_count = searchParams.get("population_count");
    let geneticAlgorithm;
    if(iterations === null || population_count === null) {
         geneticAlgorithm = new GeneticAlgorithm();
    }
    else{
        geneticAlgorithm = new GeneticAlgorithm(parseInt(iterations), parseInt(population_count));
    }
    geneticAlgorithm.run();

    const responseDto = geneticAlgorithm.toSearchDto();
    
    return NextResponse.json(responseDto);
}