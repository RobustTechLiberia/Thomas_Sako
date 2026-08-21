import React from "react";
import icon1 from "../../../images/icon_1.png";
import icon2 from "../../../images/icon_2.png";
import icon3 from "../../../images/icon_3.png";

class Content extends React.Component {
  render() {
    return (
      <>
        {/* Changed from flex-wrap to an adaptive grid layout and removed rigid h-132 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center items-stretch md:gap-10 lg:gap-10 gap-8 md:mt-20 lg:mt-20 mt-10 mx-auto max-w-7xl px-4 bg-white">
          {/* card 1 */}
          {/* Removed fixed h-120 and h-80, changed border-b-10 to border-b-8 to fit standard Tailwind */}
          <div className="w-full max-w-sm border-b-violet-300 border-b-8 flex flex-col justify-between pb-8 md:shadow-xl lg:shadow-xl shadow-2xs bg-white">
            <div>
              {/* font-awesome icon */}
              {/* Fixed invalid w-19 to w-20 */}
              <div className="flex flex-col justify-center items-center mt-5">
                <img
                  src={icon1}
                  className="w-20"
                  alt="Advertising Inquiries Icon"
                />
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
            </div>
            {/* get started button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-violet-200 capitalize hover:bg-violet-400 transition-colors duration-1000 cursor-pointer text-violet-950 font-semibold text-lg py-3 px-10 rounded inline-block text-center"
              >
                get started
              </a>
            </div>
          </div>

          {/* card 2 */}
          {/* Removed fixed h-120 and h-96, changed border-b-10 to border-b-8 */}
          <div className="w-full max-w-sm border-b-green-300 border-b-8 flex flex-col justify-between pb-8 md:shadow-xl lg:shadow-xl shadow-2xs bg-white">
            <div>
              {/* font-awesome icon */}
              {/* Fixed invalid w-19 to w-20 */}
              <div className="flex flex-col justify-center items-center mt-5">
                <img src={icon2} className="w-20" alt="Write for Us Icon" />
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
            </div>
            {/* apply today button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-green-800 capitalize hover:bg-green-500 transition-colors duration-1000 cursor-pointer text-white font-semibold text-lg py-3 px-10 rounded inline-block text-center"
              >
                apply today
              </a>
            </div>
          </div>

          {/* card 3 */}
          {/* Removed fixed h-120 and h-96, changed border-b-10 to border-b-8 */}
          {/* Added md:col-span-2 lg:col-span-1 to cleanly center the third card if layout breaks into 2 columns on tablet viewports */}
          <div className="w-full max-w-sm md:col-span-2 lg:col-span-1 border-b-violet-900 border-b-8 flex flex-col justify-between pb-8 md:shadow-xl lg:shadow-xl shadow-2xs bg-white">
            <div>
              {/* font-awesome icon */}
              {/* Fixed invalid w-19 to w-20 */}
              <div className="flex flex-col justify-center items-center mt-5">
                <img
                  src={icon3}
                  className="w-20"
                  alt="Speaking Engagement Icon"
                />
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
            </div>
            {/* book now button */}
            <div className="flex flex-col justify-start items-start mx-10 mt-10">
              <a
                href="#"
                className="bg-violet-400 hover:bg-violet-500 transition-colors duration-1000 cursor-pointer text-white font-semibold text-lg py-3 px-10 rounded inline-block text-center"
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
