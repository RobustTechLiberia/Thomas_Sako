import React from "react";
import image from "../../../images/617521616_1984950405787294_11200720191272892_n.jpg";

class AutoBio extends React.Component {
  render() {
    return (
      <>
        {/* <h1 className="text-center font-sans text-5xl md:mt-10 lg:mt-20 py-10 font-semibold capitalize">
          Testimonials
        </h1> */}
        <div className="flex flex-col items-center justify-center bg-white px-6 py-16 md:flex-row md:justify-between md:px-12 lg:px-20 lg:py-32">
          {/* Left column: image */}
          <div className="w-full md:w-1/2 flex justify-center md:justify-start">
            <img
              src={image}
              alt="Speaker at event"
              className="aspect-[4/5] w-full max-w-md object-cover rounded-lg shadow-none md:max-w-120 lg:max-w-lg"
            />
          </div>

          {/* Right column: quote */}
          <div className="w-full md:w-1/2 md:pl-12 mt-8 md:mt-0 flex flex-col justify-center">
            <div className="mb-3 text-6xl font-bold text-purple-950 md:mb-4 md:text-8xl">
              “
            </div>
            <p className="text-gray-800 md:text-lg text-lg  font-serif lg:text-lg">
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
