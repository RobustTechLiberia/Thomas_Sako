import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Advert from "../../features/component/Advertisement/components/advert";
import { apiUrl, getApiError } from "../../../lib/api";

import "../../../../App.scss";

const Quest = () => {
  const navigate = useNavigate();

  const [currentQuestion, setCurrentQuestion] = useState({
    id: null,
    question: "",
    options: [],
  });
  const [selectedOption, setSelectedOption] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}questions.json`,
        {
          method: "GET",
          cache: "no-cache",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load questions resource. HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No poll questions are available.");
      }

      const today = new Date();
      const dayIndex = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
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
          "Today's question does not contain valid answer options."
        );
      }

      setCurrentQuestion(activeQuestion);
      setIsLoading(false);
      setErrorMessage("");
    } catch (err) {
      console.error("Error loading questions:", err);
      setIsLoading(false);
      setErrorMessage(
        err?.message || "Unable to load today's poll. Please try again."
      );
    }
  };

  const getOptionText = (opt) => {
    if (typeof opt === "string") {
      return opt;
    }

    if (opt && typeof opt === "object") {
      return opt.text || opt.label || opt.value || JSON.stringify(opt);
    }

    return String(opt);
  };

  const handleOptionChange = (value) => {
    if (isSubmitting) return;

    setSelectedOption(value);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedOption) {
      setErrorMessage("Please select an answer before voting.");
      return;
    }

    if (
      !currentQuestion ||
      currentQuestion.id === undefined ||
      currentQuestion.id === null
    ) {
      setErrorMessage("This question does not have a valid question ID.");
      return;
    }

    if (!currentQuestion.question) {
      setErrorMessage("The current question is invalid.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      answer: selectedOption,
    };

    try {
      const endpoint = apiUrl("/question");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let responseData = {};
      try {
        responseData = await response.json();
      } catch (jsonError) {
        console.log("Response has no JSON body.");
      }

      if (response.status === 201 || response.ok) {
        setIsSubmitting(false);
        setSuccessMessage(
          responseData?.message || "Your vote has been recorded."
        );
        setErrorMessage("");

        setTimeout(() => {
          navigate("/results");
        }, 300);

        return;
      }

      if (response.status === 400) {
        setIsSubmitting(false);
        setErrorMessage(
          responseData?.message ||
            responseData?.error ||
            "Invalid poll submission."
        );
        return;
      }

      let errorMsg =
        responseData?.message ||
        responseData?.error ||
        "We could not record your vote. Please try again.";

      if (!response.ok) {
        try {
          errorMsg = await getApiError(response, errorMsg);
        } catch (error) {
          console.error("Could not parse API error:", error);
        }
      }

      throw new Error(errorMsg);
    } catch (err) {
      console.error("Submission failed:", err);
      setIsSubmitting(false);
      setErrorMessage(
        err?.message || "We could not record your vote. Please try again."
      );
    }
  };

  const handleSeeResults = (e) => {
    e.preventDefault();
    navigate("/results");
  };

  const options = currentQuestion?.options || [];
  const isSubmitDisabled = isLoading || isSubmitting || !selectedOption;

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
                <div className="text-center text-red-600 font-semibold font-sans text-base mt-4 px-4">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="text-center text-green-600 font-semibold font-sans text-base mt-4 px-4">
                  {successMessage}
                </div>
              )}

              <form className="w-auto" onSubmit={handleSubmit}>
                {options.map((opt, idx) => {
                  const optionText = getOptionText(opt);
                  const isChecked = selectedOption === optionText;

                  return (
                    <div
                      key={`${currentQuestion.id}-${idx}`}
                      className="md:my-3 lg:my-3"
                    >
                      <label
                        className={`md:mx-20 lg:mx-20 mx-4 capitalize md:text-2xl lg:text-2xl text-2xl font-semibold font-sans flex items-center gap-2 ${
                          isSubmitting
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer"
                        }`}
                      >
                        <input
                          type="radio"
                          name="poll_answer"
                          value={optionText}
                          checked={isChecked}
                          onChange={() => handleOptionChange(optionText)}
                          disabled={isSubmitting}
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
                        : "bg-[#830000] cursor-pointer hover:bg-[#600000]"
                    }`}
                  >
                    {isSubmitting ? "submitting..." : "vote"}
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="flex flex-wrap justify-start h-auto md:mt-32 lg:mt-32 mt-8 bg-green-200 text-white w-auto">
            <div
              onClick={handleSeeResults}
              className="md:w-80 lg:w-80 w-auto bg-blue-900 py-5 cursor-pointer"
            >
              <a href="/results" onClick={handleSeeResults}>
                <p className="font-sans mx-5 capitalize font-semibold md:text-2xl lg:text-2xl text-xs">
                  see past results
                </p>
              </a>
            </div>

            <div className="md:w-80 lg:w-80 w-20 cursor-pointer hover:bg-green-800 py-5"></div>
          </div>
        </div>

        <Advert />
      </div>
    </>
  );
};

export default Quest;