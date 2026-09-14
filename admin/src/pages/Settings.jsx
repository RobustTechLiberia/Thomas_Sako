import { useEffect, useState } from "react";
import { api } from "../api.js";

const EMPTY_SPONSOR = { name: "", image: "", link: "", order: 0, visible: true };
const EMPTY_ADVERT = { title: "", image: "", link: "", order: 0, visible: true, startDate: "", endDate: "" };

export default function Settings() {
  const [sponsors, setSponsors] = useState([]);
  const [adverts, setAdverts] = useState([]);
  const [sponsorForm, setSponsorForm] = useState({ ...EMPTY_SPONSOR });
  const [advertForm, setAdvertForm] = useState({ ...EMPTY_ADVERT });
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [editingAdvert, setEditingAdvert] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("sponsors");

  const load = async () => {
    try {
      const settings = await api("/settings");
      setSponsors(settings.sponsors || []);
      setAdverts(settings.adverts || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSponsors = async (next) => {
    await api("/settings", { method: "PUT", body: { sponsors: next } });
  };

  const saveAdverts = async (next) => {
    await api("/settings", { method: "PUT", body: { adverts: next } });
  };

  const cleanSponsorForm = () => ({
    ...sponsorForm,
    order: Number(sponsorForm.order || 0),
    visible: sponsorForm.visible !== false && sponsorForm.visible !== "false",
  });

  const cleanAdvertForm = () => ({
    ...advertForm,
    order: Number(advertForm.order || 0),
    visible: advertForm.visible !== false && advertForm.visible !== "false",
  });

  const submitSponsor = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const next = [...sponsors];
      if (editingSponsor !== null) next[editingSponsor] = cleanSponsorForm();
      else next.push(cleanSponsorForm());
      await saveSponsors(next);
      setMsg(editingSponsor !== null ? "Sponsor updated" : "Sponsor added");
      setSponsorForm({ ...EMPTY_SPONSOR });
      setEditingSponsor(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const editSponsor = (idx) => {
    setEditingSponsor(idx);
    setSponsorForm({ ...sponsors[idx] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeSponsor = async (idx) => {
    if (!confirm("Remove this sponsor?")) return;
    try {
      const next = sponsors.filter((_, i) => i !== idx);
      await saveSponsors(next);
      setMsg("Sponsor removed");
      setEditingSponsor(null);
      setSponsorForm({ ...EMPTY_SPONSOR });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitAdvert = async (e) => {
    e.preventDefault();
    setError("");
    setMsg("");
    try {
      const next = [...adverts];
      if (editingAdvert !== null) next[editingAdvert] = cleanAdvertForm();
      else next.push(cleanAdvertForm());
      await saveAdverts(next);
      setMsg(editingAdvert !== null ? "Advert updated" : "Advert added");
      setAdvertForm({ ...EMPTY_ADVERT });
      setEditingAdvert(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const editAdvert = (idx) => {
    setEditingAdvert(idx);
    setAdvertForm({ ...adverts[idx] });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeAdvert = async (idx) => {
    if (!confirm("Remove this advert?")) return;
    try {
      const next = adverts.filter((_, i) => i !== idx);
      await saveAdverts(next);
      setMsg("Advert removed");
      setEditingAdvert(null);
      setAdvertForm({ ...EMPTY_ADVERT });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1 className="page-title">Sponsors &amp; Advertisements</h1>
      {error && <p className="msg msg-err">{error}</p>}
      {msg && <p className="msg msg-ok">{msg}</p>}

      <div className="toolbar">
        <button
          className={`btn btn-small ${tab === "sponsors" ? "btn-primary" : ""}`}
          style={tab !== "sponsors" ? { color: "var(--cms-text-nav)", border: "1px solid var(--cms-border-strong)", background: "var(--cms-surface)" } : {}}
          onClick={() => setTab("sponsors")}
        >
          Sponsors
        </button>
        <button
          className={`btn btn-small ${tab === "adverts" ? "btn-primary" : ""}`}
          style={tab !== "adverts" ? { color: "var(--cms-text-nav)", border: "1px solid var(--cms-border-strong)", background: "var(--cms-surface)" } : {}}
          onClick={() => setTab("adverts")}
        >
          Advertisements
        </button>
      </div>

      {/* SPONSORS TAB */}
      {tab === "sponsors" && (
        <>
          <div className="card">
            <h2 className="card-title">{editingSponsor !== null ? "Edit sponsor" : "Add sponsor"}</h2>
            <form onSubmit={submitSponsor} className="form-grid">
              <div className="field">
                <label>Name *</label>
                <input
                  value={sponsorForm.name}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Image URL *</label>
                <input
                  value={sponsorForm.image}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, image: e.target.value })}
                  required
                  placeholder="https://…/logo.png"
                />
              </div>
              <div className="field">
                <label>Link URL</label>
                <input
                  value={sponsorForm.link}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, link: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Order</label>
                <input
                  type="number"
                  value={sponsorForm.order}
                  onChange={(e) => setSponsorForm({ ...sponsorForm, order: e.target.value })}
                />
              </div>
              <div className="field">
                <label>
                  <input
                    type="checkbox"
                    checked={sponsorForm.visible !== false && sponsorForm.visible !== "false"}
                    onChange={(e) => setSponsorForm({ ...sponsorForm, visible: e.target.checked })}
                    style={{ marginRight: 6 }}
                  />
                  Visible
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingSponsor !== null ? "Save changes" : "Add sponsor"}
                </button>
                {editingSponsor !== null && (
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditingSponsor(null); setSponsorForm({ ...EMPTY_SPONSOR }); }} style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="card-title">Current sponsors ({sponsors.length})</h2>
            {!sponsors.length ? (
              <p className="muted">No sponsors configured.</p>
            ) : (
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Name</th>
                    <th>Image</th>
                    <th>Link</th>
                    <th>Visible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsors.map((s, i) => (
                    <tr key={i}>
                      <td>{s.order || 0}</td>
                      <td>{s.name}</td>
                      <td style={{ maxWidth: 200 }}>{s.image}</td>
                      <td style={{ maxWidth: 200 }}>{s.link || "—"}</td>
                      <td>
                        <span className={`badge ${s.visible !== false ? "badge-green" : "badge-red"}`}>
                          {s.visible !== false ? "yes" : "no"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-small btn-primary" onClick={() => editSponsor(i)}>
                            Edit
                          </button>
                          <button className="btn btn-small btn-danger" onClick={() => removeSponsor(i)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ADVERTS TAB */}
      {tab === "adverts" && (
        <>
          <div className="card">
            <h2 className="card-title">{editingAdvert !== null ? "Edit advert" : "Add advert"}</h2>
            <form onSubmit={submitAdvert} className="form-grid">
              <div className="field">
                <label>Title *</label>
                <input
                  value={advertForm.title}
                  onChange={(e) => setAdvertForm({ ...advertForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Image URL *</label>
                <input
                  value={advertForm.image}
                  onChange={(e) => setAdvertForm({ ...advertForm, image: e.target.value })}
                  required
                  placeholder="https://…/advert.jpg"
                />
              </div>
              <div className="field">
                <label>Link URL</label>
                <input
                  value={advertForm.link}
                  onChange={(e) => setAdvertForm({ ...advertForm, link: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Order</label>
                <input
                  type="number"
                  value={advertForm.order}
                  onChange={(e) => setAdvertForm({ ...advertForm, order: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Start date</label>
                <input
                  type="date"
                  value={advertForm.startDate || ""}
                  onChange={(e) => setAdvertForm({ ...advertForm, startDate: e.target.value })}
                />
              </div>
              <div className="field">
                <label>End date</label>
                <input
                  type="date"
                  value={advertForm.endDate || ""}
                  onChange={(e) => setAdvertForm({ ...advertForm, endDate: e.target.value })}
                />
              </div>
              <div className="field">
                <label>
                  <input
                    type="checkbox"
                    checked={advertForm.visible !== false && advertForm.visible !== "false"}
                    onChange={(e) => setAdvertForm({ ...advertForm, visible: e.target.checked })}
                    style={{ marginRight: 6 }}
                  />
                  Visible
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  {editingAdvert !== null ? "Save changes" : "Add advert"}
                </button>
                {editingAdvert !== null && (
                  <button type="button" className="btn btn-ghost" onClick={() => { setEditingAdvert(null); setAdvertForm({ ...EMPTY_ADVERT }); }} style={{ color: "var(--cms-text-nav)", borderColor: "var(--cms-border-strong)" }}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h2 className="card-title">Current adverts ({adverts.length})</h2>
            {!adverts.length ? (
              <p className="muted">No adverts configured.</p>
            ) : (
              <table className="cms-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Title</th>
                    <th>Image</th>
                    <th>Link</th>
                    <th>Dates</th>
                    <th>Visible</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adverts.map((a, i) => (
                    <tr key={i}>
                      <td>{a.order || 0}</td>
                      <td>{a.title}</td>
                      <td style={{ maxWidth: 180 }}>{a.image}</td>
                      <td style={{ maxWidth: 180 }}>{a.link || "—"}</td>
                      <td className="muted">
                        {a.startDate || "—"} → {a.endDate || "—"}
                      </td>
                      <td>
                        <span className={`badge ${a.visible !== false ? "badge-green" : "badge-red"}`}>
                          {a.visible !== false ? "yes" : "no"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="btn btn-small btn-primary" onClick={() => editAdvert(i)}>
                            Edit
                          </button>
                          <button className="btn btn-small btn-danger" onClick={() => removeAdvert(i)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  );
}