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
        instagram: "",
        whatsapp: "",
        tiktok: "",
        gmail: "",
      },
      loading: true,
    };
  }

  componentDidMount() {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // Updated port from 5000 to 8080 to match your Express server configuration
    const backendUrl = isLocalhost
      ? "http://localhost:8080/api/socialmedia"
      : "/api/socialmedia";

    fetch(backendUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // FIXED PAYLOAD MISMATCH: We pull directly from data.youtube but add logical fallbacks
        // to original env keys just in case the server transfers raw process.env properties.
        this.setState({
          links: {
            youtube: data.youtube || data.YOUTUBE_CHANNEL_URL || "",
            facebook: data.facebook || data.FACEBOOK_PAGE_URL || "",
            x: data.x || data.X_PAGE_URL || "",
            instagram: data.instagram || data.INSTAGRAM_PAGE_URL || "",
            whatsapp: data.whatsapp || data.WHATSAPP_ACCOUNT || "",
            tiktok: data.tiktok || data.TIKTOK_PAGE_URL || "",
            gmail: data.gmail || data.GMAIL_ACCOUNT || "",
          },
          loading: false,
        });
      })
      .catch((error) => {
        console.error("Error loading environmental configurations:", error);
        this.setState({ loading: false });
      });
  }

  handleIconClick = (e, platformUrl) => {
    e.preventDefault();

    if (!platformUrl || platformUrl.trim() === "") {
      console.warn("Social link path is empty or not yet loaded");
      return;
    }

    window.open(platformUrl, "_blank", "noopener,noreferrer");
  };

  render() {
    const { links } = this.state;

    return (
      <>
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

            {/* Instagram */}
            <a
              id="insta-link"
              href={links.instagram || ""}
              onClick={(e) => this.handleIconClick(e, links.instagram)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-instagram text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* TikTok */}
            <a
              id="tiktok-link"
              href={links.tiktok || ""}
              onClick={(e) => this.handleIconClick(e, links.tiktok)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-tiktok text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* WhatsApp */}
            <a
              id="whatsapp-link"
              href={links.whatsapp || "#"}
              onClick={(e) => this.handleIconClick(e, links.whatsapp)}
              className="cursor-pointer"
            >
              <i className="fa-brands fa-whatsapp text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>
          </div>
        </div>
      </>
    );
  }
}

export default SocialIcons;
