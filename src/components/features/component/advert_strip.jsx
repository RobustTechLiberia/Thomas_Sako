import React from "react";
import Reveal from "../../reveal.jsx";

/**
 * CMS-driven advertising strip. Pulls active advertisements from
 * /api/content/settings — the server already filters by publish status and
 * start/end dates and orders them by the CMS `order` field.
 */
class AdvertStrip extends React.Component {
  constructor(props) {
    super(props);
    this.state = { adverts: [], current: 0 };
  }

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    if (this._interval) clearInterval(this._interval);
  }

  load = async () => {
    try {
      const res = await fetch("/api/content/settings");
      if (!res.ok) return;
      const data = await res.json();
      const adverts = Array.isArray(data.adverts) ? data.adverts : [];
      this.setState({ adverts });
      if (adverts.length > 1) {
        this._interval = setInterval(
          () => this.setState((prev) => ({ current: (prev.current + 1) % adverts.length })),
          15000,
        );
      }
    } catch {
      /* render nothing on failure */
    }
  };

  render() {
    const { adverts, current } = this.state;
    if (!adverts.length) return null;
    const advert = adverts[current];

    return (
      <Reveal as="section" className="flex items-center justify-center bg-white px-4 py-10">
        <div className="flex w-full max-w-4xl items-stretch border border-gray-300 bg-white lib-card-lift">
          <div className="flex-1">
            <a
              href={advert.link || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={advert.image}
                alt={advert.title}
                className="w-full h-40 object-cover md:h-52"
              />
            </a>
          </div>
          <div className="flex flex-col items-center justify-center gap-2 bg-violet-950 px-6 md:px-10 text-center">
            <h1 className="text-2xl font-semibold uppercase text-white md:text-3xl">
              advertisement
            </h1>
            {advert.title && (
              <p className="text-sm text-violet-200">{advert.title}</p>
            )}
          </div>
        </div>
      </Reveal>
    );
  }
}

export default AdvertStrip;