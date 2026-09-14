import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ question: "", options: "A\nB", status: "draft" });
  const [editing, setEditing] = useState(null); // poll id or null

  const load = async () => {
    try {
      const q = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      const data = await api(`/polls?${q}`);
      setPolls(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, search]);

  const resetForm = () => {
    setForm({ question: "", options: "A\nB", status: "draft" });
    setEditing(null);
  };

  const handleEdit = (poll) => {
    setEditing(poll.id);
    setForm({
      question: poll.question,
      options: (poll.options || []).join("\n"),
      status: poll.status,
    });
    setMsg("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    const body = {
      question: form.question,
      options: form.options
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      status: form.status,
    };
    try {
      if (editing) {
        await api(`/polls/${editing}`, { method: "PUT", body });
        setMsg("Poll updated");
      } else {
        await api("/polls", { method: "POST", body });
        setMsg("Poll created");
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const activate = async (id) => {
    try {
      await api(`/polls/${id}/activate`, { method: "POST" });
      setMsg("Poll activated — all other polls deactivated");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const archive = async (id) => {
    try {
      await api(`/polls/${id}/archive`, { method: "POST" });
      setMsg("Poll archived");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this poll permanently?")) return;
    try {
      await api(`/polls/${id}`, { method: "DELETE" });
      setMsg("Poll deleted");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const badge = (s) => {
    const m = { active: "badge-green", draft: "badge-gray", archived: "badge-purple" };
    return <span className={`badge ${m[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Polls</h1>

      <div className="card">
        <h2 className="card-title">{editing ? "Edit poll" : "Create poll"}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="full field">
            <label>Question</label>
            <input
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
          </div>
          <div className="full field">
            <label>Answer options (one per line, minimum 2)</label>
            <textarea
              rows={3}
              value={form.options}
              onChange={(e) => setForm({ ...form, options: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editing ? "Save changes" : "Create poll"}
            </button>
            {editing && (
              <button type="button" className="btn btn-ghost" onClick={resetForm} style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}>
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p className="msg msg-err">{error}</p>}
      {msg && <p className="msg msg-ok">{msg}</p>}

      <div className="card">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          <input
            placeholder="Search questions…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <table className="cms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Options</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!polls.length && (
              <tr>
                <td colSpan={5} className="muted">
                  No polls found.
                </td>
              </tr>
            )}
            {polls.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ maxWidth: 300 }}>{p.question}</td>
                <td>{(p.options || []).join(", ")}</td>
                <td>{badge(p.status)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-small btn-primary" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    {p.status !== "active" && (
                      <button className="btn btn-small" onClick={() => activate(p.id)}>
                        Activate
                      </button>
                    )}
                    {p.status === "active" && (
                      <button className="btn btn-small" onClick={() => archive(p.id)}>
                        Archive
                      </button>
                    )}
                    <button className="btn btn-small btn-danger" onClick={() => remove(p.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions" style={{ marginTop: 12 }}>
          <button
            className="btn btn-small btn-ghost"
            style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <span className="muted">
            Page {page} · {total} total
          </span>
          <button
            className="btn btn-small btn-ghost"
            style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}
            disabled={polls.length < 20}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}