import React from "react";
import profile from "../../../images/Copilot_20260816_124134.png";
import OurTeam from "../../../components/features/component/our_team"
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome

class AboutContent extends React.Component {
  render() {
    return (
      <>
        <div className="bg-white md:bg-violet-950 lg:bg-violet-950 gap-5 md:gap-10 lg:gap-10 h-auto md:h-140 lg:h-140 mt-0 md:mt-8 lg:mt-8 mx-0 md:mx-20 lg:mx-20">
          <div className="flex flex-wrap justify-center items-start md:justify-start lg:justify-start h-auto md:mx-20 lg:mx-20 md:pt-6 lg:pt-6">
            {/* Profile image */}
            <div className="w-full md:w-auto lg:w-auto flex justify-center md:justify-start lg:justify-start mt-5 md:mt-8 lg:mt-8">
              <img
                src={profile}
                alt="Profile"
                className="h-40 w-40 md:h-40 md:w-40 lg:h-60 lg:w-60 rounded-full object-cover"
              />
            </div>

            {/* Auto bio */}
            <div className="w-full md:w-md lg:w-md text-center md:text-left md:mx-20 lg:mx-20 mt-5 md:mt-0 lg:mt-0 flex flex-col justify-center md:h-80 lg:h-80">
              <h1 className="font-sans font-semibold capitalize text-5xl md:text-white lg:text-white text-violet-950">
                thomas sako
              </h1>
              <span className="font-serif text-lg uppercase py-3 md:text-white lg:text-white text-violet-950">
                host
              </span>

              {/* Social icons */}
              <div className="flex justify-center md:justify-start lg:justify-start md:items-start lg:items-start gap-5 mt-2">
                {/* YouTube */}
                <div className="p-3 rounded-full bg-transparent border-none border-white transition">
                  <i className="fa-brands fa-youtube md:text-2xl lg:text-2xl text-xl md:text-white lg:text-white text-violet-900"></i>
                </div>

                {/* X (Twitter) */}
                <div className="p-3 rounded-full bg-transparent border-none border-white transition">
                  <i className="fa-brands fa-x-twitter md:text-2xl lg:text-2xl text-xl md:text-white lg:text-white text-violet-900"></i>
                </div>

                {/* Facebook */}
                <div className="p-3 rounded-full bg-transparent border-none border-whit transition">
                  <i className="fa-brands fa-facebook-f md:text-2xl lg:text-2xl text-xl md:text-white lg:text-white text-violet-900"></i>
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-full bg-transparent border-none border-white transition">
                  <i className="fa-brands fa-instagram md:text-2xl lg:text-2xl text-xl md:text-white lg:text-white text-violet-900"></i>
                </div>
              </div>

              <p className="md:text-white lg:text-white text-gray-800 text-left md:mb-0 lg:mb-0 mb-10 md:mx-0 lg:mx-0 mx-8 text-lg mt-4">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                Blanditiis culpa neque dolor veniam magni assumenda nesciunt
                itaque iusto inventore sit. Adipisci iste eos, porro assumenda
                mollitia qui! Temporibus, unde corporis?
              </p>
            </div>
          </div>
            </div>
            <OurTeam/>
      </>
    );
  }
}

export default AboutContent;
