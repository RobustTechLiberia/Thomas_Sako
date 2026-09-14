import React from "react";

class GuestHost extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hosts: [],
      loaded: false,
    };
  }

  componentDidMount() {
    fetch("/api/content/about")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load about page.");
        return res.json();
      })
      .then((data) => {
        const body = data?.page?.body || [];
        const hosts = body.filter(
          (b) => b?.type === "card" && b.key === "guest-host",
        );
        this.setState({ hosts, loaded: true });
      })
      .catch(() => this.setState({ loaded: true }));
  }

  render() {
    const { hosts, loaded } = this.state;

    return (
      <div className="min-h-80 bg-white md:min-h-180">
        <h1 className="mx-10 mt-10 text-4xl font-black uppercase text-violet-800 md:mx-32 md:mt-20 md:text-5xl">
          guest host
        </h1>
        <div className="mx-10 grid gap-6 py-10 md:mx-32 md:grid-cols-3">
          {!loaded
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 animate-pulse rounded-xl bg-violet-100"
                />
              ))
            : hosts.map((h, idx) => (
                <div key={idx} className="rounded-xl border border-violet-100 p-6">
                  <h3 className="font-sans text-xl font-bold uppercase text-violet-950">
                    {h.title || "Guest host"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold uppercase text-violet-600">
                    {h.role || "Guest Host"}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">
                    {h.text || ""}
                  </p>
                </div>
              ))}
        </div>
        {loaded && hosts.length === 0 && (
          <p className="mx-10 pb-10 text-gray-600 md:mx-32">
            Guest voices join the show regularly — manage them in the CMS
            (Pages → About) and they'll appear here.
          </p>
        )}
      </div>
    );
  }
}

export default GuestHost;