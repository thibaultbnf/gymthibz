import { Workout, ExerciseSet, TemplateExerciseSet } from "@/types/workout";

export interface WorkoutVolumeData {
  date: string;
  totalVolume: number;
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  date: string; // Date when the PR was achieved
}

/**
 * Calcule le volume total d'entraînement pour chaque jour.
 * Volume = Somme (répétitions * poids) pour toutes les séries de tous les exercices d'un entraînement.
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets { date, totalVolume } trié par date.
 */
export const calculateWorkoutVolume = (workouts: Workout[]): WorkoutVolumeData[] => {
  const volumeMap = new Map<string, number>();

  workouts.forEach(workout => {
    let dailyVolume = 0;
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        dailyVolume += set.reps * set.weight;
      });
    });

    // Si plusieurs entraînements le même jour, additionner les volumes
    volumeMap.set(workout.date, (volumeMap.get(workout.date) || 0) + dailyVolume);
  });

  const data = Array.from(volumeMap.entries()).map(([date, totalVolume]) => ({
    date,
    totalVolume,
  }));

  // Trier par date
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return data;
};

/**
 * Calcule les records personnels (max poids) pour chaque exercice.
 * @param workouts Tableau des entraînements.
 * @returns Tableau d'objets PersonalRecord.
 */
export const calculatePersonalRecords = (workouts: Workout[]): PersonalRecord[] => {
  const prMap = new Map<string, { maxWeight: number; date: string }>();

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        const currentMax = prMap.get(exercise.name);
        if (!currentMax || set.weight > currentMax.maxWeight) {
          prMap.set(exercise.name, { maxWeight: set.weight, date: workout.date });
        } else if (set.weight === currentMax.maxWeight && new Date(workout.date) < new Date(currentMax.date)) {
          // If same weight, keep the earliest date
          prMap.set(exercise.name, { maxWeight: set.weight, date: workout.date });
        }
      });
    });
  });

  const prs: PersonalRecord[] = Array.from(prMap.entries()).map(([exerciseName, data]) => ({
    exerciseName,
    maxWeight: data.maxWeight,
    date: data.date,
  }));

  // Sort PRs alphabetically by exercise name
  prs.sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

  return prs;
};

/**
 * Extracts all sets for a specific exercise from the user's entire workout history,
 * sorted by date descending.
 * @param workouts All user workouts.
 * @param exerciseName The name of the exercise to get history for.
 * @returns An array of objects { date, reps, weight } for the given exercise.
 */
export const getExerciseHistory = (
  workouts: Workout[],
  exerciseName: string
): { date: string; reps: number; weight: number }[] => {
  const history: { date: string; reps: number; weight: number }[] = [];

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (exercise.name.toLowerCase() === exerciseName.toLowerCase()) {
        exercise.sets.forEach(set => {
          history.push({
            date: workout.date,
            reps: set.reps,
            weight: set.weight,
          });
        });
      }
    });
  });

  // Sort by date descending (most recent first)
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return history;
};

/**
 * Generates smart suggestions for reps and weight for a single set,
 * based on historical performance and template targets.
 * @param history All historical sets for the specific exercise, sorted by date descending.
 * @param templateTarget The target reps/weight from the workout template for this set.
 * @returns Suggested reps and weight.
 */
export const getSmartSetSuggestion = (
  history: { date: string; reps: number; weight: number }[],
  templateTarget: TemplateExerciseSet
): ExerciseSet => {
  const { targetReps, targetWeight } = templateTarget;

  // Default to template target if no history or if template target is 0
  if (history.length === 0 || (targetReps === 0 && targetWeight === 0)) {
    return { reps: targetReps, weight: targetWeight };
  }

  // Find the most recent set that achieved or exceeded the target reps with a positive weight
  const lastSuccessfulSet = history.find(
    (h) => h.reps >= targetReps && h.weight > 0
  );

  if (lastSuccessfulSet) {
    // Suggest a slight increase in weight (e.g., 2.5kg)
    const suggestedWeight = lastSuccessfulSet.weight + 2.5;
    return { reps: targetReps, weight: suggestedWeight };
  } else {
    // If no successful set found for target reps, suggest the template target weight
    // or the highest weight ever lifted for any reps if template target is 0
    const highestWeightEver = history.reduce((max, h) => Math.max(max, h.weight), 0);
    const suggestedWeight = targetWeight > 0 ? targetWeight : highestWeightEver > 0 ? highestWeightEver : 0;
    return { reps: targetReps, weight: suggestedWeight };
  }
};