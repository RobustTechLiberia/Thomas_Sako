import React from "react";
import img4 from "../../../images/WhatsApp Image 2026-09-28 at 2.19.54 PM.jpeg";

class Poem extends React.Component {
  render() {
    return (
      <>
        {/* Changed md:justify-evenly to md:justify-center and added md:gap-8 */}
        <div className="flex flex-wrap justify-center items-center md:h-auto h-auto gap-5 md:gap-8 bg-[#830000] text-white">
          <div className="md:w-96 w-auto h-auto md:h-120 bg-[#830000]">
            <img
              src={img4}
              alt="Poem feature"
              className="md:w-full object-cover md:h-120 h-auto"
            />
          </div>
          <div className="w-96 mx-5 mb-5">
            <div className="flex flex-wrap justify-start items-start">
              <p className="font-sans text-left md:mt-10">
                <b>Hush, Listen, Read!</b>
                <br />
                <br />
                Not because you don’t have the inclination To fathom my accent
                means that I’m dumb This is some prove of your tunnel vision
                Stop talking, ‘cause when you speak, I hear a thump The full
                meaning of things will come only if you listen Listening not
                according to the rhythm, but listening with prudence An open
                mind takes time to think and reason <br /> <br /> But empty
                heads can cause more turbulence Only tough tutors can mold the
                minds of mere twitters With extreme reprisals only can they be
                calm Jeers and nodding heads make a fine tongue stutter Could
                you please stop the chirping and let me pronounce My attempt to
                help you express yourselves As I refer you to the most powerful
                tools on the shelves?
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default Poem;
