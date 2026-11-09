import React from "react";
import { useParams } from "react-router-dom";
import Nav from "../components/features/component/nav";
import Footer from "../components/footer";

class CmsDynamicPageView extends React.Component {
  state = { page: null };
  componentDidMount() { fetch("/cms/site/public").then((r) => r.json()).then((data) => this.setState({ page: data.pages?.find((page) => page.slug === this.props.slug) || null })).catch(() => this.setState({ page: null })); }
  render() { if (!this.state.page) return <><Nav /><main className="mx-auto min-h-80 max-w-4xl px-5 py-32"><h1 className="font-serif text-4xl">Page not found</h1></main><Footer /></>; const page = this.state.page; return <><Nav /><main className="mx-auto min-h-80 max-w-4xl px-5 py-32"><h1 className="font-serif text-4xl text-[#830000]">{page.title}</h1><div className="mt-7 whitespace-pre-wrap text-lg leading-8">{page.body}</div></main><Footer /></>; }
}
export default function CmsDynamicPage() { return <CmsDynamicPageView slug={useParams().slug} />; }
