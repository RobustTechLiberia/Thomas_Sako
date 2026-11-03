import React from "react";

class Pod extends React.Component {
  render() {
    return (
      <>
        {/* heading */}
        <div className=" bg-[#F67D31] md:h-full lg:h-full h-auto border-b-none border-b-gray-200">
          <div className="h-auto md:h-10 lg:h-10">
            <h1 className="text-left text-[#830000] font-sans font-bold capitalize md:mx-20 lg:mx-20 mx-2 text-5xl md:mt-0 lg:pt-10 pt-10 md:text-4xl lg:text-4xl">
              stories that inspire
            </h1>
          </div>

          <div className="flex flex-col md:flex-row justify-evenly md:pt-5 lg:pt-5 mx-0 md:mx-5 lg:mx-5 mt-20 pt-0 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
            {/* pod 1 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/Qq_AMq4OxIg?si=9Zy3J_xPBUiiAU2k"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl py-5">
                Meet Ahamadu Sirleaf, <br /> Creator of ChipChat: <br /> Smarter
                Group Fundraising
              </h3>
            </div>

            {/* pod 2 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/pW3S1U1XGH0?si=c1cq3a-eQl-xd3-u"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl py-5">
                The Stories That Inspire: <br /> Enid-Mai Jones King on her{" "}
                <br />
                courageous life journey & <br /> empowering women
              </h3>
            </div>
          </div>

          {/* watch previous podcast */}
          <div className="flex flex-col md:flex-row justify-evenly md:pt-20 lg:pt-20 mx-0 mt-28 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
            {/* pod 1 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/_fGnJJ6BZbg?si=7bnjFy-PnP8QwezI"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <br />
              <h3 className="text-left text-[#830000] font-sans font-semibold text-2xl py-5">
                Discover the story behind J. Mawolo’s decision to join the
                Liberty Show.
              </h3>
            </div>

            {/* pod 2 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                width="560"
                height="315"
                src="https://www.youtube.com/embed/g5CA6wk4i6A?si=RN-Zaz-ySPZaHjJ0"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <br />
              <h3 className="text-left text-[#830000] font-sans font-semibold text-2xl py-5">
                1847 Liberty @ 1: Feedback from a Super Fan of the Show
              </h3>
            </div>

            {/* pod 3 */}
            {/* <div className="w-full md:flex-1 bg-white">
              <iframe
                className="w-full h-58 aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/UduTppjIzqY?si=neU0HXWtqAqGw4Bk"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              <br />
              <h3 className="text-left text-[#830000] font-sans font-semibold text-2xl py-5">
                Why don't heritage travelers with ties to Liberia, such as
                notable Black Americans, visit Liberia?
              </h3>
            </div> */}
          </div>
        </div>
      </>
    );
  }
}

export default Pod;
