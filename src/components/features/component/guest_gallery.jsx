import React from "react";
import guest_1 from "../../../images/1793551783406.jpg";
import guest_2 from "../../../images/1793555053400.jpg";
import guest_3 from "../../../images/Reflective Liberty Portrait.png";
class GuestGallery extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:justify-start md:mt-10 lg:mt-10 mt-8 lg:justify-start md:items-start lg:items-start gap-10 md:gap-0 md:mx-10 lg:mx-10 lg:gap-0  md:h-auto lg:h-auto h-auto mb-20 md:mb-0 lg:mb-0">
          <div className="w-80 bg-gray-100 h-auto">
            <img
              src={guest_1}
              alt="Guest 1"
              srcset=""
              className="md:h-52 h-56 object-cover w-full"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-[#830000]  text-white text-lg text-center capitalize">
              ahamadu sirleaf
              <br />{" "}
              <span className="font-bold capitalize">
                <span className="uppercase">ceo</span> &amp; developer
                <br /> chip chat
              </span>
            </div>
          </div>
          <div className="w-80 bg-gray-50 h-auto">
            <img
              src={guest_2}
              alt="Guest 2"
              srcset=""
              className="h-52 object-cover w-full"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 h-28 bg-[#BC0202]  text-white text-lg text-center capitalize">
              enid mai jones king <br />
              <span className="font-bold capitalize">
                entrepreneur
                <br /> <span className="uppercase">ai</span>-strategist
              </span>
            </div>
          </div>
          <div className="w-80 bg-gray-200 h-auto">
            <img
              src={guest_3}
              alt="Guest 3"
              srcset=""
              className="h-52 object-cover w-full"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-[#830000] text-white text-lg text-center capitalize">
              mr. j. mawolo
            </div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image4.jpg"
              alt="Guest 4"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-[#BC0202]"></div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image5.jpg"
              alt="Guest 5"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-[#830000]"></div>
          </div>
        </div>
      </>
    );
  }
}

export default GuestGallery;
