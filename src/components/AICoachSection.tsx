"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";

const AICoachSection = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Votre Coach IA</CardTitle>
        <Brain className="h-6 w-6 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Bienvenue dans votre espace d'analyse intelligent !
        </p>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Pour le moment, je suis en phase d'apprentissage. Bientôt, je pourrai analyser vos entraînements,
          vous donner des conseils personnalisés, prédire vos performances et vous aider à optimiser
          votre progression pour devenir une véritable machine de guerre.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Restez à l'écoute pour les futures mises à jour !
        </p>
      </CardContent>
    </Card>
  );
};

export default AICoachSection;