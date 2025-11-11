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
import Login from "./pages/Login"; // Import the Login page
import { SessionContextProvider } from "./contexts/SessionContext"; // Import the SessionContextProvider

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SessionContextProvider> {/* Wrap the entire app with SessionContextProvider */}
          <Routes>
            <Route path="/login" element={<Login />} /> {/* Public login route */}
            <Route path="/" element={<MainLayout />}> {/* Protected routes inside MainLayout */}
              <Route index element={<Dashboard />} />
              <Route path="workouts" element={<WorkoutsPage />} />
              <Route path="workout-templates" element={<WorkoutTemplatesPage />} />
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