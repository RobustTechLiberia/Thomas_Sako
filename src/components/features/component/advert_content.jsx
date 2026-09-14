import React from "react";
import advert from "../../../images/Advertising-2.png";

class AdvertContent extends React.Component {
  render() {
    return (
      <>
        {/* hero */}
        <div className="bg-white px-4 py-10 md:px-20 md:py-16">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 md:flex-row md:items-center md:justify-between">
            <div className="w-full text-center md:w-1/2 md:text-left">
              <h1 className="font-sans text-3xl font-bold uppercase text-violet-950 sm:text-4xl md:text-5xl">
                Advertise with the 1847 Liberty Show
              </h1>
              <p className="mt-4 max-w-xl font-serif text-lg text-gray-700">
                Reach a growing community of engaged, independent-minded
                readers through the daily newsletter, podcast, and video
                platforms of the Liberty Show.
              </p>
              <a
                href="mailto:editor@thomas.com?subject=Advertise%20with%20the%20Thomas.com%20Daily%20Newsletter!"
                className="mt-6 inline-block bg-violet-900 px-10 py-3 font-sans text-lg font-semibold capitalize text-white transition-colors duration-1000 hover:bg-violet-700"
              >
                get started
              </a>
            </div>
            <div className="w-full max-w-80 md:w-1/3">
              <img
                src={advert}
                alt="Advertising"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* options */}
        <div className="bg-violet-100 px-4 py-10 md:px-20 md:py-16">
          <h2 className="text-center font-sans text-3xl font-bold uppercase text-violet-950 md:text-5xl">
            Sponsorship Opportunities
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Daily Newsletter
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Get your brand in front of subscribers every morning with a
                sponsored slot in the daily newsletter.
              </p>
            </div>
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Poll Sponsorship
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Sponsor today's daily poll and be seen by every reader who
                votes on the issues that matter.
              </p>
            </div>
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Podcast &amp; Video
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Reach listeners and viewers across the podcast and YouTube
                channels of the 1847 Liberty Show.
              </p>
            </div>
          </div>
        </div>

        {/* contact */}
        <div className="flex flex-col items-center justify-center bg-white px-4 py-10 md:py-16">
          <h2 className="text-center font-sans text-2xl font-semibold text-violet-950 sm:text-3xl md:text-4xl">
            Interested in reaching our audience?
          </h2>
          <a
            href="mailto:editor@thomas.com?subject=Advertising%20Inquiry"
            className="mt-6 bg-green-700 px-10 py-3 font-sans text-lg font-semibold capitalize text-white transition-colors duration-1000 hover:bg-green-600"
          >
            send us an email
          </a>
        </div>
      </>
    );
  }
}

export default AdvertContent;