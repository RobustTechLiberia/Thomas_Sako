import React from "react";
import { Link } from "react-router-dom";
import TrendPod from "./trending_pod";

class BookMeContent extends React.Component {
  render() {
    return (
      <>
        {/* Container stripped of restricting margins to span edge-to-edge */}
        <div className="w-full md:h-150 lg:h-150 md:px-20 md:mt-10 lg:mt-10 lg:px-20 px-2 mt-2 h-auto bg-white overflow-hidden relative shadow-none">
          <iframe
            className="w-full aspect-video border-none" // Makes it act like a responsive fluid image
            src="https://www.youtube.com/embed/G9cl0kgd8Q4?si=PKpP5gIdk8t9iS5j"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
        {/* tabs */}
        <div className="flex flex-wrap justify-end items-end md:mx-20 text-violet-900 text-md py-8 lg:mx-20 ">


<div class="font-medium text-center  border-b-none border-default">
    <ul className="flex flex-wrap -mb-px font-arimo">
  <li className="me-2">
    <Link 
      to="/about" 
      className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand"
    >
      About
    </Link>
  </li>

  <li className="me-2">
    <Link 
      to="/playlist" 
      className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand"
    >
      Playlist
    </Link>
  </li>
  
  <li>
    <Link 
      to="/podcast" 
      className="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand"
    >
      Podcasts
    </Link>
  </li>
</ul>

</div>

          </div>
        <TrendPod />
      </>
    );
  }
}

export default BookMeContent;
