import React from "react";
import { Link } from "react-router-dom"; // import Link for routing
import youtube from "../../../images/Gemini_Generated_Image_1k81yo1k81yo1k81.jpeg";
import podcast from "../../../images/Gemini_Generated_Image_r1su2or1su2or1su.jpeg";
import playlist from "../../../images/Gemini_Generated_Image_ghwxdtghwxdtghwx.jpeg";
import AboutMe from "../../../images/Gemini_Generated_Image_bu4r9ubu4r9ubu4r.jpeg";
import Contact from "../../../images/Gemini_Generated_Image_dor3swdor3swdor3.jpeg";
import BookMe from "../../../images/Gemini_Generated_Image_vzxbvsvzxbvsvzxb.jpeg";

class Features extends React.Component {
  render() {
    return (
      <>
        {/* container */}
        <div className="flex flex-wrap justify-center items-center mt-10 gap-5 md:min-h-96 lg:min-h-96 h-auto bg-white">
          {/* youtube */}
          <div className="md:w-80 lg:w-80 w-auto bg-white">
            <a
              href="https://youtu.be/G9cl0kgd8Q4?si=Dcpxf4HiSsyfqsiW"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={youtube}
                alt="YouTube"
                className="w-80 object-cover hover:opacity-50 cursor-pointer"
              />
            </a>
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
            <Link to="/playlist">
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
        {/* Added mb-20 to create margin below this final container */}
        <div className="flex flex-wrap justify-center items-center mt-20 mb-20 gap-5 md:min-h-96 lg:min-h-96 h-auto bg-white">
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
