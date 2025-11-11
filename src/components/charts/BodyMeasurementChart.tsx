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
import { BodyMeasurement } from "@/types/workout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BodyMeasurementChartProps {
  measurements: BodyMeasurement[];
  dataKey: keyof BodyMeasurement;
  title: string;
  unit: string;
}

const BodyMeasurementChart: React.FC<BodyMeasurementChartProps> = ({
  measurements,
  dataKey,
  title,
  unit,
}) => {
  if (measurements.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Aucune donnée de {title.toLowerCase()} pour afficher le graphique.
      </div>
    );
  }

  // Filter out null or zero values for the specific dataKey
  const filteredData = measurements.filter(m => m[dataKey] !== null && m[dataKey] !== 0);

  if (filteredData.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Aucune donnée valide de {title.toLowerCase()} pour afficher le graphique.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={filteredData}
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
            formatter={(value: number) => [`${value.toLocaleString('fr-FR')} ${unit}`, title]}
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
            dataKey={dataKey as string}
            stroke="hsl(var(--primary))"
            activeDot={{ r: 8 }}
            name={title}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BodyMeasurementChart;