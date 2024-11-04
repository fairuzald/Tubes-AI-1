interface ResultsDisplayProps {
  finalValue?: number | null;
  duration: number | null;
  iterationCount?: number | null;
  restartCount?: number | null;
  iterationCounter?: number[] | null;
  stuckFrequency?: number | null;
}

export const ResultsDisplay = ({
  finalValue,
  duration,
  iterationCount,
  restartCount,
  iterationCounter,
  stuckFrequency,
}: ResultsDisplayProps) => (
  <>
    {finalValue && duration && (
      <div className="flex flex-wrap gap-3 items-center justify-center">
        <p className="font-semibold">
          Duration:{" "}
          {Number.isInteger(duration)
            ? duration
            : Math.round(duration * 100) / 100}
          s
        </p>
        <p className="font-semibold">
          Final Objective Function Value: {finalValue}
        </p>
        {iterationCount && (
          <p className="font-semibold">Iteration Count: {iterationCount}</p>
        )}
        {restartCount && (
          <p className="font-semibold">Random Restart Count: {restartCount}</p>
        )}
        {stuckFrequency && (
          <p className="font-semibold">
            Stuck Frequency: {stuckFrequency}
          </p>
        )}
      </div>
    )}
    {iterationCounter && iterationCounter.length > 0 && (
      <div className="flex flex-col gap-0 text-center">
        <p className="font-semibold">Iteration Count per Restart</p>
        {iterationCounter.map((iteration, index) => (
          <p key={index} className="font-semibold">
            Iteration {index + 1}, Count: {iteration}
          </p>
        ))}
      </div>
    )}
  </>
);
