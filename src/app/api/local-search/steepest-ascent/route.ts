import { MagicCube } from "@/lib/MagicCube";
import { SteepestAscent } from "@/lib/SteepestAscent";
import { NextResponse } from "next/server";

export const GET = async () => {

    const magicCube = new MagicCube();

    const steepestAscent = new SteepestAscent(magicCube);

    steepestAscent.solve();

    const responseDto = steepestAscent.toSearchDto();

    return NextResponse.json(responseDto);

};