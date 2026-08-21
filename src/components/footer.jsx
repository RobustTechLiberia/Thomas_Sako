import React from "react";
import logo from "../images/Copilot_20260816_124825.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

class Footer extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-col justify center items-center md:h-96 lg:h-96 h-80 bg-violet-100 md:mt-0 lg:mt-0 mt-0">
          <div className="w-auto md:mt-20 lg:mt-20 mt-20">
            <img src={logo} alt="" srcset="" className="md:w-80 lg:w-80 w-50" />
          </div>
          <div className="w-auto flex gap-6">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@1847Liberty"
              className="cursor-pointer"
            >
              <i className="fa-brands fa-youtube text-violet-950 md:text-xl lg:text-xl text-2xl"></i>
            </a>

            {/* X (Twitter) */}
            <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-x-twitter text-violet-950 md:text-xl lg:text-xl text-2xl"></i>
            </a>

            {/* Facebook */}
            <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-facebook-f text-violet-950 md:text-xl lg:text-xl text-2xl"></i>
            </a>
          </div>
          {/* copyright */}

          <div className="w-auto">
            <p className="font-serif text-lg py-3 text-center capitalize">
              <span className="lowercase">copyright </span>
              all right reserved
            </p>
          </div>
        </div>
      </>
    );
  }
}

export default Footer;
