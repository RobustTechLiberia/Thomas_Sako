import React from "react";
import Nav from "../../../features/component/nav";
import ResultsNav from "./nav";

class Results extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <ResultsNav/>
      </>
    );
  }
}

export default Results;
