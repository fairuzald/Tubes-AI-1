export const dynamic = 'force-dynamic';

import { MagicCube } from "@/lib/MagicCube"
import { Stochastic } from "@/lib/Stochastic";

import { NextRequest, NextResponse } from "next/server";

export const GET = async (req : NextRequest) => {

    const searchParams = req.nextUrl.searchParams;
    const nmax = searchParams.get("nmax");
    const magicCube = new MagicCube();

    const stochastic = new Stochastic(magicCube);

    if (nmax !== null) {
        stochastic.solve(parseInt(nmax));
    } else {
        stochastic.solve();
    }
    
    const responseDto = stochastic.toSearchDto();

    return NextResponse.json(responseDto);
}