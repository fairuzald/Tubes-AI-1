interface PlotData {
  x: number;
  y: number;
}

export interface Plot {
  labelX: string;
  labelY: string;
  data: PlotData[];
}
