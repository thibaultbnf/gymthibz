"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Lightbulb } from "lucide-react"; // Added Lightbulb icon

const AICoachSection = () => {
  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-1"> {/* Adjusted span for better layout */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Votre Coach IA</CardTitle>
        <Brain className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-3">
          Prêt à débloquer votre plein potentiel ?
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Votre Coach IA est en pleine préparation pour vous offrir des analyses de performance,
          des recommandations d'entraînement personnalisées et des stratégies pour dépasser vos plateaux.
          Imaginez des séances optimisées pour vos objectifs, des ajustements de poids et de répétitions
          suggérés en temps réel, et des prédictions sur votre progression !
        </p>
        <div className="flex items-center mt-4 text-sm text-muted-foreground">
          <Lightbulb className="h-4 w-4 mr-2 text-yellow-500" />
          <span>Des fonctionnalités intelligentes arrivent très bientôt !</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AICoachSection;