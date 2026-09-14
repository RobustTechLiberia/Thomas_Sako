import { Fragment, useEffect, useState } from "react";
import { api } from "../api.js";
import { fmtDate } from "../lib/format.js";

const BOOKING_STATUSES = ["new", "pending", "confirmed", "contacted", "completed", "cancelled", "declined", "resolved"];

export default function Bookings() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    try {
      const q = new URLSearchParams({ page, limit: 20, source: "booking" });
      if (statusFilter) q.set("status", statusFilter);
      if (search) q.set("search", search);
      const data = await api(`/bookings?${q}`);
      setItems(data.rows || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [page, statusFilter, search]);

  const setStatus = async (id, status) => {
    try {
      await api(`/bookings/${id}`, { method: "PATCH", body: { status } });
      setMsg("Booking status updated");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this booking request permanently?")) return;
    try {
      await api(`/bookings/${id}`, { method: "DELETE" });
      setMsg("Booking deleted");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const badge = (s) => {
    const m = {
      new: "badge-blue",
      pending: "badge-amber",
      confirmed: "badge-green",
      contacted: "badge-amber",
      completed: "badge-gray",
      cancelled: "badge-red",
      declined: "badge-red",
      resolved: "badge-gray",
    };
    return <span className={`badge ${m[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Bookings</h1>
      {error && <p className="msg msg-err bg-red-200">{error}</p>}
      {msg && <p className="msg msg-ok bg-green-200">{msg}</p>}

      <div className="card">
        <div className="toolbar">
          <select value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
            <option value="">All statuses</option>
            {BOOKING_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input
            placeholder="Search name / email / organization…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          />
        </div>

        <table className="cms-table">
          <thead>
            <tr>
              <th>Requested</th>
              <th>Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!items.length && (
              <tr>
                <td colSpan={6} className="muted">
                  No booking requests found.
                </td>
              </tr>
            )}
            {items.map((b) => (
              <Fragment key={b.id}>
                <tr style={{ cursor: "pointer" }}>
                  <td>{fmtDate(b.createdAt)}</td>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>
                    {b.eventType || "—"} {b.eventDate ? `· ${b.eventDate}` : ""}
                  </td>
                  <td>{badge(b.status)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-small"
                        onClick={() => setExpanded(expanded === b.id ? null : b.id)}
                      >
                        {expanded === b.id ? "Hide" : "Details"}
                      </button>
                      <select
                        value={b.status}
                        onChange={(e) => setStatus(b.id, e.target.value)}
                        style={{ fontSize: 12, padding: "4px 6px" }}
                      >
                        <option value="" disabled>
                          Set status…
                        </option>
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button className="btn btn-small btn-danger" onClick={() => remove(b.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === b.id && (
                  <tr key={`${b.id}-details`}>
                    <td colSpan={6}>
                      <div className="card" style={{ marginBottom: 0 }}>
                        <table className="cms-table">
                          <tbody>
                            <tr><th style={{ width: 160 }}>Phone</th><td>{b.phone || "—"}</td></tr>
                            <tr><th>Organization</th><td>{b.organization || "—"}</td></tr>
                            <tr><th>Event type</th><td>{b.eventType || "—"}</td></tr>
                            <tr><th>Event date</th><td>{b.eventDate || "—"}</td></tr>
                            <tr><th>Event time</th><td>{b.eventTime || "—"}</td></tr>
                            <tr><th>Location</th><td>{b.eventLocation || "—"}</td></tr>
                            <tr><th>Message</th><td style={{ whiteSpace: "pre-wrap" }}>{b.message || "—"}</td></tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
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