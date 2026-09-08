import React from "react";

class OurTeamGallery extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:justify-start md:mt-10 lg:mt-10 mt-8 lg:justify-start md:items-start lg:items-start gap-10 md:gap-0 md:mx-10 lg:mx-10 lg:gap-0 h-auto  mb-20">
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Team mate 1"
              srcset=""
              className="h-52 object-cover w-full hover:bg-green-200 cursor-pointer"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-violet-800"></div>
          </div>
          <div className="w-80 bg-gray-50 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Team mate 2"
              srcset=""
              className="h-52 object-cover w-full hover:bg-green-200  hover:bg-blend-overlay cursor-pointer"
            />
            <div className="md:mt-0 mt-0 lg:mt-0 h-28 bg-violet-600"></div>
          </div>
          <div className="w-80 bg-gray-200 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Team mate 3"
              srcset=""
              className="h-52 object-cover w-full  hover:bg-green-200  hover:bg-blend-overlay cursor-pointer"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-violet-800"></div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image4.jpg"
              alt="Team mate 4"
              srcset=""
              className="h-52 object-cover w-full  hover:bg-green-200  hover:bg-blend-overlay cursor-pointer"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-violet-600"></div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image5.jpg"
              alt="Team mate 5"
              srcset=""
              className="h-52 object-cover w-full  hover:bg-green-200  hover:bg-blend-overlay cursor-pointer"
            />
            <div className="md:mt-0 lg:mt-0 mt-0 h-28 bg-violet-800"></div>
          </div>
        </div>
      </>
    );
  }
}

export default OurTeamGallery;
