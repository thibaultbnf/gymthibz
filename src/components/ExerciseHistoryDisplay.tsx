"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dumbbell, History } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Workout } from "@/types/workout";
import { getExerciseHistory } from "@/utils/workoutCalculations";

interface ExerciseHistoryDisplayProps {
  exerciseName: string;
  allWorkouts: Workout[];
}

const ExerciseHistoryDisplay: React.FC<ExerciseHistoryDisplayProps> = ({
  exerciseName,
  allWorkouts,
}) => {
  const history = getExerciseHistory(allWorkouts, exerciseName);

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun historique trouvé pour cet exercice.
      </p>
    );
  }

  // Group history by date to show workout sessions
  const groupedHistory = history.reduce((acc, item) => {
    const date = item.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(item);
    return acc;
  }, {} as Record<string, typeof history>);

  const sortedDates = Object.keys(groupedHistory).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Limit to the last 3 workout dates for conciseness
  const limitedSortedDates = sortedDates.slice(0, 3);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <History className="h-4 w-4 mr-2 text-blue-500" /> Historique récent
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[150px] pr-4">
          {limitedSortedDates.map((date, dateIndex) => (
            <div key={date} className="mb-4 last:mb-0">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                {format(new Date(date), "PPP", { locale: fr })}
              </p>
              <ul className="space-y-1 pl-4">
                {groupedHistory[date].map((set, setIndex) => (
                  <li key={setIndex} className="text-xs text-gray-600 dark:text-gray-400">
                    Série {setIndex + 1} : {set.reps} reps @ {set.weight} kg
                    {set.weighted_kg && set.weighted_kg > 0 ? ` (+${set.weighted_kg} kg lesté)` : ''}
                  </li>
                ))}
              </ul>
              {dateIndex < limitedSortedDates.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExerciseHistoryDisplay;