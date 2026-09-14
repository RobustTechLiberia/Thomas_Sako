import { useEffect, useState } from "react";
import { api } from "../api.js";
import { fmtDate, fmtDateTime } from "../lib/format.js";

export default function Notifications() {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState(null); // notification id
  const [recipients, setRecipients] = useState([]);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const loadStats = async () => {
    try {
      const data = await api("/notifications/stats");
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const load = async () => {
    try {
      const q = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) q.set("status", statusFilter);
      const data = await api(`/notifications?${q}`);
      setNotifications(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    loadStats();
  }, [page, statusFilter]);

  const showRecipients = async (id) => {
    setSelected(id);
    setRecipients([]);
    try {
      const data = await api(`/notifications/${id}/recipients`);
      setRecipients(data.rows || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const retryFailed = async () => {
    if (!confirm("Resend all failed notification emails?")) return;
    setError("");
    setMsg("");
    try {
      const data = await api("/notifications/retry-failed", { method: "POST" });
      setMsg(`Requeued ${data.length} failed notifications.`);
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const badge = (s) => {
    const m = { sent: "badge-green", pending: "badge-amber", failed: "badge-red", sending: "badge-blue" };
    return <span className={`badge ${m[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Notifications</h1>
      {error && <p className="msg msg-err">{error}</p>}
      {msg && <p className="msg msg-ok">{msg}</p>}

      {stats && (
        <>
          <div className="stat-grid">
            <div className="stat">
              <div className="num">{stats.notifications?.sent || 0}</div>
              <div className="label">Notifications sent</div>
            </div>
            <div className="stat">
              <div className="num">{stats.notifications?.failed || 0}</div>
              <div className="label">Failed</div>
            </div>
            <div className="stat">
              <div className="num">{stats.recipients?.sent || 0}</div>
              <div className="label">Emails delivered</div>
            </div>
            <div className="stat">
              <div className="num">{stats.recipients?.failed || 0}</div>
              <div className="label">Emails failed</div>
            </div>
          </div>
          <div className="toolbar">
            <button className="btn btn-small btn-primary" onClick={retryFailed}>
              Retry failed emails
            </button>
          </div>
        </>
      )}

      <div className="card">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <table className="cms-table">
          <thead>
            <tr>
              <th>Sent</th>
              <th>Content</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Recipients</th>
            </tr>
          </thead>
          <tbody>
            {!notifications.length && (
              <tr>
                <td colSpan={6} className="muted">No notifications found.</td>
              </tr>
            )}
            {notifications.map((n) => (
              <>
                <tr key={`${n.id}-row`} style={{ cursor: "pointer" }} onClick={() => showRecipients(n.id)}>
                  <td>{fmtDate(n.createdAt)}</td>
                  <td className="muted">{n.contentType} #{n.contentId}</td>
                  <td style={{ maxWidth: 300 }}>{n.subject || "—"}</td>
                  <td>{badge(n.status)}</td>
                  <td>{n.attempts ?? 0}</td>
                  <td>
                    <button className="btn btn-small" onClick={(e) => { e.stopPropagation(); showRecipients(n.id); }}>
                      {selected === n.id ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {selected === n.id && (
                  <tr key={`${n.id}-recipients`}>
                    <td colSpan={6}>
                      <div className="card" style={{ marginBottom: 0 }}>
                        <h3 className="card-title">Recipients</h3>
                        {!recipients.length ? (
                          <p className="muted">Loading…</p>
                        ) : (
                          <table className="cms-table">
                            <thead>
                              <tr>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Attempts</th>
                                <th>Error</th>
                                <th>Sent at</th>
                              </tr>
                            </thead>
                            <tbody>
                              {recipients.map((r) => (
                                <tr key={r.id}>
                                  <td>{r.email}</td>
                                  <td>{badge(r.status)}</td>
                                  <td>{r.attempts ?? 0}</td>
                                  <td className="muted" style={{ maxWidth: 240 }}>{r.error || "—"}</td>
                                  <td>{r.sentAt ? fmtDateTime(r.sentAt) : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
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
            disabled={notifications.length < 20}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}