"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Utensils, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FoodEntry } from "@/types/workout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FoodLogCardProps {
  entry: FoodEntry;
  onEdit: (entry: FoodEntry) => void;
  onDelete: (id: string) => void;
}

const FoodLogCard: React.FC<FoodLogCardProps> = ({ entry, onEdit, onDelete }) => {
  const totalCalories = entry.items.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = entry.items.reduce((sum, item) => sum + item.protein, 0);
  const totalCarbs = entry.items.reduce((sum, item) => sum + item.carbs, 0);
  const totalFats = entry.items.reduce((sum, item) => sum + item.fats, 0);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">
          Journal du {format(new Date(entry.date), "PPP", { locale: fr })}
        </CardTitle>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => onEdit(entry)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action ne peut pas être annulée. Cela supprimera définitivement cette entrée
                  de votre journal alimentaire.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(entry.id)}>Supprimer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {entry.items.length === 0 ? (
          <CardDescription>Aucun aliment enregistré pour cette journée.</CardDescription>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center border-b pb-4">
              <div>
                <CardDescription>Calories</CardDescription>
                <p className="text-xl font-bold">{totalCalories} kcal</p>
              </div>
              <div>
                <CardDescription>Protéines</CardDescription>
                <p className="text-xl font-bold">{totalProtein.toFixed(1)} g</p>
              </div>
              <div>
                <CardDescription>Glucides</CardDescription>
                <p className="text-xl font-bold">{totalCarbs.toFixed(1)} g</p>
              </div>
              <div>
                <CardDescription>Lipides</CardDescription>
                <p className="text-xl font-bold">{totalFats.toFixed(1)} g</p>
              </div>
            </div>
            <h3 className="text-lg font-semibold flex items-center mt-4">
              <Utensils className="h-5 w-5 mr-2 text-primary" /> Détails des aliments
            </h3>
            <ul className="mt-2 space-y-2 pl-7">
              {entry.items.map((item) => (
                <li key={item.id} className="text-sm text-muted-foreground border-b last:border-b-0 pb-2">
                  <p className="font-medium text-foreground">{item.name} ({item.quantity})</p>
                  <p className="text-xs">
                    {item.calories} kcal | P: {item.protein.toFixed(1)}g | G: {item.carbs.toFixed(1)}g | L: {item.fats.toFixed(1)}g
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodLogCard;