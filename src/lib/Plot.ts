export interface PlotData<X, Y> {
  x: X;
  y: Y;
}

export interface Plot<X, Y> {
  labelX: string;
  labelY: string;
  data: PlotData<X, Y>[];
}
