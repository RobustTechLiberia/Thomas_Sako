import React from "react";
import Subscribe from "./subscribe/subscribe";
import Reveal from "./reveal.jsx";

class Section extends React.Component {
  render() {
    return (
      <>
        <div className="md:h-auto lg:h-auto md:mt-20 lg:mt-20 mt-0 bg-white">
          <Reveal>
            <Subscribe />
          </Reveal>
        </div>
      </>
    );
  }
}

export default Section;