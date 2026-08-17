/* eslint-disable no-unused-vars */
import React from "react";

class Quest1 extends React.Component {
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
    fetch("/questions.json")
      .then((res) => res.json())
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
        <div className="flex flex-wrap md:justify-between lg:justify-between justify-center items-center">
          <div className="md:h-140 lg:h-140 bg-white md:mx-10 lg:mx-10 md:w-4xl lg:w-4xl w-auto h-110 md:shadow-xl lg:shadow-xl shadow-none">
            <h1 className="md:text-5xl lg:text-5xl text-4xl pt-10 text-center md:pt-8 lg:pt-10 font-sans font-semibold uppercase text-violet-950">
              today's poll
            </h1>
            <div className="flex flex-wrap justify-center items-center my-8">
              <hr className="border-none bg-violet-900 md:w-80 lg:w-80 w-75 md:h-1 lg:h-1 h-2" />
            </div>

            <h3 className="text-center flex flex-wrap md:justify-center lg:justify-start md:items-start lg:items-center font-sans font-semibold text-3xl md:mx-20 lg:mx-20 mx-2">
              {currentQuestion.question}
            </h3>

            <form className="w-auto" onSubmit={this.handleSubmit}>
              {currentQuestion.options.map((opt, idx) => (
                <div key={idx} className="md:my-3 lg:my-3">
                  <label
                    className={`md:mx-20 lg:mx-20 mx-4 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans flex items-center gap-2 ${hasVoted ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
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
              <div className="md:mt-10 lg:mt-10 mt-10 flex flex-col md:mx-20 lg:mx-20 mx-4 gap-2">
                <input
                  type="submit"
                  value={hasVoted ? "voted" : "vote"}
                  disabled={hasVoted}
                  className={`md:py-3 lg:py-3 py-3 text-white md:w-28 lg:w-28 w-28 text-xl font-semibold ${hasVoted ? "bg-gray-400 cursor-not-allowed uppercase" : "bg-violet-900 cursor-pointer"}`}
                />
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default Quest1;
