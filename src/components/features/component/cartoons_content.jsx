import React from "react";
import Cartoon1 from "../../../images/Dont-Hire-Lawyer.png";
import Cartoon2 from "../../../images/5-Doctor-Lawyer.webp";
import Cartoon3 from "../../../images/Among-Largest-Verdicts.webp";
import Cartoon4 from "../../../images/That-scam-call-wasnt-random.-3.png";

class CartoonsContent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { active: null };
  }

  render() {
    const cartoons = [
      {
        src: Cartoon1,
        caption: "Don't Hire a Lawyer",
        date: "September 2026",
      },
      {
        src: Cartoon2,
        caption: "The Doctor-Lawyer",
        date: "August 2026",
      },
      {
        src: Cartoon3,
        caption: "Among the Largest Verdicts",
        date: "August 2026",
      },
      {
        src: Cartoon4,
        caption: "That Scam Call Wasn't Random",
        date: "July 2026",
      },
    ];

    const { active } = this.state;

    return (
      <>
        <div className="bg-white md:min-h-96">
          <div className="flex flex-col items-center justify-center px-4 py-10 md:py-16">
            <h1 className="text-center font-sans text-3xl font-bold uppercase text-violet-950 sm:text-4xl md:text-5xl">
              Political Cartoons
            </h1>
            <div className="my-6 flex flex-wrap items-center justify-center">
              <hr className="h-1 w-3/4 max-w-80 border-none bg-violet-900" />
            </div>
            <p className="max-w-2xl text-center font-serif text-lg text-gray-700">
              A gallery of thought-provoking cartoons on politics, justice, and
              the issues shaping our nation.
            </p>
          </div>

          {/* gallery */}
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 bg-violet-100 px-4 py-10 sm:grid-cols-2 md:gap-10 lg:px-20 xl:grid-cols-4">
            {cartoons.map((cartoon, idx) => (
              <div
                key={`${cartoon.caption}-${idx}`}
                className="flex w-full flex-col justify-between bg-white md:shadow-xl shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => this.setState({ active: idx })}
                  className="cursor-pointer bg-transparent p-0 text-left"
                >
                  <img
                    src={cartoon.src}
                    alt={cartoon.caption}
                    className="w-full object-cover hover:opacity-50"
                  />
                </button>
                <div className="border-b-8 border-b-violet-300 px-5 py-4">
                  <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                    {cartoon.caption}
                  </h3>
                  <p className="mt-1 font-serif text-sm capitalize text-gray-600">
                    {cartoon.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* lightbox */}
        {active !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => this.setState({ active: null })}
          >
            <div
              className="relative flex w-full max-w-4xl flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => this.setState({ active: null })}
                className="absolute -top-2 right-0 z-10 cursor-pointer bg-violet-950 px-4 py-2 text-xl font-semibold text-white"
                aria-label="Close"
              >
                &times;
              </button>
              <img
                src={cartoons[active].src}
                alt={cartoons[active].caption}
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
              <p className="mt-4 font-sans text-lg font-semibold capitalize text-white">
                {cartoons[active].caption}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default CartoonsContent;