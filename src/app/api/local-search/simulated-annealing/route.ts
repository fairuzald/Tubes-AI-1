import { NextResponse } from "next/server";
import {
  SimulatedAnnealing,
  TemperatureFactory,
} from "@/lib/SimulatedAnnealing";
import { MagicCube } from "@/lib/MagicCube";

export const GET = async () => {
  const magicCube = new MagicCube();
  const minimumTemperature = Number.MIN_VALUE;
  const initialTemperature = 200;
  const alpha = 0.99955;
  const temperatureFunction =
    // TemperatureFactory.logarithmicDecay(initialTemperature);
    TemperatureFactory.exponentialDecay(initialTemperature, alpha);

  const simulatedAnnealing = new SimulatedAnnealing(
    magicCube,
    temperatureFunction,
    minimumTemperature
  );

  // Solve
  simulatedAnnealing.solve();

  const responseDto = simulatedAnnealing.toSearchDto();

  // console.log(responseDto.duration);
  // console.log(responseDto.finalStateValue);
  // console.log(responseDto.iterationCount);

  return NextResponse.json(responseDto);
};
