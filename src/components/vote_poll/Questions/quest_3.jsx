import React from "react";

class Quest3 extends React.Component {
  render() {
    return (
      <>
        {/* card */}
        <div className="flex flex-wrap md:justify-between lg:justify-between justify-center items-center h-auto">
          <div className="md:h-130 lg:h-130 bg-white md:mx-10 lg:mx-10 md:w-4xl lg:w-4xl w-full h-110 md:mt-5 lg:mt-5 mt-0 shadow-xl">
            <h1 className="md:text-5xl lg:text-5xl text-4xl pt-10 text-center md:pt-10 lg:pt-10 font-sans font-semibold uppercase text-violet-950">
              today's poll
            </h1>
            <div className="flex flex-wrap justify-center items-center my-8">
              <hr className="border-none bg-violet-900 md:w-80 lg:w-80 w-75 md:h-1 lg:h-1 h-2" />
            </div>
            {/* question */}
            <span className="text-sm font-serif capitalize md:mx-28 lg:mx-28 md:my-2 lg:my-2 my-2 mx-5">
              <span className="text-red-600">*</span> question 3
            </span>
            <h3 className="text-center flex flex-wrap md:justify-center lg:justify-center md:items-center lg:items-center font-sans font-semibold text-3xl md:mx-20 lg:mx-20 ">
              What is the current state of our nation's encomy?
            </h3>
            {/* opitions */}
            <from className="w-auto md:mx-32 lg:mx-32 mx-2">
              {/* answer 1 */}
              <div className="md:my-3 lg:my-3" id="Q1">
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
              
              {/* next */}

              <div className="md:mt-12 lg:mt-12 mt-5">
                <a
                  href="#"
                  className="md:py-3 lg:py-3 py-3 capitalize bg-violet-900 text-white md:w-28 lg:w-28 px-10 text-xl font-semibold md:mx-32 lg:mx-32 mx-8"
                >
                  next
                </a>
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

export default Quest3;
