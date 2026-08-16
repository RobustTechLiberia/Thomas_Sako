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
        <div className="flex flex-wrap justify-center items-center mt-10 gap-5 md:h-96 lg:h-96 h-auto bg-white">
          {/* youtube */}
          <div className="md:w-80 lg:w-80 w-auto bg-white">
            <Link to="/youtube">
              <img
                src={youtube}
                alt="YouTube"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">YouTube</p>
          </div>

          {/* podcast */}
          <div className="md:w-80 lg:w-80 bg-white">
            <Link to="/podcast">
              <img
                src={podcast}
                alt="Podcast"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">Podcast</p>
          </div>

          {/* playlist */}
          <div className="md:w-80 lg:w-80 w-auto bg-white">
            <Link to="/podcast">
              <img
                src={playlist}
                alt="Playlist"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">
              Play List
            </p>
          </div>
        </div>

        {/* booking */}
        <div className="flex flex-wrap justify-center items-center mt-20 gap-5 md:h-96 lg:h-96 h-auto bg-white">
          {/* about me */}
          <div className="md:w-80 lg:w-80 w-auto bg-white">
            <Link to="/about">
              <img
                src={AboutMe}
                alt="About Me"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">
              About Me
            </p>
          </div>

          {/* contact */}
          <div className="md:w-80 lg:w-80 bg-white">
            <Link to="/contact">
              <img
                src={Contact}
                alt="Contact"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </Link>
            <p className="font-serif capitalize text-center text-xl">Contact</p>
          </div>

          {/* book thomas */}
          <div className="md:w-80 lg:w-80 w-auto bg-white">
            <Link to="/book">
              <img
                src={BookMe}
                alt="Book Thomas"
                className="w-80 h-80 object-cover hover:opacity-50 cursor-pointer"
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
