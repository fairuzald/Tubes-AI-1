interface PlotData<X, Y> {
  x: X;
  y: Y;
}

interface Plot<X, Y> {
  labelX: string;
  labelY: string;
  data: PlotData<X, Y>[];
}
