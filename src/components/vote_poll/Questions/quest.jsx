/* eslint-disable no-unused-vars */
import React from "react";
import Advert from "../../features/component/Advertisement/components/advert";

class Quest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentQuestion: { question: "", options: [] },
      selectedOption: "",
      hasVoted: false,
    };
  }

  componentDidMount() {
    fetch("/questions.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load questions JSON.");
        return res.json();
      })
      .then((data) => {
        if (!data || !data.length) return;

        const today = new Date();
        const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const questionIndex = dayIndex % data.length;
        const activeQuestion = data[questionIndex];

        if (!activeQuestion) return;

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
          currentQuestion: {
            question: activeQuestion.question || "",
            options: Array.isArray(activeQuestion.options)
              ? activeQuestion.options
              : [],
          },
          hasVoted: alreadyVoted,
        });
      })
      .catch((err) => console.error("Error loading questions:", err));
  }

  handleOptionChange = (e) => {
    if (this.state.hasVoted) return;
    this.setState({ selectedOption: e.target.value });
  };

  handleSubmit = (e) => {
    e.preventDefault();
    const { currentQuestion, selectedOption, hasVoted } = this.state;

    if (!selectedOption || hasVoted) return;

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
      .then(() => {
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
    const options = currentQuestion?.options || [];

    return (
      <div className="flex w-full flex-wrap items-center justify-center gap-8 px-4 md:justify-between md:px-10">
        <div className="w-auto max-w-4xl bg-white px-4 py-8 shadow-none sm:px-8 md:min-h-140 md:px-10 md:shadow-xl">
          <h1 className="pt-10 text-center font-sans text-4xl font-semibold uppercase text-violet-950 md:pt-8 md:text-5xl lg:pt-10 lg:text-5xl">
            today's poll
          </h1>
          <div className="my-8 flex flex-wrap items-center justify-center">
            <hr className="h-1 w-3/4 max-w-80 border-none bg-violet-900" />
          </div>

          <h3 className="mx-2 text-center font-sans text-2xl font-semibold sm:text-3xl md:mx-0 md:text-left">
            {currentQuestion.question}
          </h3>

          <form className="w-full" onSubmit={this.handleSubmit}>
            {options.map((opt, idx) => (
              <div key={`${opt}-${idx}`} className="md:my-3 lg:my-3">
                <label
                  className={`mx-0 flex items-center gap-2 font-sans text-lg font-semibold capitalize sm:text-xl md:text-2xl ${
                    hasVoted
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
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
                className={`w-28 py-3 text-xl font-semibold text-white md:w-28 lg:w-28 ${
                  hasVoted
                    ? "cursor-not-allowed bg-violet-900 uppercase"
                    : "cursor-pointer bg-violet-900"
                }`}
              />
            </div>
          </form>
        </div>
        <Advert />
      </div>
    );
  }
}

export default Quest;
