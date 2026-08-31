import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { pollQuestions } from '../api.js';

export default function PollQuestions() {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 10;

  useEffect(() => {
    loadPolls();
  }, [statusFilter, searchTerm, page]);

  const loadPolls = async () => {
    try {
      setLoading(true);
      const data = await pollQuestions.list({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit,
      });
      setPolls(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Archive this poll? It can be restored later.')) return;

    try {
      await pollQuestions.delete(id);
      loadPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePublish = async (id) => {
    try {
      await pollQuestions.publish(id);
      loadPolls();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Poll Questions</h1>
        <Link to="/polls/new" className="btn-primary">
          + New Poll
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search polls..."
            className="input flex-1"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="input"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No polls found. {!searchTerm && !statusFilter && 'Create one to get started!'}
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Question</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Options</th>
                  <th className="text-left py-3 px-4 font-semibold">Created</th>
                  <th className="text-right py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {polls.map((poll) => (
                  <tr key={poll.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{poll.question_text}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          poll.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : poll.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {poll.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {poll.options.length} options
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {new Date(poll.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/polls/${poll.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </Link>
                      {poll.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(poll.id)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Publish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(poll.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Archive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className="btn-secondary disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
