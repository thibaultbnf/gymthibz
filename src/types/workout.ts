export interface ExerciseSet {
  reps: number;
  weight: number;
  weighted_kg?: number | null; // New field for additional weighted weight
}

export interface Exercise {
  id: string; // Unique ID for each exercise within a workout
  exercise_id: string; // Reference to the master exercise definition
  name: string; // Denormalized name for easier display
  type: string; // ADDED: Type of exercise (e.g., 'free_weight', 'bodyweight')
  sets: ExerciseSet[];
}

export interface TemplateExerciseSet {
  targetReps: number;
  targetWeight: number;
  targetWeighted_kg?: number | null; // New field for additional weighted weight in templates
}

export interface TemplateExercise {
  id: string; // Unique ID for each exercise within a template
  exercise_id: string; // Reference to the master exercise definition
  name: string; // Denormalized name for easier display
  type: string; // ADDED: Type of exercise (e.g., 'free_weight', 'bodyweight')
  targetSets: TemplateExerciseSet[];
}

export interface Workout {
  id: string; // Unique ID for the workout
  date: string; // ISO date string (e.g., 'YYYY-MM-DD')
  exercises: Exercise[];
}

export interface WorkoutTemplate {
  id: string; // Unique ID for the workout template
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  focus_area?: string; // New field for workout focus
}

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  training_days_per_week: number | null;
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

export interface FoodItem {
  id: string; // Unique ID for each food item within an entry
  name: string;
  quantity: string; // e.g., "150g", "1 cup", "1 medium"
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface FoodEntry {
  id: string; // Unique ID for the food entry
  date: string; // ISO date string (e.g., 'YYYY-MM-DD')
  items: FoodItem[];
}

export interface ScheduledWorkout {
  id: string;
  day_of_week: number;
  focus_area: string[] | null; // Changed to array of strings
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: string; // 'machine', 'free_weight', 'bodyweight', 'cardio', etc.
  created_at: string;
}