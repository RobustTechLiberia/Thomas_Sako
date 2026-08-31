/* eslint-disable no-unused-vars */
import React from "react";
import Advert from "../../features/component/Advertisement/components/advert";
import { getCmsCollection } from "../../../lib/cms";

class Quest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      questions: [],
      currentQuestion: { question: "", options: [] },
      selectedOption: "",
      statusMessage: "",
      hasVoted: false,
    };
  }

  componentDidMount() {
    getCmsCollection(
      "polls",
      "?filters[active][$eq]=true&sort=startsAt:desc&pagination[pageSize]=1",
    )
      .then((response) => {
        if (!response.data?.length) throw new Error("No active CMS poll.");
        const poll = response.data[0];
        return [{ question: poll.question, options: poll.options }];
      })
      // Keep the current site usable until an editor creates and publishes its
      // first poll or public API read access is enabled in Strapi.
      .catch(() => fetch("/questions.json").then((res) => res.json()))
      .then((data) => {
        const today = new Date();
        const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const questionIndex = dayIndex % data.length;
        const activeQuestion = data[questionIndex];

        const voteTimestamp = localStorage.getItem(
          `vote_time_${activeQuestion.question}`,
        );
        let alreadyVoted = false;

        if (voteTimestamp) {
          const timePassed = Date.now() - parseInt(voteTimestamp, 10);
          if (timePassed < 24 * 60 * 60 * 1000) {
            alreadyVoted = true;
          } else {
            localStorage.removeItem(`vote_time_${activeQuestion.question}`);
          }
        }

        this.setState({
          questions: data,
          currentQuestion: activeQuestion,
          hasVoted: alreadyVoted,
        });
      })
      .catch((err) => console.error("Error loading questions:", err));
  }

  handleOptionChange = (e) => {
    if (this.state.hasVoted) return;
    this.setState({ selectedOption: e.target.value, statusMessage: "" });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { currentQuestion, selectedOption, hasVoted } = this.state;

    if (!selectedOption || hasVoted) {
      return;
    }

    const payload = {
      question: currentQuestion.question,
      answer: selectedOption,
    };

    fetch("/db", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Server error logging vote.");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem(
          `vote_time_${currentQuestion.question}`,
          Date.now().toString(),
        );
        this.setState({
          hasVoted: true,
        });
      })
      .catch((err) => {
        console.error("Submission failed:", err);
      });
  };

  render() {
    const { currentQuestion, selectedOption, hasVoted } = this.state;

    return (
      <>
        <div className="flex w-full flex-wrap items-center justify-center gap-8 px-4 md:justify-between md:px-10">
          <div className="w-full max-w-4xl bg-white px-4 py-8 shadow-none sm:px-8 md:min-h-140 md:px-10 md:shadow-xl">
            <h1 className="md:text-5xl lg:text-5xl text-4xl pt-10 text-center md:pt-8 lg:pt-10 font-sans font-semibold uppercase text-violet-950">
              today's poll
            </h1>
            <div className="flex flex-wrap justify-center items-center my-8">
              <hr className="h-1 w-3/4 max-w-80 border-none bg-violet-900" />
            </div>

            <h3 className="mx-2 text-center font-sans text-2xl font-semibold sm:text-3xl md:mx-0 md:text-left">
              {currentQuestion.question}
            </h3>

            <form className="w-full" onSubmit={this.handleSubmit}>
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} className="md:my-3 lg:my-3">
                  <label
                    className={`mx-0 flex items-center gap-2 font-sans text-lg font-semibold capitalize sm:text-xl md:text-2xl ${hasVoted ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={opt}
                      checked={selectedOption === opt}
                      onChange={this.handleOptionChange}
                      disabled={hasVoted}
                    />{" "}
                    {opt}
                  </label>
                </div>
              ))}
              <div className="mt-10 flex flex-col gap-2">
                <input
                  type="submit"
                  value={hasVoted ? "voted" : "vote"}
                  disabled={hasVoted}
                  className={`md:py-3 lg:py-3 py-3 text-white md:w-28 lg:w-28 w-28 text-xl font-semibold ${hasVoted ? "bg-violet-900 cursor-not-allowed uppercase" : "bg-violet-900 cursor-pointer"}`}
                />
              </div>
            </form>
          </div>
          <Advert />
        </div>
      </>
    );
  }
}

export default Quest;
