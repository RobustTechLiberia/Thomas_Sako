import React from "react";

class PlayListContent extends React.Component {
  render() {
    return (
      <>
        {/* heading */}
        <div className="flex flex-col md:flex-row justify-evenly md:mt-10 lg:mt-10 mt-10 items-stretch bg-[#F67D31] h-auto gap-6 px-4 md:px-20">
          {/* pod 1 */}
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              className="w-full aspect-video"
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
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              className="w-full aspect-video"
              src="https://www.youtube.com/embed/pW3S1U1XGH0?si=c1cq3a-eQl-xd3-u"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl py-5">
              The Stories That Inspire: <br /> Enid-Mai Jones King on her <br />
              courageous life journey & <br /> empowering women
            </h3>
          </div>

          {/* pod 3 */}
          {/* <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              className="w-full aspect-video"
              src="https://www.youtube.com/embed/_fGnJJ6BZbg?si=vPNIB5pypOLaYgF0"
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl md:py-5 lg:py-5">
              Discover the story behind J. Mawolo’s decision to join the Liberty
              Show.
            </h3>
          </div> */}
        </div>{" "}
      </>
    );
  }
}

export default PlayListContent;
