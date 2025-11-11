export interface ExerciseSet {
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string; // Unique ID for each exercise within a workout
  name: string;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string; // Unique ID for the workout
  date: string; // ISO date string (e.g., 'YYYY-MM-DD')
  exercises: Exercise[];
}

export interface TemplateExerciseSet {
  targetReps: number;
  targetWeight: number;
}

export interface TemplateExercise {
  id: string; // Unique ID for each exercise within a template
  name: string;
  targetSets: TemplateExerciseSet[];
}

export interface WorkoutTemplate {
  id: string; // Unique ID for the workout template
  name: string;
  description?: string;
  exercises: TemplateExercise[];
}