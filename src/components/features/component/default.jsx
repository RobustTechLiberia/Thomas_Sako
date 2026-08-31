import React from "react";
import { Link } from "react-router-dom"; // import Link for routing
import youtube from "../../../images/Copilot_20260816_123052.png";
import podcast from "../../../images/Copilot_20260816_123356.png";
import playlist from "../../../images/Copilot_20260816_122807.png";
import AboutMe from "../../../images/Copilot_20260816_123803.png";
import Contact from "../../../images/Contact-2.png";
import BookMe from "../../../images/Copilot_20260816_124134.png";

class Features extends React.Component {
  render() {
    return (
      <>
        {/* container */}
        <div className="flex flex-wrap items-center justify-center gap-5 bg-white px-4 py-10 md:min-h-96">
          {/* youtube */}
          <div className="w-full max-w-80 bg-white">
            <a
              href="https://www.youtube.com/@1847Liberty"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={youtube}
                alt="YouTube"
                className="w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </a>
            <p className="font-serif capitalize text-center text-xl">YouTube</p>
          </div>

          {/* podcast */}
          <div className="w-full max-w-80 bg-white">
            <Link to="/podcast">
              <img
                src={podcast}
                alt="Podcast"
                className="w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">Podcast</p>
          </div>

          {/* playlist */}
          <div className="w-full max-w-80 bg-white">
            <Link to="/playlist">
              <img
                src={playlist}
                alt="Playlist"
                className="w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">
              Play List
            </p>
          </div>
        </div>

        {/* booking */}
        {/* Added mb-20 to create margin below this final container */}
        <div className="flex flex-wrap items-center justify-center gap-5 bg-white px-4 py-10 md:my-10 md:min-h-96">
          {/* about me */}
          <div className="w-full max-w-80 bg-white">
            <Link to="/about">
              <img
                src={AboutMe}
                alt="About Me"
                className="w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">
              About Me
            </p>
          </div>

          {/* contact */}
          <div className="w-full max-w-80 bg-white">
            <Link to="/contact">
              <img
                src={Contact}
                alt="Contact"
                className="w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">Contact</p>
          </div>

          {/* book thomas */}
          <div className="w-full max-w-80 bg-white">
            <Link to="/book">
              <img
                src={BookMe}
                alt="Book Thomas"
                className="aspect-square w-full object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">
              Book Thomas
            </p>
          </div>
        </div>
      </>
    );
  }
}

export default Features;
