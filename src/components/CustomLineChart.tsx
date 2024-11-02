"use client";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ChartData {
  x: number;
  y: number;
}

const chartConfig = {
  value: {
    label: "value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function CustomLineChart({
  childrenFooter,
  cardTitle,
  cardDescription,
  chartData,
}: {
  cardTitle?: string;
  cardDescription?: string;
  childrenFooter?: React.ReactNode;
  chartData: ChartData[];
}) {
  return (
    <Card>
      <CardHeader>
        {cardTitle && <CardTitle>{cardTitle}</CardTitle>}
        {cardDescription && (
          <CardDescription>{cardDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="x"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="y"
              type="natural"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-value)",
              }}
              activeDot={{
                r: 6,
              }}
            >
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      {childrenFooter && (
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {childrenFooter}
        </CardFooter>
      )}
    </Card>
  );
}
