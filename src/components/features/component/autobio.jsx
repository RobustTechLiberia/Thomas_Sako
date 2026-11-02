import React from "react";
import image from "../../../images/Reflective Liberty Portrait.png";

class AutoBio extends React.Component {
  render() {
    return (
      <>
        {/* <h1 className="text-center font-sans text-[#830000] text-5xl md:mt-10 lg:mt-20 py-10 font-semibold capitalize">
          Testimonials
        </h1> */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between bg-white px-6 md:px-12 lg:px-20 py-32">
          {/* Left column: image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img
              src={image}
              alt="testimonal"
              className="w-md h-128 md:w-120 md:h-136 lg:w-lg lg:h-144 object-cover rounded-none shadow-none"
            />
          </div>

          {/* Right column: quote */}
          <div className="w-full md:w-1/2 md:pl-12 mt-8 md:mt-0 flex flex-col justify-center">
            <div className="text-[#830000] text-8xl font-bold md:mb-4 lg:mb-4 mb-3">
              “
              <h1 className="text-3xl text-[#830000] font-bold capitalize py-3">
                A Platform Worth Supporting
              </h1>
            </div>
            <p className="text-gray-800 md:text-lg text-lg  font-serif lg:text-lg capitalize">
              I first discovered the Liberty Show online a couple of months ago
              while browsing the internet. becoming part of the platform, I have
              never regretted my decision. What inspires me most is seeing the
              continuous effort to improve the program and its commitment to
              educating the public, promoting effective communication.For me,
              any platform genuinely committed to educating our people and
              making a positive difference in society is worth supporting. That
              is why I remain interested in the Liberty Show.
            </p>
            <p className="mt-6 font-semibold md:text-lg lg:text-lg text-lg capitalize text-[#830000]">
              mr. j. mawolo
            </p>
          </div>
        </div>
      </>
    );
  }
}

export default AutoBio;
