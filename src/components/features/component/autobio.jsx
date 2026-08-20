import React from "react";
import image from "../../../images/617521616_1984950405787294_11200720191272892_n.jpg";

class AutoBio extends React.Component {
  render() {
    return (
      <>
        {/* <h1 className="text-center font-sans text-5xl md:mt-10 lg:mt-20 py-10 font-semibold capitalize">
          Testimonials
        </h1> */}
        <div className="flex flex-col md:flex-row items-center justify-center md:justify-between bg-white px-6 md:px-12 lg:px-20 py-32">
          {/* Left column: image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img
              src={image}
              alt="Speaker at event"
              className="w-md h-128 md:w-120 md:h-136 lg:w-lg lg:h-144 object-cover rounded-none shadow-none"
            />
          </div>

          {/* Right column: quote */}
          <div className="w-full md:w-1/2 md:pl-12 mt-8 md:mt-0 flex flex-col justify-center">
            <div className="text-purple-950 text-8xl font-bold md:mb-4 lg:mb-4 mb-3">
              “
            </div>
            <p className="text-gray-800 md:text-lg text-lg  font-sans leading-relaxed  lg:text-lg">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Veritatis
              repellendus, fuga blanditiis, delectus illum quisquam reiciendis
              eos sapiente laboriosam tempore porro nemo ab amet voluptatibus!
              Culpa natus similique voluptate dolorum. Eaque, ipsa delectus
              temporibus veritatis eum necessitatibus porro pariatur commodi
              eius? Maxime dolor perferendis deleniti inventore, voluptatibus
              esse amet vitae necessitatibus obcaecati dolorem earum explicabo
              tempore nam, praesentium maiores ad.
            </p>
            <p className="mt-6 font-semibold md:text-lg lg:text-lg text-lg text-gray-700">
              Philomena R. Koffa <br />
              Media Coordinator - Orange Liberia{" "}
            </p>
          </div>
        </div>
      </>
    );
  }
}

export default AutoBio;
