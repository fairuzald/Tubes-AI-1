import Visualizer from "@/components/Visualizer";
import Image from "next/image";

const generateDefaultMatrix = (): number[][][] => {
  const matrix: number[][][] = [];
  let value = 1;

  for (let z = 0; z < 5; z++) {
    const plane: number[][] = [];
    for (let y = 0; y < 5; y++) {
      const row: number[] = [];
      for (let x = 0; x < 5; x++) {
        row.push(value);
        value++;
      }
      plane.push(row);
    }
    matrix.push(plane);
  }

  return matrix;
};

export default function Home() {
  return (
    <main>
      <Visualizer
        matrixNumber={generateDefaultMatrix()}
        width={1000}
        height={500}
      />
    </main>
  );
}
