import { useState, useEffect } from "react";
import { House } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import Ring from "../components/Ring.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Interview() {
  const { isDarkMode } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const interviewId = location.state?.interviewId;

  const [isStopping, setIsStopping] = useState(false);
  const [error, setError] = useState("");

  // Check whether the backend has finished the interview.
  useEffect(() => {
    if (!interviewId) return;

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      return;
    }

    let isMounted = true;
    let isRedirecting = false;

    const checkInterviewStatus = async () => {
      if (isRedirecting) return;

      try {
        const response = await fetch(
          `https://intelligenceview.onrender.com/interview/status/${interviewId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          if (isMounted) logout();
          return;
        }

        if (!response.ok) return;

        const data = await response.json();

        if (data.completed && isMounted && !isRedirecting) {
          isRedirecting = true;
          navigate("/", { replace: true });
        }
      } catch (err) {
        console.error("Error checking interview status:", err);
      }
    };

    checkInterviewStatus();

    const intervalId = setInterval(checkInterviewStatus, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [interviewId, logout, navigate]);

  const handleStopInterview = async () => {
    if (isStopping) return;

    if (!interviewId) {
      setError("Interview ID is missing. Cannot stop the interview.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      logout();
      return;
    }

    setIsStopping(true);
    setError("");

    try {
      const response = await fetch(
        `https://intelligenceview.onrender.com/interview/end/${interviewId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        logout();
        return;
      }

      // The interview may already have ended automatically.
      // Check its status before showing an error.
      if (response.status === 404) {
        const statusResponse = await fetch(
          `https://intelligenceview.onrender.com/interview/status/${interviewId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (statusResponse.status === 401) {
          logout();
          return;
        }

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();

          if (statusData.completed) {
            navigate("/", { replace: true });
            return;
          }
        }

        throw new Error(
          data.detail || "The interview could not be stopped."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to stop the interview."
        );
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Error stopping interview:", err);
      setError(
        err.message || "Could not contact the backend. Please try again."
      );
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors ${
        isDarkMode ? "bg-zinc-950" : "bg-zinc-50"
      }`}
    >
      {/* Navbar */}
      <nav
        className={`h-14 border-b px-4 sm:px-6 md:px-8 flex items-center transition-colors ${
          isDarkMode
            ? "border-zinc-800 bg-zinc-900"
            : "border-zinc-200 bg-white"
        }`}
      >
        <h1
          className={`text-base sm:text-lg md:text-xl font-bold ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}
        >
          Intelligence
          <span className="text-orange-500">View</span>
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/"
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "text-zinc-300 hover:bg-zinc-800"
                : "text-zinc-700 hover:bg-zinc-100"
            }`}
            aria-label="Home"
          >
            <House size={20} />
          </Link>

          <ThemeToggle />
        </div>
      </nav>

      {/* Interview Content */}
      <main className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 sm:px-6 md:px-8">
        {/* Interview Box — Outer Circle */}
        <div
          className={`relative flex h-80 w-80 max-w-full items-center justify-center rounded-full border sm:h-96 sm:w-96 md:h-105 md:w-105 ${
            isDarkMode
              ? "border-zinc-700 bg-zinc-900"
              : "border-zinc-300 bg-white"
          }`}
        >
          {/* Inner Circle */}
          <Ring />

          {/* Interview Status */}
          <p
            className={`absolute inset-0 z-10 flex items-center justify-center text-center text-sm font-medium ${
              isDarkMode ? "text-zinc-200" : "text-zinc-800"
            }`}
          >
            {isStopping ? "Stopping interview..." : "Interview in process"}
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 max-w-md text-center text-sm text-red-500"
          >
            {error}
          </p>
        )}

        {/* Stop Interview */}
        <button
          type="button"
          onClick={handleStopInterview}
          disabled={isStopping}
          className="mt-5 sm:mt-6 w-auto px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {isStopping ? "Stopping Interview..." : "Stop Interview"}
        </button>
      </main>
    </div>
  );
}

export default Interview;