import React from "react";
import "@fortawesome/fontawesome-free/css/all.min.css"; // Import Font Awesome CSS

class SocialIcons extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:h-28 my-10 bg-white gap-5">
          <div className="w-auto">
            <h4 className="text-left font-serif md:text-3xl lg:text-3xl text-2xl capitalize py-5">
              Follow our social media
            </h4>
          </div>

          <div className="w-auto flex gap-6">
            {/* YouTube */}
            <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-youtube text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* X (Twitter) */}
            <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-x-twitter text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>

            {/* Facebook */}
            <a href="#" className="cursor-pointer">
              <i className="fa-brands fa-facebook-f text-violet-900 md:text-3xl lg:text-3xl text-2xl"></i>
            </a>
          </div>
        </div>
      </>
    );
  }
}

export default SocialIcons;
