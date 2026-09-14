import React from "react";
import { toEmbedUrl, toWatchUrl } from "./mediaUtils";

class Pod extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: [],
      loading: true,
      error: "",
      activeEmbed: "",
      activeTitle: "",
    };
  }

  componentDidMount() {
    this.load();
  }

  load = async () => {
    try {
      const res = await fetch("/api/podcasts");
      if (!res.ok) throw new Error("Failed to load podcasts");
      const data = await res.json();
      const items = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
      this.setState({ items, loading: false });
    } catch (err) {
      this.setState({ loading: false, error: err.message || "Failed to load podcasts" });
    }
  };

  openFullscreen = (embed, title) => {
    this.setState({ activeEmbed: embed, activeTitle: title });
    document.body.style.overflow = "hidden";
  };

  closeFullscreen = () => {
    this.setState({ activeEmbed: "", activeTitle: "" });
    document.body.style.overflow = "";
  };

  componentWillUnmount() {
    document.body.style.overflow = "";
  }

  render() {
    const { items, loading, error, activeEmbed, activeTitle } = this.state;

    if (loading) {
      return (
        <div className="flex w-full items-center justify-center bg-white py-24 md:py-40">
          <p className="text-gray-500 text-lg">Loading episodes…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex w-full items-center justify-center bg-white px-4 py-24 md:py-40">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      );
    }

    if (!items.length) {
      return (
        <div className="flex w-full items-center justify-center bg-white px-4 py-24 md:py-40">
          <p className="text-gray-500 text-lg">No episodes released yet — check back soon.</p>
        </div>
      );
    }

    const renderCard = (item, index) => {
      const embed = toEmbedUrl(item.mediaUrl);
      const watch = toWatchUrl(item.mediaUrl);
      return (
        <div className="w-full md:flex-1 bg-white" key={`${item.id}-${index}`}>
          <iframe
            className="w-full aspect-video rounded-none shadow-none"
            src={embed}
            title={`Embedded video player ${index + 1}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
          <h3 className="text-left font-sans font-semibold text-2xl py-5">
            {item.title}
          </h3>
          {item.description ? (
            <p className="text-left font-sans text-base text-gray-600 -mt-3 pb-3">
              {item.description}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pb-8">
            <button
              type="button"
              onClick={() => this.openFullscreen(embed, item.title)}
              className="border-none bg-violet-900 px-4 py-2 text-sm font-semibold text-white cursor-pointer"
            >
              Full screen
            </button>
            <a
              href={watch}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-violet-900 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-900 hover:text-white"
            >
              Watch on YouTube
            </a>
          </div>
        </div>
      );
    };

    const firstRow = items.slice(0, 3);
    const secondRow = items.slice(3, 6);

    return (
      <>
        {/* fullscreen player modal */}
        {activeEmbed && (
          <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 px-4 py-6"
            onClick={this.closeFullscreen}
          >
            <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2 className="font-sans font-semibold text-lg text-white line-clamp-2">
                  {activeTitle}
                </h2>
                <button
                  type="button"
                  onClick={this.closeFullscreen}
                  className="shrink-0 border-none bg-violet-900 px-4 py-2 text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
              <iframe
                className="w-full aspect-video rounded border-none shadow-none"
                src={activeEmbed}
                title="Full screen video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* heading */}
        <div className="bg-violet-200 md:h-full lg:h-full h-auto border-b-none border-b-gray-200">
          <div className="h-auto md:h-10 lg:h-10">
            <h1 className="text-center font-sans font-bold capitalize md:mx-0 lg:mx-0 mx-2 text-5xl md:mt-0 lg:pt-20 pt-10 md:text-4xl lg:text-4xl">
              the 1847 liberty show
            </h1>
          </div>

          {firstRow.length > 0 && (
            <div className="flex flex-col md:flex-row justify-evenly md:pt-0 lg:pt-0 mx-0 md:mx-5 lg:mx-5 mt-10 md:mt-32 pt-0 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
              {firstRow.map((item, index) => renderCard(item, index))}
            </div>
          )}

          {secondRow.length > 0 && (
            <>
              <h2 className="w-full text-center font-sans font-bold capitalize text-3xl pt-16 pb-0 md:pt-24">
                Watch previous episodes
              </h2>
              <div className="flex flex-col md:flex-row justify-evenly md:pt-4 lg:pt-4 mx-0 mt-10 md:mt-8 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
                {secondRow.map((item, index) => renderCard(item, index + 3))}
              </div>
            </>
          )}
        </div>
      </>
    );
  }
}

export default Pod;