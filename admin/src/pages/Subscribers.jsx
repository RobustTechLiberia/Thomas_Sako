import { useEffect, useState } from "react";
import { api } from "../api.js";
import { fmtDate } from "../lib/format.js";

export default function Subscribers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  const load = async () => {
    try {
      const q = new URLSearchParams({ page, limit: 30 });
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      const data = await api(`/subscribers?${q}`);
      setItems(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api("/subscribers/stats");
      setStats(data);
    } catch (err) {
      // Non-fatal
    }
  };

  useEffect(() => {
    load();
    loadStats();
  }, [page, statusFilter, search]);

  const setStatus = async (id, status) => {
    try {
      await api(`/subscribers/${id}`, { method: "PATCH", body: { status } });
      setMsg("Subscriber status updated");
      load();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Remove this subscriber permanently?")) return;
    try {
      await api(`/subscribers/${id}`, { method: "DELETE" });
      setMsg("Subscriber removed");
      load();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const badge = (s) => {
    const m = { subscribed: "badge-green", unsubscribed: "badge-red", banned: "badge-red", pending: "badge-amber" };
    return <span className={`badge ${m[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Newsletter Subscribers</h1>
      {error && <p className="msg msg-err">{error}</p>}
      {msg && <p className="msg msg-ok">{msg}</p>}

      {stats && (
        <div className="stat-grid">
          <div className="stat">
            <div className="num">{stats.subscribed || 0}</div>
            <div className="label">Active</div>
          </div>
          <div className="stat">
            <div className="num">{stats.unsubscribed || 0}</div>
            <div className="label">Unsubscribed</div>
          </div>
          <div className="stat">
            <div className="num">{stats.banned || 0}</div>
            <div className="label">Banned</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="banned">Banned</option>
          </select>
          <input
            placeholder="Search email…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>

        <table className="cms-table">
          <thead>
            <tr>
              <th>Subscribed</th>
              <th>Email</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && (
              <tr>
                <td colSpan={4} className="muted">No subscribers found.</td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.subscribedAt ? fmtDate(s.subscribedAt) : "—"}</td>
                <td>{s.email}</td>
                <td>{badge(s.status)}</td>
                <td>
                  <div className="row-actions">
                    <select
                      value={s.status}
                      onChange={(e) => setStatus(s.id, e.target.value)}
                      style={{ fontSize: 12, padding: "4px 6px" }}
                    >
                      <option value="" disabled>Set status…</option>
                      <option value="subscribed">subscribed</option>
                      <option value="unsubscribed">unsubscribed</option>
                      <option value="banned">banned</option>
                    </select>
                    <button className="btn btn-small btn-danger" onClick={() => remove(s.id)}>
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
            disabled={items.length < 30}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}