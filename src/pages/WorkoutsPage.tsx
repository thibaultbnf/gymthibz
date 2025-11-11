"use client";

import React from "react";

const WorkoutsPage = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Mes Entraînements</h1>
      <p className="text-lg text-gray-700 dark:text-gray-300">
        C'est ici que vous pourrez enregistrer et consulter tous vos entraînements.
      </p>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        Bientôt, vous pourrez ajouter de nouvelles séances, suivre vos séries, répétitions et poids.
      </p>
    </div>
  );
};

export default WorkoutsPage;