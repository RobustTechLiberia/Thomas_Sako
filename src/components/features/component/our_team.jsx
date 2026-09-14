import React from "react";

class OurTeam extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      members: [],
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
        const members = body.filter(
          (b) => b?.type === "card" && b.key === "team",
        );
        this.setState({ members, loaded: true });
      })
      .catch(() => this.setState({ loaded: true }));
  }

  render() {
    const { members, loaded } = this.state;

    return (
      <div className="min-h-120 bg-violet-200 md:mt-20 md:min-h-180">
        <h1 className="mx-8 pt-10 text-left font-sans text-4xl font-black uppercase text-violet-500 md:mx-20 md:pt-20 md:text-5xl">
          our team
        </h1>
        <div className="mx-8 grid gap-6 py-10 md:mx-20 md:grid-cols-3">
          {!loaded
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-xl bg-violet-300/60"
                />
              ))
            : members.map((m, idx) => (
                <div
                  key={idx}
                  className="rounded-xl bg-white/80 p-6 shadow-sm"
                >
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-900 text-lg font-bold text-white">
                    {m.title?.charAt(0) || "?"}
                  </div>
                  <h3 className="font-sans text-xl font-bold uppercase text-violet-950">
                    {m.title || "Team member"}
                  </h3>
                  <p className="mt-1 text-sm font-semibold uppercase text-violet-600">
                    {m.role || "Team"}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-700">
                    {m.text || ""}
                  </p>
                </div>
              ))}
        </div>
        {loaded && members.length === 0 && (
          <p className="mx-8 pb-10 text-gray-600 md:mx-20">
            Meet the people behind the show — add team members in the CMS
            (Pages → About) and they'll appear here.
          </p>
        )}
      </div>
    );
  }
}

export default OurTeam;