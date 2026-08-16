import React from "react";
import Header from "../components/header";
import VotePoll from "../components/vote_poll/vote_poll";
import Section from "../components/section";
import Features from "../components/features/component/default";
import Footer from "../components/footer";
// import Subscribe from "../components/subscribe/subscribe";

class HomePage extends React.Component {
  render() {
    return (
      <>
        <Header />
        <VotePoll />
        <Section />
        {/* <Subscribe /> */}
        <Features />
        <Footer />
      </>
    );
  }
}

export default HomePage;
