import React from "react";

class TrendPod extends React.Component {
  render() {
    return (
      <>
        <h1 className="text-center md:text-left lg:text-left md:mx-20 text-[#830000] lg:mx-20 font-sans font-semibold md:text-5xl lg:text-5xl text-4xl md:my-10 lg:my-10 py-8 capitalize">
          podcasts
        </h1>
        {/* see more */}
        {/* <button className="bg-none text-[#830000] underline font-sans text-lg flex flex-wrap justify-start items-start mx-28 cursor-pointer py-3">
          see more
        </button> */}
        <div className="flex flex-col md:flex-row justify-evenly md:mt-10 lg:mt-10 mt-10 items-stretch bg-[#F67D31] h-auto gap-6 px-4 md:px-20">
          {/* pod 1 */}
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              className="w-full aspect-video rounded-none shadow-none"
              src="https://www.youtube.com/embed/JlEipMTo-jQ?si=Ro7LE8lykFgAWNWS"
              title="YouTube video player 1"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl py-5">
              Liberia: Uniting Against Deep-Rooted Corruption and Government
              Dysfunction
            </h3>
          </div>

          {/* pod 2 */}
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              className="w-full h-58 aspect-video rounded-none shadow-none"
              width="560"
              height="315"
              src="https://www.youtube.com/embed/YXfC-F7ZfG4?si=2LVTliNbZ-E51yUh"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl py-5">
              Rethinking Progress: Why Liberia’s Future Depends on
              People-Centered Priorities
            </h3>
          </div>

          {/* pod 3 */}
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              width="380"
              height="200"
              src="https://www.youtube.com/embed/W-o_9744KQg?si=5tld1EDrXQgi_XCR"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl md:py-5 lg:py-5">
              Tackling Liberia's Challenges
            </h3>
          </div>
        </div>
        {/* second podcasts */}
        <h1 className="text-center md:text-left lg:text-left md:mx-20 text-[#830000] lg:mx-20 font-sans font-semibold md:text-5xl lg:text-5xl text-4xl md:my-10 lg:my-10 py-8 capitalize">
          stories that inspire
        </h1>
        <div className="flex flex-col md:flex-row justify-evenly md:mt-10 lg:mt-10 mt-10 items-stretch bg-[#F67D31] h-auto gap-6 px-4 md:px-20">
          {/* pod 1 */}
          <div className="w-full md:flex-1 bg-[#F67D31]">
            <iframe
              width="560"
              height="315"
              src="https://www.youtube.com/embed/Qq_AMq4OxIg?si=9Zy3J_xPBUiiAU2k"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
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
              width="560"
              height="315"
              src="https://www.youtube.com/embed/pW3S1U1XGH0?si=c1cq3a-eQl-xd3-u"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
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
              width="560"
              height="315"
              src="https://www.youtube.com/embed/_fGnJJ6BZbg?si=vPNIB5pypOLaYgF0"
              title="YouTube video player"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerpolicy="strict-origin-when-cross-origin"
              allowfullscreen
            ></iframe>
            <br />
            <h3 className="text-left font-sans font-semibold text-[#830000] text-2xl md:py-5 lg:py-5">
              Discover the story behind J. Mawolo’s decision to join the Liberty
              Show.
            </h3>
          </div> */}
        </div>
      </>
    );
  }
}

export default TrendPod;
