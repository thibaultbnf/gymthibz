"use client";

import React, { useState } from "react";
import { useFoodLog } from "@/hooks/use-food-log";
import { FoodEntry } from "@/types/workout";
import AddFoodEntryForm from "@/components/AddFoodEntryForm";
import FoodLogCard from "@/components/FoodLogCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";

const FoodLogPage: React.FC = () => {
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, loading, error } = useFoodLog();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);

  const handleEditEntry = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingEntry(null);
  };

  const sortedFoodEntries = [...foodEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Chargement du journal alimentaire...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 text-center text-destructive">
        <h1 className="text-4xl font-bold mb-8">Erreur de chargement</h1>
        <p className="text-lg">Impossible de charger le journal alimentaire : {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mon Journal Alimentaire</h1>

      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)} className="mb-8">
          <PlusCircle className="h-4 w-4 mr-2" /> Ajouter une nouvelle entrée
        </Button>
      )}

      {showAddForm && (
        <AddFoodEntryForm
          onAddEntry={addFoodEntry}
          initialData={editingEntry || undefined}
          onUpdateEntry={updateFoodEntry}
          onCancel={handleCancelForm}
        />
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Historique des entrées</h2>
      {sortedFoodEntries.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucune entrée alimentaire enregistrée pour le moment. Commencez à suivre vos repas !
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sortedFoodEntries.map((entry) => (
            <FoodLogCard
              key={entry.id}
              entry={entry}
              onEdit={handleEditEntry}
              onDelete={deleteFoodEntry}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodLogPage;