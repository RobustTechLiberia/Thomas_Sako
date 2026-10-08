import React from "react";
import { Navigate } from "react-router-dom";
import Advert from "../../features/component/Advertisement/components/advert";
import { apiUrl } from "../../../lib/api";
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
      errorMessage: "",
      successMessage: "",
    };

    this._submissionInProgress = false;
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
        throw new Error(`Failed to load questions. HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No poll questions are available.");
      }

      const dayIndex = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

      const questionIndex = dayIndex % data.length;
      const activeQuestion = data[questionIndex];

      if (
        !activeQuestion ||
        activeQuestion.id === undefined ||
        activeQuestion.id === null ||
        !activeQuestion.question ||
        !Array.isArray(activeQuestion.options) ||
        activeQuestion.options.length === 0
      ) {
        throw new Error(
          "Today's question does not contain valid question data.",
        );
      }

      let alreadyVoted = false;

      try {
        const storageKey = `vote_time_${activeQuestion.id}`;
        const voteTimestamp = localStorage.getItem(storageKey);

        if (voteTimestamp) {
          const parsedTimestamp = Number(voteTimestamp);
          const elapsed = Date.now() - parsedTimestamp;
          const oneDay = 24 * 60 * 60 * 1000;

          if (
            Number.isFinite(parsedTimestamp) &&
            elapsed >= 0 &&
            elapsed < oneDay
          ) {
            alreadyVoted = true;
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      } catch {
        alreadyVoted = false;
      }

      this.setState({
        questions: data,
        currentQuestion: activeQuestion,
        selectedOption: "",
        hasVoted: alreadyVoted,
        isLoading: false,
        errorMessage: "",
        successMessage: "",
      });
    } catch (error) {
      this.setState({
        isLoading: false,
        errorMessage:
          error?.message || "Unable to load today's poll. Please try again.",
      });
    }
  };

  getOptionText = (option) => {
    if (typeof option === "string") {
      return option;
    }

    if (option && typeof option === "object") {
      const value = option.text ?? option.label ?? option.value;

      return value == null ? "" : String(value);
    }

    return option == null ? "" : String(option);
  };

  handleOptionChange = (value) => {
    const { hasVoted, isSubmitting, currentQuestion } = this.state;

    if (hasVoted || isSubmitting || this._submissionInProgress) {
      return;
    }

    const validOption = (currentQuestion.options || []).some(
      (option) => this.getOptionText(option) === value,
    );

    if (!validOption) {
      this.setState({
        errorMessage: "Please select a valid answer.",
      });
      return;
    }

    this.setState({
      selectedOption: value,
      errorMessage: "",
      successMessage: "",
    });
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    if (this._submissionInProgress) {
      return;
    }

    const { currentQuestion, selectedOption, hasVoted, isLoading } = this.state;

    if (isLoading) {
      return;
    }

    if (hasVoted) {
      this.setState({
        errorMessage: "You have already voted on this question.",
        successMessage: "",
      });
      return;
    }

    if (
      !currentQuestion ||
      currentQuestion.id === undefined ||
      currentQuestion.id === null ||
      !currentQuestion.question
    ) {
      this.setState({
        errorMessage:
          "The current question is invalid. Please reload the page.",
        successMessage: "",
      });
      return;
    }

    const validOption = (currentQuestion.options || []).some(
      (option) => this.getOptionText(option) === selectedOption,
    );

    if (!selectedOption || !validOption) {
      this.setState({
        errorMessage: "Please select an answer before voting.",
        successMessage: "",
      });
      return;
    }

    this._submissionInProgress = true;

    this.setState({
      isSubmitting: true,
      errorMessage: "",
      successMessage: "",
    });

    const payload = {
      question: currentQuestion.question,
      answer: selectedOption,
    };

    try {
      const response = await fetch(apiUrl("/question/vote"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      let responseData = {};

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = {
            message: responseText,
          };
        }
      }

      if (response.ok) {
        try {
          localStorage.setItem(
            `vote_time_${currentQuestion.id}`,
            String(Date.now()),
          );
        } catch {
          this.setState({
            hasVoted: true,
            isSubmitting: false,
            successMessage:
              responseData.message || "Your vote has been recorded.",
            errorMessage: "",
            shouldRedirectToResults: true,
          });

          return;
        }

        this.setState({
          hasVoted: true,
          isSubmitting: false,
          successMessage:
            responseData.message || "Your vote has been recorded.",
          errorMessage: "",
          shouldRedirectToResults: true,
        });

        return;
      }

      const errorMessage =
        responseData.message ||
        responseData.error ||
        (response.status === 400
          ? "Invalid poll submission. Check your selected answer."
          : response.status === 401
            ? "Please sign in before submitting your vote."
            : response.status === 403
              ? "You are not permitted to submit this vote."
              : response.status === 404
                ? "The poll API route was not found. Check your backend route."
                : response.status === 409 || response.status === 429
                  ? "You have already voted on this question."
                  : response.status >= 500
                    ? "The server encountered an error. Please try again later."
                    : `Unable to submit your vote. HTTP ${response.status}.`);

      this.setState({
        isSubmitting: false,
        hasVoted: response.status === 409 || response.status === 429,
        errorMessage,
        successMessage: "",
      });
    } catch (error) {
      this.setState({
        isSubmitting: false,
        errorMessage:
          error?.message === "Failed to fetch"
            ? "Unable to connect to the server. Check the API URL, server status, and CORS configuration."
            : error?.message || "Unable to record your vote. Please try again.",
        successMessage: "",
      });
    } finally {
      this._submissionInProgress = false;
    }
  };

  handleSeeResults = (event) => {
    if (event) {
      event.preventDefault();
    }

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
      isLoading || isSubmitting || !selectedOption || hasVoted;

    const isInteractionDisabled = isLoading || isSubmitting || hasVoted;

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
                {errorMessage || "No poll available at this moment."}
              </div>
            ) : (
              <>
                <h3 className="text-center flex flex-wrap md:justify-center lg:justify-start md:items-start lg:items-center font-sans font-semibold text-3xl md:mx-20 lg:mx-20 mx-2">
                  {currentQuestion.question}
                </h3>

                {errorMessage && (
                  <div
                    role="alert"
                    className="text-center text-red-600 font-semibold font-sans text-base mt-4 px-4"
                  >
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div
                    role="status"
                    className="text-center text-green-600 font-semibold font-sans text-base mt-4 px-4"
                  >
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
                  aria-busy={isSubmitting}
                >
                  {options.map((option, index) => {
                    const optionText = this.getOptionText(option);

                    if (!optionText) {
                      return null;
                    }

                    const isChecked = selectedOption === optionText;

                    return (
                      <div
                        key={`${currentQuestion.id}-${index}`}
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
                            onChange={() => this.handleOptionChange(optionText)}
                            disabled={isInteractionDisabled}
                            required
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
                      {isSubmitting
                        ? "submitting..."
                        : hasVoted
                          ? "voted"
                          : "vote"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <Advert />
        </div>
      </>
    );
  }
}

export default Quest;
