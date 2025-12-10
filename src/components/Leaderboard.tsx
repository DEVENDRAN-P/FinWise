import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function Leaderboard() {
  const leaderboard = useQuery(api.profile.getLeaderboard, { limit: 20 });
  const userProfile = useQuery(api.profile.getUserProfile);

  if (!leaderboard) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(p => p.userId === userProfile?.userId) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <div className="text-sm text-gray-600">
          Top learners this month
        </div>
      </div>

      {/* User's Current Position */}
      {userProfile && userRank > 0 && (
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Your Position</h3>
              <p className="text-blue-100">Keep learning to climb higher!</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">#{userRank}</div>
              <div className="text-sm text-blue-100">{userProfile.totalCoins} coins</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 */}
      <div className="grid md:grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((user, index) => (
          <div key={user._id} className={`rounded-xl p-6 text-center ${
            index === 0 ? "bg-gradient-to-b from-yellow-400 to-yellow-500 text-white" :
            index === 1 ? "bg-gradient-to-b from-gray-300 to-gray-400 text-white" :
            "bg-gradient-to-b from-orange-400 to-orange-500 text-white"
          }`}>
            <div className="text-4xl mb-2">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
            </div>
            <h3 className="font-bold text-lg">{user.displayName}</h3>
            <p className="text-sm opacity-90">Level {user.level}</p>
            <div className="text-2xl font-bold mt-2">{user.totalCoins}</div>
            <div className="text-sm opacity-90">coins</div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold">All Rankings</h3>
        </div>
        <div className="divide-y">
          {leaderboard.map((user, index) => (
            <div key={user._id} className={`p-4 flex items-center justify-between ${
              user.userId === userProfile?.userId ? "bg-blue-50 border-l-4 border-blue-500" : ""
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index < 3 ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium">{user.displayName}</h4>
                  <p className="text-sm text-gray-600">Level {user.level}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{user.totalCoins}</div>
                <div className="text-sm text-gray-600">coins</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          ℹ️ How Rankings Work
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Rankings are based on total coins earned</p>
          <p>• Complete lessons and quizzes to earn coins</p>
          <p>• Use the loan simulator for bonus coins</p>
          <p>• Leaderboard updates in real-time</p>
        </div>
      </div>
    </div>
  );
}
