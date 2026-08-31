import React from "react";
import logo from "../images/Copilot_20260816_124825.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

class Footer extends React.Component {
  render() {
    return (
      <>
        <div className="flex min-h-80 flex-col items-center justify-center gap-5 bg-violet-100 px-4 py-10">
          <div className="w-full max-w-80">
            <img src={logo} alt="" className="w-full" />
          </div>
          <div className="flex flex-wrap justify-center gap-6">
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
