import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function Profile() {
  const profile = useQuery(api.profile.getUserProfile);
  const achievements = useQuery(api.profile.getUserAchievements);
  const updateProfile = useMutation(api.profile.updateProfile);
  
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ displayName });
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Profile</h2>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            👤
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={profile.displayName}
                  className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70"
                />
                <button
                  onClick={handleUpdateProfile}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{profile.displayName}</h3>
                <button
                  onClick={() => {
                    setDisplayName(profile.displayName);
                    setIsEditing(true);
                  }}
                  className="text-white/80 hover:text-white"
                >
                  ✏️
                </button>
              </div>
            )}
            <p className="text-blue-100">Level {profile.level} • {profile.totalCoins} coins</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="text-3xl font-bold text-blue-600">{profile.stats.completedLessons}</div>
          <div className="text-sm text-gray-600">Lessons Completed</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="text-3xl font-bold text-green-600">{profile.stats.averageScore}%</div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="text-3xl font-bold text-purple-600">{profile.stats.totalSimulations}</div>
          <div className="text-sm text-gray-600">Simulations Run</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border text-center">
          <div className="text-3xl font-bold text-yellow-600">{profile.currentStreak}</div>
          <div className="text-sm text-gray-600">Day Streak</div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Learning Progress</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Completion</span>
              <span>{profile.stats.completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${profile.stats.completionRate}%` }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Lessons:</span>
              <span className="ml-2 font-medium">
                {profile.stats.completedLessons}/{profile.stats.totalLessons}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Quizzes:</span>
              <span className="ml-2 font-medium">{profile.stats.totalQuizzes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Achievements</h3>
        {achievements && achievements.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <div key={achievement._id} className="border rounded-lg p-4">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className="font-medium">{achievement.name}</h4>
                <p className="text-sm text-gray-600">{achievement.description}</p>
                <div className="text-xs text-gray-500 mt-2">
                  Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏆</div>
            <p>No achievements yet. Keep learning to unlock badges!</p>
          </div>
        )}
      </div>

      {/* Learning Tips */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          💡 Learning Tips
        </h3>
        <div className="space-y-2 text-sm">
          <p>• Complete lessons daily to maintain your streak</p>
          <p>• Use the loan simulator to practice real-world scenarios</p>
          <p>• Aim for 80%+ quiz scores to maximize coin rewards</p>
          <p>• Share your progress with friends to stay motivated</p>
        </div>
      </div>
    </div>
  );
}
