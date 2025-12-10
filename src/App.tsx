import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Chatbot } from "./components/Chatbot";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { LearningModules } from "./components/LearningModules";
import { LoanSimulator } from "./components/LoanSimulator";
import { Profile } from "./components/Profile";
import { Leaderboard } from "./components/Leaderboard";
import { useState, useEffect } from "react";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              FinWise
            </h1>
          </div>
          <Authenticated>
            <div className="flex items-center gap-4">
              <UserCoins />
              <SignOutButton />
            </div>
          </Authenticated>
        </div>
      </header>

      <main className="flex-1">
        <Authenticated>
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="mt-6">
              {activeTab === "dashboard" && <Dashboard setActiveTab={setActiveTab} />}
              {activeTab === "learn" && <LearningModules />}
              {activeTab === "simulator" && <LoanSimulator />}
              {activeTab === "profile" && <Profile />}
              {activeTab === "leaderboard" && <Leaderboard />}
            </div>
          </div>
          <Chatbot />
        </Authenticated>

        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-2xl">₹</span>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
                  Welcome to FinWise
                </h1>
                <p className="text-gray-600 text-lg">
                  Learn financial literacy through interactive games and simulations
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      <Toaster />
    </div>
  );
}

function UserCoins() {
  const profile = useQuery(api.profile.getUserProfile);
  const createProfile = useMutation(api.profile.createUserProfile);
  
  useEffect(() => {
    if (profile === null) {
      createProfile();
    }
  }, [profile, createProfile]);
  
  if (!profile) return null;

  return (
    <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-full">
      <span className="text-yellow-600 font-medium">🪙</span>
      <span className="font-semibold text-yellow-700">{profile.totalCoins}</span>
    </div>
  );
}

function Navigation({ activeTab, setActiveTab }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "learn", label: "Learn", icon: "📖" },
    { id: "simulator", label: "Simulator", icon: "💰" },
    { id: "profile", label: "Profile", icon: "⚙️" },
    { id: "leaderboard", label: "Leaderboard", icon: "🌟" },
  ];

  return (
    <nav className="flex gap-1 bg-white rounded-lg p-1 shadow-sm border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
            activeTab === tab.id
              ? "bg-blue-500 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <span>{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
