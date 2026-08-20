import React from "react";
import profile from "../../../images/Copilot_20260816_124134.png";
import OurTeam from "../../../components/features/component/our_team";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome
import GuestHost from "./guest_host";

class AboutContent extends React.Component {
  render() {
    return (
      <>
        <div className="bg-violet-900 md:bg-violet-950 lg:bg-violet-950 gap-5 md:gap-10 lg:gap-10 h-auto md:h-196 lg:h-196 mt-2 mb-5 md:mt-8 lg:mt-8 mx-2 md:mx-10 lg:mx-10">
          <div className="flex flex-wrap justify-center items-start md:justify-start lg:justify-start h-auto md:mx-20 lg:mx-20 md:pt-6 lg:pt-6">
            <div className="w-full md:w-auto lg:w-auto flex justify-center md:justify-start lg:justify-start mt-5 md:mt-8 lg:mt-8">
              <img
                src={profile}
                alt="Profile"
                className="h-40 w-40 md:h-40 md:w-40 lg:h-60 lg:w-60 rounded-full object-cover"
              />
            </div>

            <div className="w-full md:w-md lg:w-md text-center md:text-left md:mx-18 lg:mx-18 pt-20 md:mt-8 lg:mt-8 flex flex-col justify-center md:h-80 lg:h-80">
              <h1 className="font-sans text-white font-semibold capitalize text-5xl md:text-white lg:text-white">
                thomas sako
              </h1>
              <span className="font-serif text-lg uppercase py-3 md:text-white lg:text-white text-white">
                host
              </span>
              {/* social media icons */}
              <div className="flex flex-wrap justify-start items-start gap-8 md:justify-start lg:justify-start md:items-start lg:items-start md:gap-5 lg:gap-5">
                <div className="p-3 rounded-full bg-transparent border-none transition">
                  <a href="#" className="cursor-pointer">
                    <i className="fa-brands fa-youtube text-xl md:text-2xl lg:text-2xl text-violet-900 md:text-white lg:text-white"></i>
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

              <p className="md:text-white lg:text-white text-white text-left md:mb-0 lg:mb-0 mb-10 md:mx-0 lg:mx-0 mx-8 text-lg mt-4">
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
