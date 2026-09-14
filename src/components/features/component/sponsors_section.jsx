import React from "react";
import Reveal from "../../reveal.jsx";

/**
 * CMS-driven sponsor acknowledgment strip for the homepage. Pulls sponsors
 * from /api/content/settings (already filtered to visible + ordered).
 */
class SponsorsSection extends React.Component {
  constructor(props) {
    super(props);
    this.state = { sponsors: [] };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    try {
      const res = await fetch("/api/content/settings");
      if (!res.ok) return;
      const data = await res.json();
      const sponsors = Array.isArray(data.sponsors) ? data.sponsors : [];
      this.setState({ sponsors });
    } catch {
      /* render nothing on failure */
    }
  };

  render() {
    const { sponsors } = this.state;
    if (!sponsors.length) return null;

    return (
      <Reveal
        as="section"
        className="bg-violet-50 px-4 py-10 md:px-20 md:py-14"
      >
        <h2 className="text-center font-sans font-bold capitalize text-3xl text-violet-950 md:text-4xl">
          Proudly supported by
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {sponsors.map((sponsor, idx) => {
            const inner = (
              <Reveal delay={idx * 80} className="w-40">
                <div className="flex w-full items-center justify-center bg-white p-4 shadow-sm lib-card-lift">
                  <img
                    src={sponsor.image}
                    alt={sponsor.name}
                    className="max-h-16 w-full object-contain"
                    loading="lazy"
                  />
                </div>
              </Reveal>
            );
            return sponsor.link ? (
              <a
                href={sponsor.link}
                key={`${sponsor.name}-${idx}`}
                target="_blank"
                rel="noopener noreferrer"
                title={sponsor.name}
                className="block hover:opacity-70"
              >
                {inner}
              </a>
            ) : (
              <div key={`${sponsor.name}-${idx}`} title={sponsor.name}>
                {inner}
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Thank you to the organizations that make independent journalism possible.
        </p>
      </Reveal>
    );
  }
}

export default SponsorsSection;