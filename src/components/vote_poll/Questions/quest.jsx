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
          "Today's question does not contain valid answer options.",
        );
      }

      setCurrentQuestion(activeQuestion);
      setIsLoading(false);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(
        err.message || "An error occurred while loading questions.",
      );
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOption) {
      setErrorMessage("Please select an option before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${apiUrl}/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOption: selectedOption,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          getApiError(errorData) || "Failed to submit your response.",
        );
      }

      setSuccessMessage("Thank you for your answer!");
      setTimeout(() => {
        navigate("/results"); // Adjust route path as necessary
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading question...</div>;
  }

  return (
    <div className="quest-container">
      <Advert />

      <main className="quest-content">
        <h2>Today's Question</h2>

        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {!successMessage && currentQuestion.question && (
          <form onSubmit={handleSubmit} className="quest-form">
            <p className="question-text">{currentQuestion.question}</p>

            <div className="options-list">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="option-label">
                  <input
                    type="radio"
                    name="quest-option"
                    value={option}
                    checked={selectedOption === option}
                    onChange={(e) => setSelectedOption(e.target.value)}
                    disabled={isSubmitting}
                  />
                  {option}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedOption}
              className="submit-btn"
            >
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default Quest;
