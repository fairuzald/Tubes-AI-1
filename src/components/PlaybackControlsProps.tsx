import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PLAYBACK_SPEEDS } from "@/constant/data";

export interface PlaybackControlsProps {
  isPlaying: boolean;
  disabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPlayPause: () => void;
  onSpeedChange: (value: string) => void;
}

const PlaybackControls = ({
  isPlaying,
  disabled,
  onPrev,
  onNext,
  onPlayPause,
  onSpeedChange,
}: PlaybackControlsProps) => (
  <div className="flex w-full items-center justify-center gap-3">
    <Button onClick={onPrev} disabled={disabled}>
      {"<<"}
    </Button>
    <Button
      onClick={onPlayPause}
      disabled={disabled}
      className={cn(
        isPlaying
          ? "bg-red-500 hover:bg-red-600"
          : "bg-green-500 hover:bg-green-600"
      )}
    >
      {isPlaying ? "Pause" : "Play"}
    </Button>
    <Select onValueChange={onSpeedChange} defaultValue="1" disabled={disabled}>
      <SelectTrigger className="w-[80px]">
        <SelectValue placeholder="Speed" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Playbacks</SelectLabel>
          {PLAYBACK_SPEEDS.map((speed) => (
            <SelectItem key={speed} value={speed.toString()}>
              {speed}x
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
    <Button onClick={onNext} disabled={disabled}>
      {">>"}
    </Button>
  </div>
);

export default PlaybackControls;
