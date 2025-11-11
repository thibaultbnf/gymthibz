"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  CartesianGrid,
} from "recharts";
import { Workout } from "@/types/workout";
import { calculateWorkoutVolume } from "@/utils/workoutCalculations";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface WorkoutVolumeChartProps {
  workouts: Workout[];
}

const WorkoutVolumeChart: React.FC<WorkoutVolumeChartProps> = ({ workouts }) => {
  const data = calculateWorkoutVolume(workouts);

  if (data.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Aucune donnée d'entraînement pour afficher le volume.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) => format(new Date(tick), "dd/MM", { locale: fr })}
            className="fill-foreground text-xs"
          />
          <YAxis className="fill-foreground text-xs" />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString('fr-FR')} kg`, 'Volume Total']}
            labelFormatter={(label: string) => format(new Date(label), "PPP", { locale: fr })}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
          />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          <Line
            type="monotone"
            dataKey="totalVolume"
            stroke="hsl(var(--primary))"
            activeDot={{ r: 8 }}
            name="Volume Total (kg)"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WorkoutVolumeChart;