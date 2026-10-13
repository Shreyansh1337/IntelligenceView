import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  MessageSquare,
  Mic,
  RefreshCw,
  Target,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
const API_URL = "https://intelligenceview.onrender.com";
function Dashboard() {

  const { isDarkMode } = useTheme();

  const { logout } = useAuth();

  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const numberedInterviews = interviews.map((interview, index) => ({
    ...interview,
    displayNumber: interviews.length - index,
  }));

  const [expandedId, setExpandedId] = useState(null);

  const [details, setDetails] = useState({});

  const [loading, setLoading] = useState(true);

  const [loadingDetails, setLoadingDetails] = useState(null);

  const [error, setError] = useState("");
  const dark = isDarkMode;

  const pageBg = dark ? "bg-zinc-950" : "bg-zinc-50";

  const panel = dark

    ? "bg-zinc-900 border-zinc-800"

    : "bg-white border-zinc-200";

  const muted = dark ? "text-zinc-400" : "text-zinc-500";

  const heading = dark ? "text-white" : "text-zinc-900";

  const soft = dark ? "bg-zinc-800" : "bg-zinc-100";
  const fetchInterviews = useCallback(async () => {

    const token = localStorage.getItem("access_token");
    if (!token) {

      logout();

      return;

    }
    setLoading(true);

    setError("");
    try {

      const response = await fetch(`${API_URL}/interviews`, {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });
      if (response.status === 401) {

        logout();

        return;

      }
      if (!response.ok) {

        throw new Error("Couldn't load your interview history.");

      }
      const data = await response.json();

      setInterviews(data);

    } catch (err) {

      setError(err.message || "Unable to connect to the server.");

    } finally {

      setLoading(false);

    }

  }, [logout]);
  useEffect(() => {

    fetchInterviews();

  }, [fetchInterviews]);
  const toggleInterview = async (id) => {

    if (expandedId === id) {

      setExpandedId(null);

      return;

    }
    setExpandedId(id);
    if (details[id]) return;
    const token = localStorage.getItem("access_token");
    if (!token) {

      logout();

      return;

    }
    setLoadingDetails(id);
    try {

      const response = await fetch(`${API_URL}/interviews/${id}`, {

        headers: {

          Authorization: `Bearer ${token}`,

        },

      });
      if (response.status === 401) {

        logout();

        return;

      }
      if (!response.ok) {

        throw new Error("Couldn't load this interview's details.");

      }
      const data = await response.json();
      setDetails((previous) => ({
        ...previous,

        [id]: data,

      }));

    } catch (err) {

      setError(err.message || "Unable to load interview details.");

      setExpandedId(null);

    } finally {

      setLoadingDetails(null);

    }

  };
  const formatDate = (value) => {

    if (!value) return "Date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return date.toLocaleString(undefined, {

      day: "numeric",

      month: "short",

      year: "numeric",

      hour: "numeric",

      minute: "2-digit",

    });

  };
  const averageScore = (() => {

    const scores = interviews

      .map((item) => item.score)

      .filter((score) => typeof score === "number");

    if (!scores.length) return null;

    return Math.round(

      scores.reduce((total, score) => total + score, 0) / scores.length

    );

  })();
  const cardClass = `rounded-2xl border ${panel}`;
  return (

    <div className={`min-h-screen ${pageBg} ${heading} transition-colors`}>

      <header

        className={`sticky top-0 z-20 border-b ${

          dark

            ? "bg-zinc-950/90 border-zinc-800"

            : "bg-white/90 border-zinc-200"

        } backdrop-blur`}

      >

        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">

          <button

            type="button"

            onClick={() => navigate("/")}

            className="text-left"

            aria-label="Go to interview setup"

          >

            <span className="text-xl font-bold">

              Intelligence<span className="text-orange-500">View</span>

            </span>

          </button>
          <div className="flex items-center gap-2 sm:gap-4">

            <span className={`hidden sm:inline text-sm ${muted}`}>

              Your progress

            </span>

            <ThemeToggle />

            <button

              type="button"

              onClick={logout}

              title="Log out"

              className={`p-2 rounded-lg transition-colors ${

                dark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"

              }`}

            >

              <LogOut size={18} />

            </button>

          </div>

        </div>

      </header>



      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-10">

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">

          <div>

            <div className="flex items-center gap-2 text-orange-500 text-sm font-medium mb-2">

              <LayoutDashboard size={17} />

              PERSONAL DASHBOARD

            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">

              Your Interviews

            </h1>

            <p className={`${muted} mt-2`}>

              Review your sessions, understand your performance, and keep improving.

            </p>

          </div>
          <button

            type="button"

            onClick={() => navigate("/")}

            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"

          >

            <Mic size={18} />

            Start New Interview

          </button>

        </div>
        {error && (

          <div

            role="alert"

            className={`mb-6 p-4 rounded-xl border flex items-start gap-3 ${

              dark

                ? "bg-red-950/30 border-red-900 text-red-200"

                : "bg-red-50 border-red-200 text-red-700"

            }`}

          >

            <CircleAlert size={20} className="mt-0.5 shrink-0" />

            <div className="flex-1 text-sm">{error}</div>

            <button

              type="button"

              onClick={fetchInterviews}

              className="text-sm font-medium underline"

            >

              Retry

            </button>

          </div>

        )}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">

          <div className={`${cardClass} p-5`}>

            <div className="flex items-center justify-between mb-4">

              <span className={`text-sm ${muted}`}>Total Interviews</span>

              <span className={`p-2 rounded-xl ${soft}`}>

                <MessageSquare size={19} className="text-orange-500" />

              </span>

            </div>

            <div className="text-3xl font-bold">

              {loading ? "—" : interviews.length}

            </div>

            <p className={`text-sm ${muted} mt-2`}>

              Your saved practice sessions

            </p>

          </div>
          <div className={`${cardClass} p-5`}>

            <div className="flex items-center justify-between mb-4">

              <span className={`text-sm ${muted}`}>Average Score</span>

              <span className={`p-2 rounded-xl ${soft}`}>

                <TrendingUp size={19} className="text-orange-500" />

              </span>

            </div>

            <div className="text-3xl font-bold">

              {loading ? "—" : averageScore === null ? "—" : averageScore}

              {averageScore !== null && (

                <span className={`text-base font-normal ${muted}`}> / 100</span>

              )}

            </div>

            <p className={`text-sm ${muted} mt-2`}>

              Based on completed evaluations

            </p>

          </div>
          <div className={`${cardClass} p-5`}>

            <div className="flex items-center justify-between mb-4">

              <span className={`text-sm ${muted}`}>Latest Session</span>

              <span className={`p-2 rounded-xl ${soft}`}>

                <CalendarDays size={19} className="text-orange-500" />

              </span>

            </div>

            <div className="text-lg font-bold truncate">

              {loading

                ? "Loading..."

                : interviews.length

                  ? `Interview #${interviews[0].displayNumber ?? interviews.length}`

                  : "No sessions yet"}

            </div>

            <p className={`text-sm ${muted} mt-2`}>

              {interviews.length

                ? formatDate(interviews[0].created_at)

                : "Your first session starts here"}

            </p>

          </div>

        </section>
        <section>

          <div className="flex items-center justify-between gap-3 mb-4">

            <div>

              <h2 className="text-xl font-bold">Interview History</h2>

              <p className={`text-sm mt-1 ${muted}`}>

                Select a session to view its transcript and feedback.

              </p>

            </div>
            <button

              type="button"

              onClick={fetchInterviews}

              disabled={loading}

              title="Refresh interview history"

              className={`p-2.5 rounded-xl border ${panel} ${

                loading ? "opacity-50" : "hover:opacity-75"

              }`}

            >

              <RefreshCw

                size={18}

                className={loading ? "animate-spin" : ""}

              />

            </button>

          </div>
          {loading ? (

            <div className={`${cardClass} p-12 flex flex-col items-center`}>

              <LoaderCircle size={30} className="animate-spin text-orange-500" />

              <p className={`mt-4 ${muted}`}>Loading your interviews...</p>

            </div>

          ) : interviews.length === 0 ? (

            <div className={`${cardClass} p-10 sm:p-14 text-center`}>

              <div

                className={`mx-auto mb-4 size-14 rounded-2xl ${soft} flex items-center justify-center`}

              >

                <MessageSquare size={25} className="text-orange-500" />

              </div>

              <h3 className="text-lg font-semibold">Your journey starts here</h3>

              <p className={`${muted} max-w-md mx-auto mt-2 mb-6`}>

                Complete your first mock interview to see your history, evaluation,

                and improvement suggestions here.

              </p>

              <button

                type="button"

                onClick={() => navigate("/")}

                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium"

              >

                Start Your First Interview

                <ArrowRight size={17} />

              </button>

            </div>

          ) : (

            <div className="space-y-4">

              {numberedInterviews.map((interview) => {

                const expanded = expandedId === interview.id;

                const detail = details[interview.id];
                return (

                  <article key={interview.id} className={cardClass}>

                    <button

                      type="button"

                      onClick={() => toggleInterview(interview.id)}

                      aria-expanded={expanded}

                      className={`w-full text-left p-4 sm:p-5 flex items-center gap-3 sm:gap-4 rounded-2xl transition-colors ${

                        dark ? "hover:bg-zinc-800/60" : "hover:bg-zinc-50"

                      }`}

                    >

                      <div

                        className={`hidden sm:flex size-12 shrink-0 items-center justify-center rounded-xl ${soft}`}

                      >

                        <MessageSquare className="text-orange-500" size={22} />

                      </div>
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold">

                            Interview #{interview.displayNumber}

                          </h3>

                          {interview.score !== null &&

                          interview.score !== undefined ? (

                            <span

                              className={`text-xs px-2 py-1 rounded-full ${

                                dark

                                  ? "bg-emerald-950 text-emerald-300"

                                  : "bg-emerald-50 text-emerald-700"

                              }`}

                            >

                              Score: {interview.score}/100

                            </span>

                          ) : (

                            <span

                              className={`text-xs px-2 py-1 rounded-full ${

                                dark

                                  ? "bg-zinc-800 text-zinc-300"

                                  : "bg-zinc-100 text-zinc-600"

                              }`}

                            >

                              Evaluation pending

                            </span>

                          )}

                        </div>

                        <p className={`text-sm mt-1 ${muted}`}>

                          {interview.interview_type} · {interview.interview_template}

                        </p>

                        <p className={`text-xs mt-1 ${muted}`}>

                          {formatDate(interview.created_at)}

                        </p>

                      </div>



                      <div className="shrink-0">

                        {loadingDetails === interview.id ? (

                          <LoaderCircle

                            size={20}

                            className="animate-spin text-orange-500"

                          />

                        ) : expanded ? (

                          <ChevronDown size={21} />

                        ) : (

                          <ChevronRight size={21} />

                        )}

                      </div>

                    </button>
                    {expanded && (

                      <div className={`border-t ${dark ? "border-zinc-800" : "border-zinc-200"} p-4 sm:p-6`}>

                        {!detail ? (

                          <div className={`flex items-center gap-2 ${muted}`}>

                            <LoaderCircle size={18} className="animate-spin" />

                            Loading interview details...

                          </div>

                        ) : (

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            <div className="space-y-5">

                              <section>

                                <h4 className="font-semibold flex items-center gap-2 mb-3">

                                  <FileText size={18} className="text-orange-500" />

                                  Interview Summary

                                </h4>

                                <div className={`${soft} rounded-xl p-4`}>

                                  <p className={`text-sm ${muted}`}>Resume</p>

                                  <p className="text-sm font-medium mt-1 break-words">

                                    {interview.resume_filename || "Not recorded"}

                                  </p>

                                  <p className={`text-sm mt-4 ${muted}`}>Score</p>

                                  <p className="text-2xl font-bold mt-1">

                                    {detail.score === null || detail.score === undefined

                                      ? "Not available yet"

                                      : `${detail.score} / 100`}

                                  </p>

                                </div>

                              </section>
                              <section>

                                <h4 className="font-semibold flex items-center gap-2 mb-3">

                                  <Target size={18} className="text-orange-500" />

                                  Areas to Improve

                                </h4>

                                <div className={`${soft} rounded-xl p-4`}>

                                  {detail.area_to_improve ? (

                                    <p className="text-sm leading-7 whitespace-pre-wrap">

                                      {detail.area_to_improve}

                                    </p>

                                  ) : (

                                    <p className={`text-sm leading-6 ${muted}`}>

                                      Feedback isn't available yet. It may still be

                                      processing, or the interview may not have

                                      enough recorded answers to evaluate.

                                    </p>

                                  )}

                                </div>

                              </section>

                            </div>
                            <section>

                              <h4 className="font-semibold flex items-center gap-2 mb-3">

                                <MessageSquare size={18} className="text-orange-500" />

                                Interview Transcript

                                <span className={`text-xs font-normal ${muted}`}>

                                  ({detail.transcripts?.length || 0} messages)

                                </span>

                              </h4>
                              {!detail.transcripts?.length ? (

                                <div className={`${soft} rounded-xl p-5`}>

                                  <p className={`text-sm ${muted}`}>

                                    No transcript messages were saved for this session.

                                  </p>

                                </div>

                              ) : (

                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">

                                  {detail.transcripts.map((transcript) => {

                                    const isCandidate = [

                                      "candidate",

                                      "user",

                                      "you",

                                    ].includes(

                                      (transcript.speaker || "").toLowerCase()

                                    );
                                    return (

                                      <div

                                        key={transcript.id}

                                        className={`rounded-xl p-3 sm:p-4 ${

                                          isCandidate

                                            ? dark

                                              ? "bg-blue-950/40 border border-blue-900/70"

                                              : "bg-blue-50 border border-blue-100"

                                            : soft

                                        }`}

                                      >

                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">

                                          <span

                                            className={`text-xs font-semibold ${

                                              isCandidate

                                                ? "text-blue-500"

                                                : "text-orange-500"

                                            }`}

                                          >

                                            {isCandidate ? "Candidate" : "Gemini"}

                                          </span>

                                          <span className={`text-xs ${muted}`}>

                                            {formatDate(transcript.timestamp)}

                                          </span>

                                        </div>

                                        <p className="text-sm leading-6 whitespace-pre-wrap break-words">

                                          {transcript.message}

                                        </p>

                                      </div>

                                    );

                                  })}

                                </div>

                              )}

                            </section>

                          </div>

                        )}

                      </div>

                    )}

                  </article>

                );

              })}

            </div>

          )}

        </section>
        <footer className={`mt-10 pt-5 border-t ${dark ? "border-zinc-800" : "border-zinc-200"} flex flex-col sm:flex-row justify-between gap-2 text-xs ${muted}`}>

          <span>IntelligenceView · Practice. Improve. Get Hired.</span>

          <button

            type="button"

            onClick={() => navigate("/")}

            className="inline-flex items-center gap-1 self-start sm:self-auto hover:text-orange-500"

          >

            <ArrowLeft size={14} />

            Back to interview setup

          </button>

        </footer>
      </main>
    </div>
  );
}
export default Dashboard;