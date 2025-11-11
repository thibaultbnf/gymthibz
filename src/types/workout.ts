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

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  updated_at: string | null;
}

export interface BodyMeasurement {
  id: string;
  date: string; // ISO date string (e.g., 'YYYY-MM-DD')
  weight_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  arm_cm: number | null;
  leg_cm: number | null;
  hips_cm: number | null;
  neck_cm: number | null;
}