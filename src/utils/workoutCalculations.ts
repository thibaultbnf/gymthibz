import { Workout } from "@/types/workout";

export interface WorkoutVolumeData {
  date: string;
  totalVolume: number;
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