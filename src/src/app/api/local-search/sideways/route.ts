export const dynamic = 'force-dynamic';

import { MagicCube } from "@/lib/MagicCube"
import { SidewaysMove } from "@/lib/SidewaysMove";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req : NextRequest) => {

    const searchParams = req.nextUrl.searchParams;
    const maxSideways = searchParams.get("maxSideways");
    const magicCube = new MagicCube();

    const sideways = new SidewaysMove(magicCube);

    if(maxSideways !== null){
        sideways.solve(parseInt(maxSideways));
    }
    else{
        sideways.solve();
    }

    const responseDto = sideways.toSearchDto();

    return NextResponse.json(responseDto);

}