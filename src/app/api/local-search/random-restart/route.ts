export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { MagicCube } from "@/lib/MagicCube";
import { RandomRestartHC } from "@/lib/RandomRestartHC";

export const GET = async (request: NextRequest) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const maxRestarts = parseInt(searchParams.get("maxRestarts") ?? "5", 10);

    // Validate maxRestarts
    if (isNaN(maxRestarts) || maxRestarts < 1) {
      return NextResponse.json(
        { error: "maxRestarts must be a positive number" },
        { status: 400 }
      );
    }

    // Initialize 5x5x5 magic cube
    const magicCube = new MagicCube();

    // Initialize search
    const randomRestart = new RandomRestartHC(magicCube, maxRestarts);

    // Solve with maxRestarts parameter
    randomRestart.solve();

    const responseDto = randomRestart.toSearchDto();

    return NextResponse.json(responseDto);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
};
