import React from "react";
import img1 from "../../../images/WhatsApp Image 2026-09-27 at 3.31.01 AM (2).jpeg";
import img2 from "../../../images/WhatsApp Image 2026-09-27 at 3.31.01 AM.jpeg";
import img3 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.42 PM.jpeg";

class Portfolio extends React.Component {
  render() {
    return (
      <>
        {/* heading */}
        <h1 className="font-bold text-3xl md:text-center text-left text-[#830000] md:mx-0 mx-3 md:text-5xl capitalize py-3">
          gallery
        </h1>
        <div className="flex flex-wrap justify-center items-center md:h-96 h-auto bg-white">
          <div className="w-28 h-28 bg-white">
            <img src="" alt="" className="s w-full h-auto object-cover" />
          </div>
          <div className="w-80 h-auto bg-white">
            <img src={img1} alt="" className="s w-full h-auto object-cover" />
          </div>
          <div className="w-80 h-auto bg-white">
            <img src={img2} alt="" className="s w-full h-auto object-cover" />
          </div>
          <div className="w-80 h-auto bg-white">
            <img src={img3} alt="" className="s w-full h-auto object-cover" />
          </div>
        </div>
      </>
    );
  }
}

export default Portfolio;
