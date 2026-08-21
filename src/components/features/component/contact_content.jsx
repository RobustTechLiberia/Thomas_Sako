import React from "react";
import icon1 from "../../../images/icon_1.png";
import icon2 from "../../../images/icon_2.png";
import icon3 from "../../../images/icon_3.png";

class Content extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:gap-10 lg:gap-10 gap-8 md:mt-20 lg:mt-20 mt-10 bg-white md:h-132 lg:h-132 h-auto">
          <div className="md:w-96 lg:w-96 w-80  border-b-violet-300 border-b-10 md:h-120 lg:h-120 h-80 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* font-awesome icon */}
            <div className="flex flex-col justify-center items-center mt-5">
              <img src={icon1} className="w-19" />
            </div>
            <div className="w-auto h-auto bg-white">
              <h1 className="text-left font-sans font-semibold text-4xl capitalize mx-10 py-3">
                advertising inquiries
              </h1>
              <p className="font-serif text-lg mx-10 py-2">
                Interested in getting your brand advertise? <br />
                please connect with us here
              </p>
            </div>
            {/* get started button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-violet-200 capitalize hover:bg-violet-400 transform duration-1000 cursor-pointer text-violet-950 font-semibold text-lg py-3 px-10 rounded"
              >
                get started
              </a>
            </div>
          </div>
          <div className="md:w-96 lg:w-96 w-80  border-b-green-300 border-b-10 md:h-120 lg:h-120 h-96 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* font-awesome icon */}
            <div className="flex flex-col justify-center items-center mt-5">
              <img src={icon2} className="w-19" />
            </div>
            <div className="w-auto h-auto bg-white">
              <h1 className="text-left font-sans font-semibold text-4xl capitalize mx-10 py-3">
                write for TSako.com
              </h1>
              <p className="font-serif text-lg mx-10 py-2">
                Nothing but well formed opinion <br />
                come write for us
              </p>
            </div>
            {/* apply today button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-green-800 capitalize hover:bg-green-500 transform duration-1000 cursor-pointer text-white font-semibold text-lg py-3 px-10 rounded"
              >
                apply today
              </a>
            </div>
          </div>
          <div className="md:w-96 lg:w-96 w-80  border-b-violet-900 border-b-10 md:h-120 lg:h-120 h-96 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* font-awesome icon */}
            <div className="flex flex-col justify-center items-center mt-5">
              <img src={icon3} className="w-19" />
            </div>
            <div className="w-auto h-auto bg-white">
              <h1 className="text-left font-sans font-semibold text-4xl capitalize mx-10 py-3">
                engage thomas to speak
              </h1>
              <p className="font-serif text-lg mx-10 py-2">
                Delivers an engaging thought-provoking, balanced dialogue on
                today's political arena <br />
              </p>
            </div>
            {/* book now button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-violet-400 hover:bg-violet-500 transform duration-1000 cursor-pointer text-white font-semibold text-lg py-3 px-10 rounded"
              >
                Book now
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Content;
