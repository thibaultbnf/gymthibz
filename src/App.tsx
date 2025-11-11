import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import WorkoutsPage from "./pages/WorkoutsPage";
import WorkoutTemplatesPage from "./pages/WorkoutTemplatesPage";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import ProgressPage from "./pages/ProgressPage";
import WorkoutSchedulePage from "./pages/WorkoutSchedulePage";
import BodyMeasurementsPage from "./pages/BodyMeasurementsPage";
import FoodLogPage from "./pages/FoodLogPage";
import SetupGoalsAndSchedulePage from "./pages/SetupGoalsAndSchedulePage";
import ExercisesPage from "./pages/ExercisesPage"; // Import the new page
import { SessionContextProvider } from "./contexts/SessionContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="workouts" element={<WorkoutsPage />} />
              <Route path="workout-templates" element={<WorkoutTemplatesPage />} />
              <Route path="workout-schedule" element={<WorkoutSchedulePage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="measurements" element={<BodyMeasurementsPage />} />
              <Route path="food-log" element={<FoodLogPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="setup-goals-schedule" element={<SetupGoalsAndSchedulePage />} />
              <Route path="exercises" element={<ExercisesPage />} /> {/* Add the new route */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;