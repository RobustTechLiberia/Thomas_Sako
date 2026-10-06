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
      currentQuestion: {
        id: null,
        question: "",
        options: [],
      },
      selectedOption: "",
      hasVoted: false,
      isLoading: true,
      isSubmitting: false,
      shouldRedirectToResults: false,

      // Store API/form errors so the user can see what happened.
      errorMessage: "",
      successMessage: "",
    };
  }

  componentDidMount() {
    this.loadQuestions();
  }

  loadQuestions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}questions.json`,
        {
          method: "GET",
          cache: "no-cache",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load questions resource. HTTP ${response.status}`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No poll questions are available.");
      }

      const today = new Date();

      const dayIndex = Math.floor(
        today.getTime() / (1000 * 60 * 60 * 24),
      );

      const questionIndex = dayIndex % data.length;

      const activeQuestion = data[questionIndex];

      if (!activeQuestion) {
        throw new Error("Unable to determine today's question.");
      }

      if (!activeQuestion.question) {
        throw new Error("Today's question is empty.");
      }

      if (!Array.isArray(activeQuestion.options)) {
        throw new Error(
          "Today's question does not contain valid answer options.",
        );
      }

      /*
       * Check the browser's local vote timestamp.
       *
       * IMPORTANT:
       * This is only a frontend convenience check.
       * The backend should still enforce the 24-hour restriction.
       */
      let alreadyVoted = false;

      if (activeQuestion.id !== undefined && activeQuestion.id !== null) {
        const voteTimestamp = localStorage.getItem(
          `vote_time_${activeQuestion.id}`,
        );

        if (voteTimestamp) {
          const parsedTimestamp = parseInt(voteTimestamp, 10);

          if (!Number.isNaN(parsedTimestamp)) {
            const timePassed = Date.now() - parsedTimestamp;

            // A voter may submit this question only once during its 24-hour window.
            if (timePassed < 24 * 60 * 60 * 1000) {
              alreadyVoted = true;
            } else {
              localStorage.removeItem(
                `vote_time_${activeQuestion.id}`,
              );
            }
          } else {
            localStorage.removeItem(
              `vote_time_${activeQuestion.id}`,
            );
          }
        }
      }

      this.setState({
        questions: data,
        currentQuestion: activeQuestion,
        hasVoted: alreadyVoted,
        isLoading: false,
        errorMessage: "",
      });
    } catch (err) {
      console.error("Error loading questions:", err);

      this.setState({
        isLoading: false,
        errorMessage:
          err?.message ||
          "Unable to load today's poll. Please try again.",
      });
    }
  };

  // Helper to extract clean text string regardless of option data shape
  getOptionText = (opt) => {
    if (typeof opt === "string") {
      return opt;
    }

    if (opt && typeof opt === "object") {
      return (
        opt.text ||
        opt.label ||
        opt.value ||
        JSON.stringify(opt)
      );
    }

    return String(opt);
  };

  handleOptionChange = (value) => {
    const { hasVoted, isSubmitting } = this.state;

    if (hasVoted || isSubmitting) {
      return;
    }

    this.setState({
      selectedOption: value,
      errorMessage: "",
      successMessage: "",
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const {
      currentQuestion,
      selectedOption,
      hasVoted,
      isSubmitting,
    } = this.state;

    console.log("Poll form submitted.");

    /*
     * Prevent invalid submissions.
     */
    if (isSubmitting) {
      console.log("Submission already in progress.");
      return;
    }

    if (hasVoted) {
      this.setState({
        errorMessage:
          "You have already voted on this question.",
      });

      return;
    }

    if (!selectedOption) {
      this.setState({
        errorMessage: "Please select an answer before voting.",
      });

      return;
    }

    if (
      !currentQuestion ||
      currentQuestion.id === undefined ||
      currentQuestion.id === null
    ) {
      this.setState({
        errorMessage:
          "This question does not have a valid question ID.",
      });

      console.error(
        "Invalid question ID:",
        currentQuestion,
      );

      return;
    }

    if (!currentQuestion.question) {
      this.setState({
        errorMessage: "The current question is invalid.",
      });

      return;
    }

    // Lock interface immediately when clicked to prevent double clicks or race condition bugs
    this.setState({
      isSubmitting: true,
      errorMessage: "",
      successMessage: "",
    });

    const payload = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: selectedOption,
    };

    console.log("Submitting poll:", payload);

    try {
      const endpoint = apiUrl("/question/submit");

      console.log("Poll API endpoint:", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      console.log("Poll API status:", response.status);

      if (!response.ok) {
        let errorMessage =
          "We could not record your vote. Please try again.";

        try {
          errorMessage = await getApiError(
            response,
            errorMessage,
          );
        } catch (error) {
          console.error(
            "Could not parse API error:",
            error,
          );

          try {
            const errorData = await response.json();

            errorMessage =
              errorData?.message ||
              errorData?.error ||
              errorMessage;
          } catch {
            // Ignore JSON parsing errors.
          }
        }

        throw new Error(errorMessage);
      }

      /*
       * Try to read the response.
       * Some APIs return JSON while others return an empty response.
       */
      let result = null;

      try {
        result = await response.json();
      } catch {
        // Empty response body is acceptable if HTTP status is successful.
      }

      console.log("Poll submission successful:", result);

      /*
       * Save the vote time locally.
       *
       * The backend must ALSO enforce the 24-hour rule.
       */
      localStorage.setItem(
        `vote_time_${currentQuestion.id}`,
        Date.now().toString(),
      );

      this.setState({
        hasVoted: true,
        isSubmitting: false,
        successMessage: "Your vote has been recorded.",
      });

      /*
       * Redirect after the state has been updated.
       */
      setTimeout(() => {
        this.setState({
          shouldRedirectToResults: true,
        });
      }, 300);
    } catch (err) {
      console.error("Submission failed:", err);

      this.setState({
        isSubmitting: false,
        errorMessage:
          err?.message ||
          "We could not record your vote. Please try again.",
      });
    }
  };

  handleSeeResults = (e) => {
    e.preventDefault();

    this.setState({
      shouldRedirectToResults: true,
    });
  };

  render() {
    const {
      currentQuestion,
      selectedOption,
      hasVoted,
      isLoading,
      isSubmitting,
      shouldRedirectToResults,
      errorMessage,
      successMessage,
    } = this.state;

    if (shouldRedirectToResults) {
      return <Navigate replace to="/results" />;
    }

    const options = currentQuestion?.options || [];

    
    const isSubmitDisabled =
      isLoading ||
      isSubmitting ||
      !selectedOption ||
      hasVoted;

    const isInteractionDisabled =
      isLoading ||
      isSubmitting ||
      hasVoted;

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
            ) : errorMessage && !currentQuestion?.question ? (
              <div className="text-center font-sans font-semibold text-xl text-[#830000] mt-10 px-4">
                {errorMessage}
              </div>
            ) : !currentQuestion ||
              !currentQuestion.question ? (
              <div className="text-center font-sans font-semibold text-xl text-[#830000] mt-10 px-4">
                No poll available at this moment.
              </div>
            ) : (
              <>
                <h3 className="text-center flex flex-wrap md:justify-center lg:justify-start md:items-start lg:items-center font-sans font-semibold text-3xl md:mx-20 lg:mx-20 mx-2">
                  {currentQuestion.question}
                </h3>

                {errorMessage && (
                  <div className="text-center text-red-600 font-semibold font-sans text-base mt-4 px-4">
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div className="text-center text-green-600 font-semibold font-sans text-base mt-4 px-4">
                    {successMessage}
                  </div>
                )}

                {hasVoted && !errorMessage && (
                  <div className="text-center text-[#830000] font-semibold font-sans text-base mt-4 px-4">
                    You have already voted on today's question.
                  </div>
                )}

                <form
                  className="w-auto"
                  onSubmit={this.handleSubmit}
                >
                  {options.map((opt, idx) => {
                    const optionText = this.getOptionText(opt);

                    const isChecked =
                      selectedOption === optionText;

                    return (
                      <div
                        key={`${currentQuestion.id}-${idx}`}
                        className="md:my-3 lg:my-3"
                      >
                        <label
                          className={`md:mx-20 lg:mx-20 mx-4 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans flex items-center gap-2 ${
                            isInteractionDisabled
                              ? "cursor-not-allowed opacity-60"
                              : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="radio"
                            name="poll_answer"
                            value={optionText}
                            checked={isChecked}
                            onChange={() =>
                              this.handleOptionChange(
                                optionText,
                              )
                            }
                            disabled={isInteractionDisabled}
                          />{" "}
                          {optionText}
                        </label>
                      </div>
                    );
                  })}

                  <div className="md:mt-10 lg:mt-10 mt-10 flex flex-col md:mx-20 lg:mx-20 mx-4 gap-2">
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className={`md:py-3 lg:py-3 py-3 text-white md:w-28 lg:w-28 w-28 text-xl font-semibold uppercase ${
                        isSubmitDisabled
                          ? "bg-[#830000] cursor-not-allowed opacity-60"
                          : "bg-[#830000] cursor-pointer"
                      }`}
                    >
                      {isLoading
                        ? "loading..."
                        : isSubmitting
                          ? "submitting..."
                          : hasVoted
                            ? "voted"
                            : "vote"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* 
            <div className="flex flex-wrap justify-start h-auto md:mt-32 lg:mt-32 mt-8 bg-green-200 text-white w-auto">
              <div
                onClick={this.handleSeeResults}
                className="md:w-80 lg:w-80 w-auto bg-blue-900 py-5 cursor-pointer"
              >
                <a
                  href="/results"
                  onClick={this.handleSeeResults}
                >
                  <p className="font-sans mx-5 capitalize font-semibold md:text-2xl lg:text-2xl text-xs">
                    see past results
                  </p>
                </a>
              </div>

              <div className="md:w-80 lg:w-80 w-20 cursor-pointer hover:bg-green-800 py-5">
              </div>
            </div>
            */}
          </div>

          <Advert />
        </div>
      </>
    );
  }
}

export default Quest;
