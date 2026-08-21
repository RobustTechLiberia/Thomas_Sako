import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome CSS

class SocialIcons extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      links: {
        youtube: "",
        facebook: "",
        x: "",
      },
      loading: true,
    };
  }

  componentDidMount() {
    // FIXED SYNTAX: Fixed the broken ternary operator and added a safe, universal absolute origin path setup
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const backendUrl = isLocalhost
      ? "http://localhost:5000/api/socialmedia"
      : "/api/socialmedia";

    fetch(backendUrl)
      .then((response) => response.json())
      .then((data) => {
        this.setState({ links: data, loading: false });
      })
      .catch((error) => {
        console.error("Error loading environmental configurations:", error);
        this.setState({ loading: false });
      });
  }

  // FIXED ROUTING MECHANISM: Added a reliable click-handler function that enforces tab routing
  handleIconClick = (e, platformUrl) => {
    e.preventDefault();

    // Fallbacks if backend doesn't resolve fast enough or fails
    let targetUrl = platformUrl;
    if (!targetUrl || targetUrl === "") {
      if (e.currentTarget.id === "yt-link") targetUrl = "https://youtube.com";
      if (e.currentTarget.id === "x-link") targetUrl = "https://twitter.com";
      if (e.currentTarget.id === "fb-link") targetUrl = "https://facebook.com";
    }

    // Force external new-window tracking protocol
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  render() {
    const { links } = this.state;

    return (
      <>
        {/* Fixed invalid rigid heights to make container fully responsive */}
        <div className="flex flex-wrap justify-center items-center my-10 px-4 bg-white gap-5">
          <div className="w-auto">
            <h4 className="text-left font-serif md:text-3xl lg:text-3xl text-2xl capitalize py-5">
              Follow our social media
            </h4>
          </div>

          <div className="w-auto flex gap-6">
            {/* YouTube */}
            <a
              id="yt-link"
              href={links.youtube || ""}
              onClick={(e) => this.handleIconClick(e, links.youtube)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-youtube text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* X (Twitter) */}
            <a
              id="x-link"
              href={links.x || ""}
              onClick={(e) => this.handleIconClick(e, links.x)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-x-twitter text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* Facebook */}
            <a
              id="fb-link"
              href={links.facebook || ""}
              onClick={(e) => this.handleIconClick(e, links.facebook)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-facebook-f text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>
          </div>
        </div>
      </>
    );
  }
}

export default SocialIcons;
