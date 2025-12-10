import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const profile = useQuery(api.profile.getUserProfile);
  const categories = useQuery(api.lessons.getLessonCategories);
  const initializeLessons = useMutation(api.lessons.initializeLessons);

  useEffect(() => {
    initializeLessons();
  }, [initializeLessons]);

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {profile.displayName}! 👋
        </h2>
        <p className="text-blue-100 mb-4">
          Continue your financial literacy journey
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{profile.level}</div>
            <div className="text-sm text-blue-100">Level</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{profile.totalCoins}</div>
            <div className="text-sm text-blue-100">Coins</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{profile.stats.completedLessons}</div>
            <div className="text-sm text-blue-100">Lessons</div>
          </div>
          <div className="bg-white/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{profile.stats.completionRate}%</div>
            <div className="text-sm text-blue-100">Progress</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📈 Learning Progress
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Lessons Completed</span>
              <span>{profile.stats.completedLessons}/{profile.stats.totalLessons}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              {/* eslint-disable-next-line */}
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profile.stats.completionRate}%` } as React.CSSProperties}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Average Quiz Score: {profile.stats.averageScore}%</span>
              <span>Simulations: {profile.stats.totalSimulations}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎯 Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => setActiveTab("learn")}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium py-3 px-4 rounded-lg transition-colors text-left">
              📚 Continue Learning
            </button>
            <button 
              onClick={() => setActiveTab("simulator")}
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-3 px-4 rounded-lg transition-colors text-left">
              🧮 Try Loan Simulator
            </button>
            <button 
              onClick={() => setActiveTab("leaderboard")}
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium py-3 px-4 rounded-lg transition-colors text-left">
              🏆 View Leaderboard
            </button>
          </div>
        </div>
      </div>

      {/* Learning Categories */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          📖 Learning Categories
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => (
            <div 
              key={category.name} 
              onClick={() => setActiveTab("learn")}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer hover:border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium capitalize">{category.name}</h4>
                <span className="text-sm text-gray-500">{category.count} lessons</span>
              </div>
              <div className="text-sm text-gray-600">
                Earn up to {category.totalCoins} coins 🪙
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          ⚡ Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              📚
            </div>
            <div className="flex-1">
              <div className="font-medium">Welcome to FinWise!</div>
              <div className="text-sm text-gray-600">Start your financial literacy journey</div>
            </div>
            <div className="text-sm text-gray-500">Now</div>
          </div>
        </div>
      </div>
    </div>
  );
}
