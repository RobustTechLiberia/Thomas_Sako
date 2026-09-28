import React from "react";
import profile from "../../../images/Copilot_20260816_124134.png";
import OurTeam from "../../../components/features/component/our_team";
import "@fortawesome/fontawesome-free/css/all.min.css";
import GuestHost from "./guest_host";

class AboutContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpanded: false,
    };
    // Explicitly bind the handler to avoid context loss
    this.toggleReadMore = this.toggleReadMore.bind(this);
  }

  toggleReadMore() {
    this.setState((prevState) => ({
      isExpanded: !prevState.isExpanded,
    }));
  }

  render() {
    const { isExpanded } = this.state;

    return (
      <>
        {/* Banner Container */}
        <div className="bg-gradient-to-b from-[#830000] to-[#BC0202] my-5 md:my-8 mx-2 md:mx-10 rounded-none p-6 md:p-12">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 max-w-6xl mx-auto">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <img
                src={profile}
                alt="Thomas Sarko"
                className="h-40 w-40 lg:h-60 lg:w-60 rounded-full object-cover shadow-none border-4 border-none border-white/20"
              />
            </div>

            {/* Host Information */}
            <div className="flex-1 text-center md:text-left text-white">
              <h1 className="font-sans font-semibold capitalize text-4xl md:text-5xl">
                thomas sarko
              </h1>
              <span className="inline-block font-serif text-lg md:mx-3 uppercase py-2 tracking-wider opacity-90">
                host
              </span>

              {/* Social Media Links */}
              <div className="flex justify-center md:justify-start gap-5 my-4">
                <a
                  href="https://www.youtube.com/@1847Liberty"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube Channel"
                  className="p-3 rounded-full hover:bg-white/10 transition"
                >
                  <i className="fa-brands fa-youtube text-2xl"></i>
                </a>

                <a
                  href="#x"
                  aria-label="X (Twitter)"
                  className="p-3 rounded-full hover:bg-white/10 transition"
                >
                  <i className="fa-brands fa-x-twitter text-2xl"></i>
                </a>

                <a
                  href="#facebook"
                  aria-label="Facebook"
                  className="p-3 rounded-full hover:bg-white/10 transition"
                >
                  <i className="fa-brands fa-facebook-f text-2xl"></i>
                </a>

                <a
                  href="#instagram"
                  aria-label="Instagram"
                  className="p-3 rounded-full hover:bg-white/10 transition"
                >
                  <i className="fa-brands fa-instagram text-2xl"></i>
                </a>
              </div>

              {/* Biography */}
              <div className="text-base md:text-lg leading-relaxed text-white/95 mt-4">
                <p className="block">
                  Thomas M. Sarko is a Liberian peace advocate committed to
                  promoting sustainable stability in his home country. A
                  graduate of Cathedral Catholic School and the University of
                  Liberia, he served as co-editor of his school's Press Club and
                  later interned at UNMIL Radio.{" "}
                  {/* Balance text toggles in-place */}
                  {isExpanded ? (
                    <span>
                      He subsequently worked as a Public Relations Assistant at
                      the Liberia Electricity Corporation, where he co-produced
                      the institution's monthly newsletter, The Current. In
                      2012, motivated by a desire to help prevent a return to
                      civil conflict, Sarko co-founded Project Peace for
                      Liberia, an initiative that encourages young people to
                      channel frustration through creative expression and the
                      performing arts rather than violence. He relocated to the
                      United States in 2014 and, in 2022, earned a master's
                      degree in Corporate and Marketing Communication from IE
                      Business School in Madrid.
                    </span>
                  ) : null}
                  {/* Read More / Read Less Button */}
                  <button
                    type="button"
                    onClick={this.toggleReadMore}
                    className="ml-2 font-bold underline cursor-pointer hover:text-gray-200 transition-colors focus:outline-none"
                  >
                    {isExpanded ? "Read Less" : "... Read More"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Supporting Components */}
        <OurTeam />
        <GuestHost />
      </>
    );
  }
}

export default AboutContent;
