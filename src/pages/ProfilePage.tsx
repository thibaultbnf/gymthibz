"use client";

import React from "react";
import ProfileForm from "@/components/ProfileForm";

const ProfilePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Mon Profil</h1>
      <ProfileForm />
    </div>
  );
};

export default ProfilePage;