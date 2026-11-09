import React from "react";
import logo from "../images/Gemini_Generated_Image_5isb0t5isb0t5isb-removebg-preview.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

class Footer extends React.Component {
  render() {
    return (
      <>
        <div className="flex min-h-80 flex-col items-center justify-center bg-[#F67D31] px-4 py-12">
          <div className="w-auto md:mt-20 lg:mt-20 mt-20">
            <img src={logo} alt="" className="w-52 sm:w-64 md:w-80" />
          </div>
          <div className="w-auto flex gap-6">
            {/* YouTube */}
            <a
              href="https://www.youtube.com/@1847Liberty"
              className="cursor-pointer"
            >
              <i className="fa-brands fa-youtube text-[#830000] md:text-xl lg:text-xl text-2xl"></i>
            </a>

            {/* X (Twitter) */}
            {/* <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-x-twitter text-[#830000] md:text-xl lg:text-xl text-2xl"></i>
            </a> */}

            {/* Facebook */}
            <a
              href="https://web.facebook.com/share/p/1CLSS7NWxp/"
              className="cursor-pointer"
            >
              <i className="fa-brands fa-facebook-f text-[#830000] md:text-xl lg:text-xl text-2xl"></i>
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
