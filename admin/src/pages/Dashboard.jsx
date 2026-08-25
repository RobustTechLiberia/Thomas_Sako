import { useState, useEffect } from 'react';
import { dashboard, pollQuestions } from '../api.js';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboard.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-gray-600 text-sm">Active Poll</div>
          <div className="text-3xl font-bold mt-2">
            {stats?.activePoll ? '✓' : '○'}
          </div>
          {stats?.activePoll && (
            <p className="text-xs text-gray-500 mt-2">
              {stats.activePoll.total_votes} votes
            </p>
          )}
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm">Subscribers</div>
          <div className="text-3xl font-bold mt-2">{stats?.subscribers || 0}</div>
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm">Pending Leads</div>
          <div className="text-3xl font-bold mt-2">
            {(stats?.leads?.booking || 0) + (stats?.leads?.advertising || 0)}
          </div>
        </div>

        <div className="card">
          <div className="text-gray-600 text-sm">Bookings</div>
          <div className="text-3xl font-bold mt-2">{stats?.leads?.booking || 0}</div>
        </div>
      </div>

      {/* Active Poll Details */}
      {stats?.activePoll && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Active Poll</h2>
          <p className="text-gray-700 mb-4">{stats.activePoll.question_text}</p>
          
          <div className="space-y-3">
            {stats.activePoll.voteBreakdown.map((vote, idx) => (
              <div key={idx}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">{vote.answer_text}</span>
                  <span className="text-sm text-gray-600">{vote.count} votes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: stats.activePoll.total_votes > 0 
                        ? `${(vote.count / stats.activePoll.total_votes) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Total votes: {stats.activePoll.total_votes}
          </p>
        </div>
      )}

      {!stats?.activePoll && (
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-800">
            No active poll. Create one in the Polls section to get started.
          </p>
        </div>
      )}

      {/* Recent Activity */}
      {stats?.recentActivity && stats.recentActivity.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2">
            {stats.recentActivity.map((entry) => (
              <div key={entry.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div className="text-sm">
                  <span className="font-medium">{entry.action}</span>
                  {' '}on{' '}
                  <span className="text-gray-600">{entry.entity_type}</span>
                  {entry.actor_email && (
                    <>
                      {' '}by <span className="text-gray-600">{entry.actor_email}</span>
                    </>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
