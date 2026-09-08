import React from "react";

class GuestGallery extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:justify-start md:mt-10 lg:mt-10 mt-8 lg:justify-start md:items-start lg:items-start gap-10 md:gap-0 md:mx-10 lg:mx-10 lg:gap-0  md:h-auto lg:h-auto h-auto mb-20 md:mb-0 lg:mb-0">
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Guest 1"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-violet-800"></div>
          </div>
          <div className="w-80 bg-gray-50 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Guest 2"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 mt-20 lg:mt-20 h-28 bg-violet-600"></div>
          </div>
          <div className="w-80 bg-gray-200 h-80">
            <img
              src="path/to/image1.jpg"
              alt="Guest 3"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-violet-800"></div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image4.jpg"
              alt="Guest 4"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-violet-600"></div>
          </div>
          <div className="w-80 bg-gray-100 h-80">
            <img
              src="path/to/image5.jpg"
              alt="Guest 5"
              srcset=""
              className="h-32 object-cover w-full"
            />
            <div className="md:mt-20 lg:mt-20 mt-20 h-28 bg-violet-800"></div>
          </div>
        </div>
      </>
    );
  }
}

export default GuestGallery;
