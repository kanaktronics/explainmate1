
"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface ProgressChartProps {
    data: { date: string; progress: number }[];
}

const chartConfig = {
  progress: {
    label: "Progress",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function ProgressChart({ data }: ProgressChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Progress Over Time</CardTitle>
                    <CardDescription>Your learning progress over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-48 flex items-center justify-center text-muted-foreground">
                        Not enough data to display progress chart.
                    </div>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Over Time</CardTitle>
        <CardDescription>Your learning progress over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 5,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const [year, month, day] = value.split('-').map(Number);
                const date = new Date(year, month - 1, day);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
              }}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="progress"
              type="monotone"
              stroke="var(--color-progress)"
              strokeWidth={2}
              dot={{
                fill: "var(--color-progress)",
              }}
              activeDot={{
                r: 6,
              }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
