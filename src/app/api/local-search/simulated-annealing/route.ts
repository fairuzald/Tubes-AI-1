import { NextResponse } from "next/server";
import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";

export const GET = async () => {
  // Initialize 5x5x5 magic cube
  const magicCube = new MagicCube();

  // Initialize search
  const initialTemperature = 10;
  const minimumTemperature = 0.8;
  const temperatureFunction =
    TemperatureFactory.logarithmicDecay(initialTemperature);
  const simulatedAnnealing = new SimulatedAnnealing(
    magicCube,
    temperatureFunction,
    minimumTemperature
  );

  // Solve
  simulatedAnnealing.solve();

  const responseDto = simulatedAnnealing.toSearchDto();

  console.log(responseDto.duration);
  console.log(responseDto.finalStateValue);
  console.log(responseDto.iterationCount);

  return NextResponse.json(responseDto);
};
