import { Component } from "react";

/**
 * Sidebar advertisement shown beside the poll. Adverts come from
 * /api/content/settings; the server filters out inactive/expired ads and
 * orders them by the CMS `order` field. Renders nothing when no ad is live.
 */
class Advert extends Component {
  state = { adverts: [], current: 0 };

  componentDidMount() {
    this.load();
  }

  componentWillUnmount() {
    if (this.interval) clearInterval(this.interval);
  }

  load = async () => {
    try {
      const res = await fetch("/api/content/settings");
      if (!res.ok) return;
      const data = await res.json();
      const adverts = Array.isArray(data.adverts) ? data.adverts : [];
      if (!adverts.length) return;
      this.setState({ adverts });
      if (adverts.length > 1) {
        this.interval = setInterval(() => {
          this.setState((prev) => ({ current: (prev.current + 1) % adverts.length }));
        }, 15000);
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
      <div className="flex w-full max-w-4xl flex-col border border-gray-400 bg-white lg:w-72 lg:max-w-none lg:shrink-0">
        <a
          href={advert.link || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full lg:flex-1"
          aria-label={advert.title || "advertisement"}
        >
          <img
            src={advert.image}
            alt={advert.title || "advertisement"}
            className="aspect-[4/3] w-full object-cover lg:h-full lg:aspect-auto"
          />
        </a>
        <div className="flex w-full flex-col items-center justify-center bg-violet-950 px-6 py-4 lg:py-5">
          <h1 className="text-center font-semibold text-lg uppercase text-white">
            advertisement
          </h1>
        </div>
      </div>
    );
  }
}

export default Advert;