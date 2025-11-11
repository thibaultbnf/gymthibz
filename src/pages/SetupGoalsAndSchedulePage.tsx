"use client";

import React, { useState } from "react";
import GoalSettingForm from "@/components/GoalSettingForm";
import WorkoutSchedulePage from "@/pages/WorkoutSchedulePage"; // Re-use existing schedule page
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const SetupGoalsAndSchedulePage: React.FC = () => {
  const [goalsSet, setGoalsSet] = useState(false);

  const handleGoalsSaved = () => {
    setGoalsSet(true);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Configuration de vos Objectifs et Programme</h1>

      <GoalSettingForm onGoalsSaved={handleGoalsSaved} />

      {goalsSet && (
        <>
          <Separator className="my-12" />
          <h2 className="text-3xl font-bold mb-8 text-center">Étape 2: Définir votre Programme Hebdomadaire</h2>
          <WorkoutSchedulePage /> {/* Re-use the existing WorkoutSchedulePage */}
        </>
      )}
    </div>
  );
};

export default SetupGoalsAndSchedulePage;