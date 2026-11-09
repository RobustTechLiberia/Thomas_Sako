import React from "react";

class CmsLogin extends React.Component {
  state = { username: "", password: "", loading: false, error: "" };

  submit = async (event) => {
    event.preventDefault();
    this.setState({ loading: true, error: "" });
    try {
      const response = await fetch("/api/cms/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: this.state.username, password: this.state.password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to sign in.");
      this.props.onLogin(data);
    } catch (error) { this.setState({ error: error.message }); }
    finally { this.setState({ loading: false }); }
  };

  requestPasswordChange = async () => {
    const username = this.state.username || window.prompt("Enter the CMS username");
    if (!username) return;
    this.setState({ loading: true, error: "" });
    try {
      const response = await fetch("/api/cms/auth/password-reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not request a password change.");
      this.setState({ error: data.message });
    } catch (error) { this.setState({ error: error.message }); }
    finally { this.setState({ loading: false }); }
  };

  render() {
    return <main className="min-h-screen bg-stone-100 px-4 py-10 sm:py-16"><section className="mx-auto max-w-md border border-stone-300 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#830000]">Thomas Sako</p><h1 className="mt-2 font-serif text-3xl text-stone-900">Content desk</h1><p className="mt-2 text-sm leading-6 text-stone-600">Sign in to manage stories, page content, and images.</p>
      <form className="mt-7 space-y-5" onSubmit={this.submit}><label className="block text-sm font-semibold text-stone-800">Username<input required value={this.state.username} onChange={(e) => this.setState({ username: e.target.value })} className="mt-1.5 w-full border border-stone-400 px-3 py-2.5 outline-none focus:border-[#830000]" autoComplete="username" /></label><label className="block text-sm font-semibold text-stone-800">Password<input required type="password" value={this.state.password} onChange={(e) => this.setState({ password: e.target.value })} className="mt-1.5 w-full border border-stone-400 px-3 py-2.5 outline-none focus:border-[#830000]" autoComplete="current-password" /></label>{this.state.error && <p className="border-l-4 border-[#830000] bg-red-50 px-3 py-2 text-sm text-[#830000]">{this.state.error}</p>}<button disabled={this.state.loading} className="w-full bg-[#830000] px-4 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-[#650000] disabled:opacity-60">{this.state.loading ? "Signing in…" : "Sign in"}</button></form><button type="button" onClick={this.requestPasswordChange} className="mt-5 text-sm font-semibold text-[#830000] underline">Request password-change code</button>
    </section></main>;
  }
}
export default CmsLogin;
