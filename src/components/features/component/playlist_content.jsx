import React from "react";

class PlayListContent extends React.Component {
  render() {
    return (
      <>
        {/* heading */}
        <div className=" bg-violet-200 md:h-full lg:h-full h-auto border-b-none border-b-gray-200">
          <div className="h-auto md:h-10 lg:h-10">
            {/* <h1 className="text-center font-sans font-bold capitalize md:mx-0 lg:mx-0 mx-2 text-5xl md:mt-0 lg:pt-20 pt-10 md:text-4xl lg:text-4xl">
              the 1847 liberty show
            </h1> */}
          </div>

          <div className="flex flex-col md:flex-row justify-evenly md:pt-0 lg:pt-0 mx-0 md:mx-5 lg:mx-5 mt-32 pt-0 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
            {/* pod 1 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                className="w-full aspect-video rounded-none shadow-none"
                src="https://www.youtube.com/embed/JlEipMTo-jQ?si=Ro7LE8lykFgAWNWS"
                title="YouTube video player 1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Liberia: Uniting Against Deep-Rooted Corruption and Government
                Dysfunction
              </h3>
            </div>

            {/* pod 2 */}
            <div className="w-full md:flex-1 bg-white">
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
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Rethinking Progress: Why Liberia’s Future Depends on
                People-Centered Priorities
              </h3>
            </div>

            {/* pod 3 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                className="w-full h-58 aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/UduTppjIzqY?si=neU0HXWtqAqGw4Bk"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Why don't heritage travelers with ties to Liberia, such as
                notable Black Americans, visit Liberia?
              </h3>
            </div>
          </div>

          {/* watch previous podcast */}
          <div className="flex flex-col md:flex-row justify-evenly md:pt-20 lg:pt-20 mx-0 mt-28 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
            {/* pod 1 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                className="w-full aspect-video rounded-none shadow-none"
                src="https://www.youtube.com/embed/JlEipMTo-jQ?si=Ro7LE8lykFgAWNWS"
                title="YouTube video player 1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Liberia: Uniting Against Deep-Rooted Corruption and Government
                Dysfunction
              </h3>
            </div>

            {/* pod 2 */}
            <div className="w-full md:flex-1 bg-white">
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
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Rethinking Progress: Why Liberia’s Future Depends on
                People-Centered Priorities
              </h3>
            </div>

            {/* pod 3 */}
            <div className="w-full md:flex-1 bg-white">
              <iframe
                className="w-full h-58 aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/UduTppjIzqY?si=neU0HXWtqAqGw4Bk"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <br />
              <h3 className="text-left font-sans font-semibold text-2xl py-5">
                Why don't heritage travelers with ties to Liberia, such as
                notable Black Americans, visit Liberia?
              </h3>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default PlayListContent;
