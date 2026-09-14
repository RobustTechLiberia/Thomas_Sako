import React from "react";
import profile from "../../../images/Copilot_20260816_124134.png";
import OurTeam from "../../../components/features/component/our_team";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome
import GuestHost from "./guest_host";

class AboutContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      heading: "thomas sako",
      subtitle: "host",
      bio: "",
      social: {},
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
        const heading =
          body.find((b) => b?.type === "heading")?.text || this.state.heading;
        const subtitle =
          body.find((b) => b?.type === "subtitle")?.text || this.state.subtitle;
        const bio =
          body.find((b) => b?.type === "paragraph")?.text || this.state.bio;
        this.setState({ heading, subtitle, bio });
      })
      .catch(() => {
        /* keep defaults */
      });

    fetch("/api/social")
      .then((res) => (res.ok ? res.json() : {}))
      .then((social) => this.setState({ social }))
      .catch(() => {
        /* keep defaults */
      });
  }

  render() {
    const { heading, subtitle, bio, social } = this.state;

    const icons = [
      { key: "youtube", cls: "fa-youtube", href: social.youtube || "https://www.youtube.com/@1847Liberty" },
      { key: "x", cls: "fa-x-twitter", href: social.x || "" },
      { key: "facebook", cls: "fa-facebook-f", href: social.facebook || "" },
      { key: "instagram", cls: "fa-instagram", href: social.instagram || "" },
    ];

    return (
      <>
        <div className="mx-2 my-5 bg-linear-to-b from-[#312252] to-[#120a21] md:mx-10 md:my-8 md:min-h-196">
          <div className="flex flex-wrap items-start justify-center px-4 py-6 md:mx-20 md:justify-start md:px-0">
            <div className="mt-5 flex w-full justify-center md:mt-8 md:w-auto md:justify-start">
              <img
                src={profile}
                alt="Profile"
                className="h-40 w-40 md:h-40 md:w-40 lg:h-60 lg:w-60 rounded-full object-cover"
              />
            </div>

            <div className="mt-5 flex w-full flex-col justify-center text-center md:mx-18 md:mt-8 md:h-80 md:w-md md:text-left">
              <h1 className="font-sans text-white font-semibold capitalize text-5xl md:text-white lg:text-white">
                {heading}
              </h1>
              <span className="font-serif text-lg uppercase py-3 md:text-white lg:text-white text-white">
                {subtitle}
              </span>
              {/* social media icons */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:justify-start">
                {icons.map(
                  (icon) =>
                    icon.href && (
                      <div
                        key={icon.key}
                        className="p-3 rounded-full bg-transparent border-none transition"
                      >
                        <a
                          href={icon.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <i className={`fa-brands ${icon.cls} text-xl md:text-2xl lg:text-2xl text-white md:text-white lg:text-white`}></i>
                        </a>
                      </div>
                    ),
                )}
              </div>

              {bio && (
                <p className="mx-0 mb-10 mt-4 text-left text-lg text-white md:mb-0">
                  {bio}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* our team */}
        <OurTeam />
        {/* guest host */}
        <GuestHost />
      </>
    );
  }
}

export default AboutContent;