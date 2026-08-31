import React from "react";
import profile from "../../../images/Copilot_20260816_124134.png";
import OurTeam from "../../../components/features/component/our_team";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome
import GuestHost from "./guest_host";

class AboutContent extends React.Component {
  render() {
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
                thomas sako
              </h1>
              <span className="font-serif text-lg uppercase py-3 md:text-white lg:text-white text-white">
                host
              </span>
              {/* social media icons */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 md:justify-start">
                <div className="p-3 rounded-full bg-transparent border-none transition">
                  <a
                    href="https://www.youtube.com/@1847Liberty"
                    className="cursor-pointer"
                  >
                    <i className="fa-brands fa-youtube text-xl md:text-2xl lg:text-2xl text-white md:text-white lg:text-white"></i>
                  </a>
                </div>

                <div className="p-3 rounded-full bg-transparent border-none transition">
                  <a href="#" className="cursor-pointer">
                    <i className="fa-brands fa-x-twitter text-xl md:text-2xl lg:text-2xl text-white md:text-white lg:text-white"></i>
                  </a>
                </div>

                <div className="p-3 rounded-full bg-transparent border-none transition">
                  <a href="#" className="cursor-pointer">
                    <i className="fa-brands fa-facebook-f text-xl md:text-2xl lg:text-2xl text-white md:text-white lg:text-white"></i>
                  </a>
                </div>

                <div className="p-3 rounded-full bg-transparent border-none transition">
                  <a href="#" className="cursor-pointer">
                    <i className="fa-brands fa-instagram text-xl md:text-2xl lg:text-2xl text-white md:text-white lg:text-white"></i>
                  </a>
                </div>
              </div>

              <p className="mx-0 mb-10 mt-4 text-left text-lg text-white md:mb-0">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                Blanditiis culpa neque dolor veniam magni assumenda nesciunt
                itaque iusto inventore sit. Adipisci iste eos, porro assumenda
                mollitia qui! Temporibus, unde corporis?
              </p>
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
