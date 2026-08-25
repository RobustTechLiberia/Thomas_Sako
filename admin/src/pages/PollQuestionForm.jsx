import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pollQuestions } from '../api.js';

export default function PollQuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [status, setStatus] = useState('draft');
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      loadPoll();
    }
  }, [id]);

  const loadPoll = async () => {
    try {
      const data = await pollQuestions.get(id);
      setQuestion(data.question_text);
      setOptions(data.options);
      setStatus(data.status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!question.trim()) {
      setError('Question is required');
      return;
    }

    const filledOptions = options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      setError('At least 2 options are required');
      return;
    }

    try {
      setLoading(true);

      if (isEdit) {
        await pollQuestions.update(id, {
          question_text: question,
          options: filledOptions,
          status,
        });
        setSuccess('Poll updated successfully!');
      } else {
        await pollQuestions.create({
          question_text: question,
          options: filledOptions,
          status,
        });
        setSuccess('Poll created successfully!');
      }

      setTimeout(() => {
        navigate('/polls');
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{isEdit ? 'Edit Poll' : 'Create New Poll'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="error-message bg-red-50 p-4 rounded">{error}</div>}
        {success && <div className="success-message bg-green-50 p-4 rounded">{success}</div>}

        <div className="card">
          <div className="form-group">
            <label className="form-label">Poll Question</label>
            <textarea
              className="input w-full"
              rows="3"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Should corporate campaign contributions be completely banned?"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="input w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={loading}
            >
              <option value="draft">Draft</option>
              <option value="active">Active (will deactivate other active polls)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Poll Options</h3>
          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  disabled={loading}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn-danger"
                    disabled={loading}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddOption}
            className="btn-secondary mt-4"
            disabled={loading}
          >
            + Add Option
          </button>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="btn-primary flex-1 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Poll' : 'Create Poll'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/polls')}
            className="btn-secondary flex-1"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
