import React from "react";
import { Link } from "react-router-dom";

class Quest1 extends React.Component {
  render() {
    return (
      <>
        {/* card */}
        <div className="flex flex-wrap md:justify-between lg:justify-between justify-center items-center h-auto">
          <div className="md:h-150 lg:h-150 bg-white md:mx-10 lg:mx-10 md:w-4xl lg:w-4xl w-full h-140 md:mt-2 lg:mt-2 mt-0 md:shadow-xl lg:shadow-xl shadow-none">
            <h1 className="md:text-5xl lg:text-5xl text-4xl pt-10 text-center md:pt-8 lg:pt-10 font-sans font-semibold uppercase text-violet-950">
              today's poll
            </h1>
            <div className="flex flex-wrap justify-center items-center my-8">
              <hr className="border-none bg-violet-900 md:w-80 lg:w-80 w-75 md:h-1 lg:h-1 h-2" />
            </div>
            {/* question */}
            <span className="text-sm font-serif capitalize md:mx-28 lg:mx-28 md:my-1 lg:my-1 my-2 mx-5">
              <span className="text-red-600">*</span> question 2
            </span>
            <h3 className="text-center flex flex-wrap md:justify-center lg:justify-center md:items-center lg:items-center font-sans font-semibold text-3xl md:mx-10 lg:mx-10 ">
              What do you think about the commodities prices?
            </h3>
            {/* opitions */}
            <from className="w-auto md:mx-32 lg:mx-32 mx-2">
              {/* answer 1 */}
              <div className="md:my-1 lg:my-1" id="Q1">
                <label className="md:mx-32 lg:mx-32 mx-8 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans">
                  <input
                    type="radio"
                    name="Good"
                    id="good"
                    className="md:mt-5 lg:mt-5 mt-5 "
                  />{" "}
                  good
                </label>
              </div>
              {/* answer 2 */}
              <div className="md:my-3 lg:my-3" id="Q1">
                <label className="md:mx-32 lg:mx-32 mx-8 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans">
                  <input
                    type="radio"
                    name="Bad"
                    id="bad"
                    className="md:mt-5 lg:mt-5 mt-5 "
                  />{" "}
                  bad
                </label>
              </div>

              {/* reasons */}
              <div className="bg-white md:pt-5 lg:pt-5 pt-5 pb-2">
                <label className="font-sans font-normal md:mx-32 lg:mx-32 mx-8 text-lg">
                  Kindly provide your reason
                  <br />
                  <input
                    type="text"
                    name="reasons"
                    id=""
                    className="border-b border-t-0 border-r-0 border-l-0 border-b-violet-900 md:mx-32 lg:mx-32 mx-8 md:w-xl lg:w-xl w-80 py-3"
                  />
                </label>
              </div>
              {/* next */}

              <div className="md:mt-8 lg:mt-8 mt-5">
                <Link
                  to="/quest3"
                  className="py-3 md:py-3 lg:py-3 bg-violet-900 text-white px-10 text-xl font-semibold mx-8 md:mx-32 lg:mx-32 capitalize"
                >
                  next
                </Link>
                {/* <input
                    type="submit"
                    value="submit"
                    className="md:py-3 lg:py-3 py-3 bg-violet-900 text-white md:w-28 lg:w-28 w-28 text-xl font-semibold md:mx-32 lg:mx-32 mx-8"
                  /> */}
              </div>
            </from>
          </div>
        </div>
      </>
    );
  }
}

export default Quest1;
