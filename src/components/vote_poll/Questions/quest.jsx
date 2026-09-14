/* eslint-disable no-unused-vars */
import React from "react";
import Advert from "../../features/component/Advertisement/components/advert";
import Reveal from "../../reveal.jsx";

class Quest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      poll: null,
      selectedOption: "",
      hasVoted: false,
      voting: false,
      error: "",
      counts: {},
      totalVotes: 0,
    };
    this._eventSource = null;
  }

  componentDidMount() {
    this.loadPoll();
  }

  componentWillUnmount() {
    if (this._eventSource) {
      this._eventSource.close();
      this._eventSource = null;
    }
  }

  loadPoll = async () => {
    try {
      const res = await fetch("/api/polls/current");
      if (!res.ok) return;
      const data = await res.json();
      const poll = data.poll;
      if (!poll) return;

      this.setState({
        poll,
        hasVoted: poll.hasVoted,
        counts: poll.counts ?? {},
        totalVotes: poll.totalVotes ?? 0,
      });

      if (poll.id && !poll.hasVoted) {
        this.connectStream(poll.id);
      }
    } catch (err) {
      console.error("Failed to load poll:", err);
    }
  };

  connectStream = (pollId) => {
    try {
      const es = new EventSource(`/api/polls/stream?poll=${pollId}`);
      this._eventSource = es;

      es.addEventListener("poll-update", (e) => {
        try {
          const payload = JSON.parse(e.data);
          this.setState({
            counts: payload.counts ?? {},
            totalVotes: payload.totalVotes ?? 0,
          });
        } catch {}
      });

      es.onerror = () => {
        es.close();
        this._eventSource = null;
      };
    } catch {}
  };

  handleOptionChange = (e) => {
    if (this.state.hasVoted || this.state.voting) return;
    this.setState({ selectedOption: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { poll, selectedOption, hasVoted, voting } = this.state;
    if (!selectedOption || hasVoted || voting || !poll) return;

    this.setState({ voting: true, error: "" });

    try {
      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: selectedOption }),
      });

      if (res.ok) {
        const data = await res.json();
        this.setState({
          hasVoted: true,
          voting: false,
          counts: data.counts ?? {},
          totalVotes: data.totalVotes ?? 0,
          selectedOption: "",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        this.setState({
          voting: false,
          error: data.error || "Failed to vote. Please try again.",
        });
      }
    } catch {
      this.setState({ voting: false, error: "Network error. Please try again." });
    }
  };

  render() {
    const { poll, selectedOption, hasVoted, voting, error, counts, totalVotes } =
      this.state;
    const options = poll?.options || [];

    if (!poll) {
      return (
        <div className="flex w-full items-center justify-center px-4 py-16">
          <p className="text-gray-500 text-lg">No active poll right now.</p>
        </div>
      );
    }

    return (
      <div className="flex w-full flex-col items-center justify-center gap-10 px-4 py-8 md:px-10 lg:flex-row lg:items-stretch lg:justify-between">
        <Reveal className="w-full max-w-4xl lg:w-auto lg:flex-1">
          <div className="w-full bg-white px-4 py-8 shadow-none sm:px-8 md:min-h-140 md:px-10 md:shadow-xl">
          <h1 className="pt-10 text-center font-sans text-4xl font-semibold uppercase text-violet-950 md:pt-8 md:text-5xl lg:pt-10 lg:text-5xl">
            today's poll
          </h1>
          <div className="my-8 flex flex-wrap items-center justify-center">
            <hr className="h-1 w-3/4 max-w-80 border-none bg-violet-900" />
          </div>

          <h3 className="mx-2 text-center font-sans text-2xl font-semibold sm:text-3xl md:mx-0 md:text-left">
            {poll.question}
          </h3>

          <form className="w-full" onSubmit={this.handleSubmit}>
            {options.map((opt, idx) => {
              const count = counts[opt] || 0;
              const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
              return (
                <div key={`${opt}-${idx}`} className="md:my-3 lg:my-3">
                  <label
                    className={`mx-0 flex items-center gap-2 font-sans text-lg font-semibold capitalize sm:text-xl md:text-2xl ${
                      hasVoted
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }`}
                  >
                    {!hasVoted ? (
                      <input
                        type="radio"
                        name="answer"
                        value={opt}
                        checked={selectedOption === opt}
                        onChange={this.handleOptionChange}
                        disabled={hasVoted || voting}
                      />
                    ) : (
                      <span className="inline-block w-5 h-5" />
                    )}{" "}
                    {opt}
                  </label>
                  {hasVoted && (
                    <div className="mt-1 ml-7 flex items-center gap-2 text-sm text-gray-600">
                      <div
                        className="h-2 bg-violet-900 rounded"
                        style={{ width: `${pct}%`, minWidth: count > 0 ? 8 : 0 }}
                      />
                      <span>
                        {count} ({pct}%)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="mt-10 flex flex-col gap-2">
              {!hasVoted && (
                <input
                  type="submit"
                  value={voting ? "voting…" : "vote"}
                  disabled={!selectedOption || voting}
                  className={`w-28 py-3 text-xl font-semibold text-white md:w-28 lg:w-28 ${
                    !selectedOption || voting
                      ? "cursor-not-allowed bg-violet-900 opacity-50 uppercase"
                      : "cursor-pointer bg-violet-900"
                  }`}
                />
              )}
              {hasVoted && (
                <p className="text-sm text-gray-500">
                  {totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far
                </p>
              )}
            </div>
            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}
          </form>
        </div>
        </Reveal>
        <Reveal delay={150} className="w-full lg:w-auto">
          <Advert />
        </Reveal>
      </div>
    );
  }
}

export default Quest;