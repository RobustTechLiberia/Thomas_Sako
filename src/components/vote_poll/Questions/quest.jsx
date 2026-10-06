/* eslint-disable no-unused-vars */
import React from "react";
import { Navigate } from "react-router-dom";
import Advert from "../../features/component/Advertisement/components/advert";
import { apiUrl, getApiError } from "../../../lib/api";
// Sass CSS
import "../../../../App.scss";

class Quest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      questions: [],
      currentQuestion: { id: null, question: "", options: [] },
      selectedOption: "",
      hasVoted: false,
      isLoading: true,
      isSubmitting: false,
      shouldRedirectToResults: false,
    };
  }

  componentDidMount() {
    fetch(`${import.meta.env.BASE_URL}questions.json`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load questions resource.");
        }
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No poll questions are available.");
        }

        const today = new Date();
        const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
        const questionIndex = dayIndex % data.length;
        const activeQuestion = data[questionIndex] || { question: "", options: [] };

        const voteTimestamp = localStorage.getItem(`vote_time_${activeQuestion.id}`);
        let alreadyVoted = false;

        if (voteTimestamp) {
          const timePassed = Date.now() - parseInt(voteTimestamp, 10);
          // A voter may submit this question only once during its 24-hour window.
          if (timePassed < 24 * 60 * 60 * 1000) {
            alreadyVoted = true;
          } else {
            localStorage.removeItem(`vote_time_${activeQuestion.id}`);
          }
        }

        this.setState({
          questions: data,
          currentQuestion: activeQuestion,
          hasVoted: alreadyVoted,
          isLoading: false,
        });
      })
      .catch((err) => {
        console.error("Error loading questions:", err);
        this.setState({
          isLoading: false,
        });
      });
  }

  handleOptionChange = (e) => {
    if (this.state.hasVoted || this.state.isSubmitting) return;
    this.setState({ selectedOption: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { currentQuestion, selectedOption, hasVoted, isSubmitting } = this.state;

    if (!selectedOption || hasVoted || isSubmitting) {
      return;
    }

    // Lock interface immediately when clicked to prevent double clicks or race condition bugs
    this.setState({ 
      isSubmitting: true, 
    });

    const payload = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: selectedOption,
    };

    try {
      const response = await fetch(apiUrl("/question/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          await getApiError(
            response,
            "We could not record your vote. Please try again."
          )
        );
      }

      localStorage.setItem(
        `vote_time_${currentQuestion.id}`,
        Date.now().toString()
      );
      this.setState({
        hasVoted: true,
        isSubmitting: false,
        shouldRedirectToResults: true,
      });
    } catch (err) {
      console.error("Submission failed:", err);
      this.setState({
        isSubmitting: false,
      });
    }
  };

  handleSeeResults = (e) => {
    e.preventDefault();
    this.setState({ shouldRedirectToResults: true });
  };

  render() {
    const {
      currentQuestion,
      selectedOption,
      hasVoted,
      isLoading,
      isSubmitting,
      shouldRedirectToResults,
    } = this.state;

    if (shouldRedirectToResults) {
      return <Navigate replace to="/results"/>;
    }

    const options = currentQuestion?.options || [];
    const isInteractionDisabled = isLoading || hasVoted || isSubmitting;

    return (
      <>
        <div className="flex flex-wrap md:justify-between lg:justify-between justify-center items-center md:gap-0 lg:gap-0 gap-10">
          <div
            className="md:h-140 lg:h-140 bg-right bg-white md:mx-10 lg:mx-10 md:w-4xl lg:w-3xl w-80 h-110 md:shadow-xl lg:shadow-xl shadow-none"
            id="quest"
          >
            <h1 className="md:text-5xl lg:text-5xl text-4xl pt-10 text-center md:pt-8 lg:pt-10 font-sans font-semibold uppercase text-[#830000]">
              today's poll
            </h1>
            <div className="flex flex-wrap justify-center items-center my-8">
              <hr className="border-none bg-[#830000] md:w-80 lg:w-80 w-75 md:h-1 lg:h-1 h-2" />
            </div>

            {isLoading ? (
              <div className="text-center font-sans font-semibold text-2xl text-gray-500 mt-10">
                Loading today's question...
              </div>
            ) : !currentQuestion || !currentQuestion.question ? (
              <div className="text-center font-sans font-semibold text-xl text-[#830000] mt-10 px-4">
                No poll available at this moment.
              </div>
            ) : (
              <>
                <h3 className="text-center flex flex-wrap md:justify-center lg:justify-start md:items-start lg:items-center font-sans font-semibold text-3xl md:mx-20 lg:mx-20 mx-2">
                  {currentQuestion.question}
                </h3>

                <form className="w-auto" onSubmit={this.handleSubmit}>
                  {options.map((opt, idx) => (
                    <div key={idx} className="md:my-3 lg:my-3">
                      <label
                        className={`md:mx-20 lg:mx-20 mx-4 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans flex items-center gap-2 ${
                          isInteractionDisabled
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
                          disabled={isInteractionDisabled}
                        />{" "}
                        {opt}
                      </label>
                    </div>
                  ))}
                  <div className="md:mt-10 lg:mt-10 mt-10 flex flex-col md:mx-20 lg:mx-20 mx-4 gap-2">
                    <input
                      type="submit"
                      value={
                        isLoading
                          ? "loading..."
                          : isSubmitting
                          ? "submitting..."
                          : hasVoted
                          ? "voted"
                          : "vote"
                      }
                      disabled={isInteractionDisabled || !selectedOption}
                      className={`md:py-3 lg:py-3 py-3 text-white md:w-28 lg:w-28 w-28 text-xl font-semibold ${
                        isInteractionDisabled || !selectedOption
                          ? "bg-[#830000] cursor-not-allowed opacity-60 uppercase"
                          : "bg-[#830000] cursor-pointer"
                      }`}
                    />
                  </div>
                </form>
              </>
            )}
            {/* <div className="flex flex-wrap justify-start h-auto md:mt-32 lg:mt-32 mt-8 bg-green-200 text-white w-auto">
              <div
                onClick={this.handleSeeResults}
                className="md:w-80 lg:w-80 w-auto bg-blue-900 py-5 cursor-pointer"
              >
                <a href="/results" onClick={this.handleSeeResults}>
                  <p className="font-sans mx-5 capitalize font-semibold md:text-2xl lg:text-2xl text-xs">
                    see past results
                  </p>
                </a>
              </div>
              
              <div className="md:w-80 lg:w-80 w-20 cursor-pointer hover:bg-green-800 py-5"></div>
            </div> */}
          </div>
          <Advert/>
        </div>
      </>
    );
  }
}

export default Quest;