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