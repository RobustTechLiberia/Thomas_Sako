import React from "react";
import MingleHero from "../../../images/The-Mingle-Project.png";

class MingleContent extends React.Component {
  render() {
    return (
      <>
        {/* hero */}
        <div className="flex flex-col items-center justify-center gap-4 bg-white px-4 py-10 md:py-16">
          <div className="w-full max-w-80">
            <img src={MingleHero} alt="The Mingle Project" className="w-full" />
          </div>
          <p className="max-w-2xl text-center font-serif text-lg text-gray-700">
            Conversations, community, and the stories behind today's writers,
            thinkers, and newsmakers.
          </p>
        </div>

        {/* Meet Ups */}
        <div className="bg-violet-100 px-4 py-10 md:px-20 md:py-16">
          <h2 className="font-sans text-3xl font-bold uppercase text-violet-950 md:text-5xl">
            Meet Ups
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Community Roundtable
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Join local readers for open and balanced conversation on the
                issues affecting our communities.
              </p>
            </div>
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Town Hall Dialogues
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Live events built around giving every voice a seat at the
                table, no matter the politics.
              </p>
            </div>
            <div className="border-b-8 border-b-violet-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Member Gatherings
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                A space for the exhausted majority to connect, share ideas, and
                build lasting conversations.
              </p>
            </div>
          </div>
        </div>

        {/* Watch */}
        <div className="bg-white px-4 py-10 md:px-20 md:py-16">
          <h2 className="font-sans text-3xl font-bold uppercase text-violet-950 md:text-5xl">
            Watch
          </h2>
          <div className="mt-6 flex flex-col items-stretch justify-evenly gap-6 md:flex-row">
            <div className="w-full bg-white md:flex-1">
              <iframe
                className="w-full aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/v031MdJSWqY?si=Bjn2F_cvufBeiIA-"
                title="Mingle video player 1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <h3 className="py-4 font-sans text-xl font-semibold text-violet-950 md:text-2xl">
                A Message to the President of the Republic of Liberia
              </h3>
            </div>
            <div className="w-full bg-white md:flex-1">
              <iframe
                className="w-full aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/_fGnJJ6BZbg?si=-6K7UTVDo111faQV"
                title="Mingle video player 2"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <h3 className="py-4 font-sans text-xl font-semibold text-violet-950 md:text-2xl">
                Discover the Story Behind the Liberty Show
              </h3>
            </div>
            <div className="w-full bg-white md:flex-1">
              <iframe
                className="w-full aspect-video rounded-none shadow-none"
                width="560"
                height="315"
                src="https://www.youtube.com/embed/W-o_9744KQg?si=gCswT5_unyKzu3hb"
                title="Mingle video player 3"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerpolicy="strict-origin-when-cross-origin"
                allowfullscreen
              ></iframe>
              <h3 className="py-4 font-sans text-xl font-semibold text-violet-950 md:text-2xl">
                Tackling Liberia's Challenges
              </h3>
            </div>
          </div>
        </div>

        {/* Author & Writer Interviews */}
        <div className="bg-violet-100 px-4 py-10 md:px-20 md:py-16">
          <h2 className="font-sans text-3xl font-bold uppercase text-violet-950 md:text-5xl">
            Author &amp; Writer Interviews
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            <div className="border-b-8 border-b-slate-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                In Conversation
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Long-form interviews with authors on the ideas behind their
                books and the times we live in.
              </p>
            </div>
            <div className="border-b-8 border-b-slate-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Emerging Voices
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Spotlighting new writers who bring fresh, balanced perspective
                to national conversations.
              </p>
            </div>
            <div className="border-b-8 border-b-slate-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <h3 className="font-sans text-xl font-semibold capitalize text-violet-950">
                Behind the Words
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Writers on research, craft, and the stories that never made the
                page.
              </p>
            </div>
          </div>
        </div>

        {/* Mingle News */}
        <div className="bg-white px-4 py-10 md:px-20 md:py-16">
          <h2 className="font-sans text-3xl font-bold uppercase text-violet-950 md:text-5xl">
            Mingle News
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-10">
            <div className="border-b-8 border-b-green-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <p className="font-serif text-sm capitalize text-gray-500">
                September 2026
              </p>
              <h3 className="mt-2 font-sans text-xl font-semibold capitalize text-violet-950">
                A New Season of Conversations
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                The Mingle Project returns with a fresh lineup of guests and
                community meet ups across the region.
              </p>
            </div>
            <div className="border-b-8 border-b-green-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <p className="font-serif text-sm capitalize text-gray-500">
                August 2026
              </p>
              <h3 className="mt-2 font-sans text-xl font-semibold capitalize text-violet-950">
                Meet Up Recap
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                Highlights from this summer's town hall dialogues and the
                conversations they sparked.
              </p>
            </div>
            <div className="border-b-8 border-b-green-300 bg-white px-6 py-6 shadow-2xs md:shadow-xl">
              <p className="font-serif text-sm capitalize text-gray-500">
                July 2026
              </p>
              <h3 className="mt-2 font-sans text-xl font-semibold capitalize text-violet-950">
                Listen to the Interviews
              </h3>
              <p className="mt-3 font-serif text-lg text-gray-700">
                A growing library of author interviews now available on the
                show's YouTube channel.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default MingleContent;