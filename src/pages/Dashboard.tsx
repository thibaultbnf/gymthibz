"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AICoachSection from "@/components/AICoachSection"; // Import the new AI Coach section

const Dashboard = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Tableau de bord</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bienvenue, Future Machine de Guerre !</CardTitle>
          </CardHeader>
          <CardContent>
            <p>C'est ici que vous suivrez vos progrès et écraserez vos objectifs.</p>
            <p className="mt-2">Commencez par enregistrer un entraînement !</p>
          </CardContent>
        </Card>
        <AICoachSection /> {/* Add the AI Coach section here */}
        <Card>
          <CardHeader>
            <CardTitle>Progrès Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Graphique de progression à venir...</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dernier Entraînement</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Aucun entraînement enregistré pour le moment.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;