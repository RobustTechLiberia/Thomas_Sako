import React from "react";
import img1 from "../../../images/WhatsApp Image 2026-09-27 at 3.31.01 AM (2).jpeg";
import img2 from "../../../images/WhatsApp Image 2026-09-27 at 3.31.01 AM.jpeg";
import img3 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.42 PM.jpeg";
import img4 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.54 PM.jpeg";
import img5 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.59 PM.jpeg";
import img6 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.59 PM (1).jpeg";
import Poem from "../component/poem";

class Portfolio extends React.Component {
  render() {
    return (
      <>
        {/* Heading */}
        {/* <h1 className="font-bold text-5xl md:text-5xl text-left md:text-center text-[#830000] capitalize py-3 mx-3 md:mx-0">
          gallery
        </h1> */}

        {/* Main Gallery Container */}
        <div className="bg-white my-20">
          <div className="flex flex-wrap justify-center items-center md:gap-0 gap-3 max-w-7xl mx-auto px-4">
            {/* Gallery Image Item 1 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden">
              <img
                src={img1}
                alt="Gallery item 1"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:opacity-60"
              />
            </div>

            {/* Gallery Image Item 2 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden">
              <img
                src={img2}
                alt="Gallery item 2"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:opacity-60"
              />
            </div>

            {/* Gallery Image Item 3 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden">
              <img
                src={img3}
                alt="Gallery item 3"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:opacity-60"
              />
            </div>

            {/* Gallery Image Item 4 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden">
              <img
                src={img4}
                alt="Academic gallery item 1"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:bg-white hover:opacity-60"
              />
            </div>

            {/* Gallery Image Item 5 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden">
              <img
                src={img5}
                alt="Academic gallery item 2"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:opacity-60"
              />
            </div>

            {/* Gallery Image Item 6 */}
            <div className="w-full sm:w-80 h-64 bg-[#830000] rounded-none overflow-hidden shadow-none">
              <img
                src={img6}
                alt="Academic gallery item 3"
                className="w-full h-full object-cover transition-transform duration-300 ease-in-out cursor-pointer hover:opacity-60"
              />
            </div>
          </div>
        </div>
        {/* poem */}
        <Poem />
      </>
    );
  }
}

export default Portfolio;
