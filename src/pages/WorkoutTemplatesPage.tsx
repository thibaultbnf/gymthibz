"use client";

import React, { useState } from "react";
import { useWorkoutTemplates } from "@/hooks/use-workout-templates";
import { WorkoutTemplate } from "@/types/workout";
import AddWorkoutTemplateForm from "@/components/AddWorkoutTemplateForm";
import WorkoutTemplateCard from "@/components/WorkoutTemplateCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const WorkoutTemplatesPage = () => {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useWorkoutTemplates();
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setIsAddingTemplate(true);
  };

  const handleCancelForm = () => {
    setIsAddingTemplate(false);
    setEditingTemplate(null);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Modèles d'Entraînements</h1>

      {!isAddingTemplate && !editingTemplate && (
        <Button onClick={() => setIsAddingTemplate(true)} className="mb-8">
          <PlusCircle className="h-4 w-4 mr-2" /> Créer un nouveau modèle
        </Button>
      )}

      {(isAddingTemplate || editingTemplate) && (
        <AddWorkoutTemplateForm
          onAddTemplate={addTemplate}
          initialData={editingTemplate || undefined}
          onUpdateTemplate={updateTemplate}
          onCancel={handleCancelForm}
        />
      )}

      <h2 className="text-3xl font-bold mb-6 mt-12">Modèles existants</h2>
      {templates.length === 0 ? (
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Aucun modèle d'entraînement enregistré pour le moment. Créez votre première routine !
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <WorkoutTemplateCard
              key={template.id}
              template={template}
              onEdit={handleEditTemplate}
              onDelete={deleteTemplate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutTemplatesPage;