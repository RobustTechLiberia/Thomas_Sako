import { useEffect, useState } from "react";
import { api } from "../api.js";
import { fmtDate } from "../lib/format.js";

const EMPTY = {
  title: "",
  description: "",
  mediaUrl: "",
  thumbnailUrl: "",
  status: "draft",
};

export default function Podcasts() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ ...EMPTY });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const q = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      const data = await api(`/podcasts?${q}`);
      setItems(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, search]);

  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditing(null);
    setMsg("");
    setError("");
  };

  const handleEdit = (podcast) => {
    setEditing(podcast.id);
    setForm({
      title: podcast.title,
      description: podcast.description || "",
      mediaUrl: podcast.mediaUrl || "",
      thumbnailUrl: podcast.thumbnailUrl || "",
      status: podcast.status,
    });
    setMsg("");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      if (editing) {
        await api(`/podcasts/${editing}`, { method: "PUT", body: form });
        setMsg("Podcast updated");
      } else {
        await api("/podcasts", { method: "POST", body: form });
        setMsg("Podcast created");
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const publish = async (id) => {
    try {
      await api(`/podcasts/${id}/publish`, { method: "POST" });
      setMsg("Podcast published — subscribers will be notified");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this podcast permanently?")) return;
    try {
      await api(`/podcasts/${id}`, { method: "DELETE" });
      setMsg("Podcast deleted");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const badge = (s) => {
    const m = { published: "badge-green", draft: "badge-gray", archived: "badge-purple", failed: "badge-red" };
    return <span className={`badge ${m[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Podcasts</h1>

      <div className="card">
        <h2 className="card-title">{editing ? "Edit podcast" : "Add podcast"}</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="full field">
            <label>Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          <div className="full field">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Media / YouTube URL</label>
            <input
              value={form.mediaUrl}
              onChange={(e) => setForm({ ...form, mediaUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </div>
          <div className="field">
            <label>Thumbnail URL</label>
            <input
              value={form.thumbnailUrl}
              onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
              placeholder="https://…/thumbnail.jpg"
            />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editing ? "Save changes" : "Add podcast"}
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
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <input
            placeholder="Search titles…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>
        <table className="cms-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Status</th>
              <th>Published</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && (
              <tr>
                <td colSpan={5} className="muted">
                  No podcasts found.
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ maxWidth: 320 }}>{p.title}</td>
                <td>{badge(p.status)}</td>
                <td>{p.publishedAt ? fmtDate(p.publishedAt) : "—"}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-small btn-primary" onClick={() => handleEdit(p)}>
                      Edit
                    </button>
                    {p.status !== "published" && (
                      <button className="btn btn-small" onClick={() => publish(p.id)}>
                        Publish
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
          <span className="muted">Page {page} · {total} total</span>
          <button
            className="btn btn-small btn-ghost"
            style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}
            disabled={items.length < 20}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}