"use client";
import { CustomLineChart } from "@/components/CustomLineChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Visualizer from "@/components/Visualizer";
import { cn } from "@/lib/utils";
import { convertToCSV, renderStateCSV } from "@/utils/state-processor";
import { useState, useRef } from "react";

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

const downloadCSV = () => {
  const matrix = generateDefaultMatrix();
  // Creating an array of three matrices for example
  const matrices = [matrix, matrix, matrix];
  const csvContent = convertToCSV(matrices);

  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  // Create a temporary link and trigger download
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "matrix_coordinates.csv");
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const playbackSpeeds = [1, 1.25, 1.5, 1.75, 2];

export default function Home() {
  const [magicCubes, setMagicCubes] = useState<number[][][][] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const maxStep = magicCubes ? magicCubes.length : 0;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSliderChange = (value: number[]) => {
    console.log(value);
    setCurrentStep(value[0]);
  };

  const onNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, maxStep));
  };

  const onPrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const loadCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const matrices = renderStateCSV(text, 5);
      setMagicCubes(matrices);
      setCurrentStep(0); // Reset to first step when loading new data
    };

    reader.readAsText(file);
  };

  const clearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMagicCubes(null);
    setCurrentStep(0);
  };

  const chartData = [
    { x: 1, y: 186 },
    { x: 2, y: 305 },
    { x: 3, y: 237 },
    { x: 4, y: 73 },
    { x: 5, y: 209 },
    { x: 6, y: 214 },
  ];

  return (
    <main className="p-4">
      <Visualizer
        matrixNumber={magicCubes?.[currentStep] || generateDefaultMatrix()}
        width={1000}
        height={500}
      />
      <div className="flex flex-col w-full items-center justify-center max-w-[1200px] m-auto">
        {/* Slider Component */}
        <div className="mt-4 mb-4 flex flex-col w-full items-center justify-center gap-4">
          <Slider
            defaultValue={[0]}
            value={[currentStep]}
            min={0}
            max={maxStep}
            step={1}
            onValueChange={handleSliderChange}
            className={cn("w-[60%]")}
            disabled={!magicCubes}
          />
          {/* Step info */}
          <div className="text-sm text-gray-600">
            Step: {currentStep} / {maxStep}
          </div>
          {/* Controls */}
          <div className="flex w-full items-center justify-center gap-3">
            {/* Prev */}
            <Button onClick={onPrev}>{"<<"}</Button>
            {/* Play/Pause */}
            <Button onClick={() => setIsPlaying((prev) => !prev)}>
              {isPlaying ? "Pause" : "Play"}
            </Button>
            {/* Playbacks */}
            <Select>
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Select a playbacks" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Playbacks</SelectLabel>
                  {playbackSpeeds.map((speed) => (
                    <SelectItem key={speed} value={speed.toString()}>
                      {speed}x
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {/* Next */}
            <Button onClick={onNext}>{">>"}</Button>
          </div>
        </div>

        {/* Content CSV */}
        <div className="m-auto flex flex-col gap-4 items-center justify-center">
          <div className="flex space-x-4 m-auto">
            <Button onClick={downloadCSV}>Download CSV</Button>
            {!!magicCubes && <Button onClick={clearFile}>Clear</Button>}
          </div>
          <div className="flex flex-col">
            <label className="mb-2">Load CSV File:</label>
            <Input
              type="file"
              accept=".csv"
              onChange={loadCSV}
              ref={fileInputRef}
              className="border p-2 rounded"
            />
          </div>
          {magicCubes && (
            <div className="mt-4">
              <p className="text-green-600">
                Loaded {magicCubes.length} matrices successfully!
              </p>
            </div>
          )}
        </div>

        <div className="w-full mt-10">
          <CustomLineChart
            chartData={chartData}
            cardTitle="Plot"
            cardDescription="Ini desctiption"
          />
        </div>
      </div>
    </main>
  );
}
