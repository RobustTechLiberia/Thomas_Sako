import React from "react";
import Nav from "../component/nav";
import Pod from "../component/podcast";
import PodCastNav from "../component/podcast_nav";

class PodcastPage extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <PodCastNav />
        <Pod />
      </>
    );
  }
}

export default PodcastPage;
