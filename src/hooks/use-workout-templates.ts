"use client";

import { useState, useEffect } from "react";
import { WorkoutTemplate } from "@/types/workout";

const LOCAL_STORAGE_KEY = "war-machine-workout-templates";

export function useWorkoutTemplates() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    try {
      const storedTemplates = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedTemplates) {
        setTemplates(JSON.parse(storedTemplates));
      }
    } catch (error) {
      console.error("Failed to load workout templates from localStorage", error);
      setTemplates([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error("Failed to save workout templates to localStorage", error);
    }
  }, [templates]);

  const addTemplate = (newTemplate: WorkoutTemplate) => {
    setTemplates((prevTemplates) => [...prevTemplates, newTemplate]);
  };

  const updateTemplate = (updatedTemplate: WorkoutTemplate) => {
    setTemplates((prevTemplates) =>
      prevTemplates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
    );
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((prevTemplates) => prevTemplates.filter((t) => t.id !== templateId));
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}