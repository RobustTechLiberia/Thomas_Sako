import React from "react";

class TrendPod extends React.Component {
  render() {
    return (
      <>
        <h1 className="text-center md:text-left lg:text-left md:mx-20 lg:mx-20 font-sans font-semibold md:text-5xl lg:text-5xl text-4xl md:my-10 lg:my-10 py-8 capitalize">
          trending stories
        </h1>

        <div className="flex flex-col md:flex-row justify-evenly md:mt-10 lg:mt-10 mt-8 items-stretch bg-white h-auto gap-6 px-4 md:px-20">
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
              Why don't heritage travelers with ties to Liberia, such as notable
              Black Americans, visit Liberia?
            </h3>
          </div>
        </div>
      </>
    );
  }
}

export default TrendPod;
