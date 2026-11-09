import React from "react";
import CmsLogin from "../components/cms/Auth/CmsLogin";
import CmsDashboard from "../components/cms/dashboard/CmsDashboard";

class CmsPage extends React.Component {
  constructor(props) { super(props); this.state = { session: this.readSession() }; }
  readSession() { try { return JSON.parse(sessionStorage.getItem("liberty-cms-session")) || null; } catch { return null; } }
  login = (session) => { sessionStorage.setItem("liberty-cms-session", JSON.stringify(session)); this.setState({ session }); };
  logout = () => { sessionStorage.removeItem("liberty-cms-session"); this.setState({ session: null }); };
  render() { return this.state.session ? <CmsDashboard session={this.state.session} onLogout={this.logout} /> : <CmsLogin onLogin={this.login} />; }
}
export default CmsPage;
