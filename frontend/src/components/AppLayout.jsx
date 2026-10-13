
import SideBar from "./SideBar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import InterviewTemplate from "./InterviewTemplate.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import InterviewTypeSelect from "./InterviewTypeSelect.jsx";

import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const API_URL = (
  import.meta.env.VITE_API_URL || "https://intelligenceview.onrender.com"
).replace(/\/$/, "");

function AppLayout() {
  const [user, setUser] = useState(null);
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  const [backendStatus, setBackendStatus] = useState("checking");
  const [retryVersion, setRetryVersion] = useState(0);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedInterviewType, setSelectedInterviewType] = useState(
    "Technical Interview"
  );
  const [selectedResume, setSelectedResume] = useState(null);

  const { isDarkMode, setIsDarkMode } = useTheme();
  const fileInputRef = useRef(null);

  const companies = [
    { name: "Google", image: "/assets/Google.png" },
    { name: "Microsoft", image: "/assets/Microsoft.png" },
    { name: "Amazon", image: "/assets/Amazon.png" },
    { name: "Meta", image: "/assets/Meta.png" },
  ];

  // Check whether the backend is awake and ready.
  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    let requestTimeout;
    const startedAt = Date.now();

    async function checkHealth() {
      const controller = new AbortController();

      requestTimeout = setTimeout(() => {
        controller.abort();
      }, 10000);

      try {
        const response = await fetch(`${API_URL}/health`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Backend is not ready");
        }

        if (!cancelled) {
          setBackendStatus("ready");
        }
      } catch {
        if (cancelled) return;

        if (Date.now() - startedAt >= 90000) {
          setBackendStatus("error");
          return;
        }

        setBackendStatus("checking");

        retryTimer = setTimeout(checkHealth, 5000);
      } finally {
        clearTimeout(requestTimeout);
      }
    }

    setBackendStatus("checking");
    checkHealth();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(requestTimeout);
    };
  }, [retryVersion]);

  // Fetch the authenticated user's information.
  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        logout();
        return;
      }

      try {
        const response = await fetch(`${API_URL}/protected`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          logout();
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await response.json();

        if (!cancelled) {
          setUser(userData);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching user profile:", error);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [logout]);

  const clearCompany = () => {
    setSelectedCompany("");
  };

  const handleResumeChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please upload a PDF file only.");
      e.target.value = "";
      setSelectedResume(null);
      return;
    }

    setSelectedResume(file);
  };

  const handleStartInterview = async () => {
    if (isStartingInterview) return;

    if (backendStatus !== "ready") {
      alert("The backend is not ready yet. Please wait and try again.");
      return;
    }

    if (!selectedResume) {
      alert("Please upload your resume first.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      alert("Your session has expired. Please log in again.");
      logout();
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedResume);
    formData.append("interview_type", selectedInterviewType);
    formData.append("interview_template", selectedCompany || "General");

    setIsStartingInterview(true);

    try {
      const response = await fetch(`${API_URL}/interview/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to start the interview."
        );
      }

      if (!data.interview_id) {
        throw new Error("The backend did not return an interview ID.");
      }

      navigate("/interview", {
        state: { interviewId: data.interview_id },
      });
    } catch (error) {
      console.error("Error starting interview:", error);

      alert(
        error.message ||
          "Unable to connect to the backend. Please try again."
      );

      // Check the backend again if the request failed.
      setRetryVersion((version) => version + 1);
    } finally {
      setIsStartingInterview(false);
    }
  };

  return (
    <div
      className={`flex flex-col md:flex-row min-h-screen md:h-screen md:overflow-hidden transition-colors ${
        isDarkMode ? "bg-zinc-950" : "bg-zinc-50"
      }`}
    >
      <SideBar
        companies={companies}
        selectedCompany={selectedCompany}
        setSelectedCompany={setSelectedCompany}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        user={user}
      />

      <main className="flex-1">
        <div className="hidden md:flex h-13 px-4 sm:px-6 items-center justify-end">
          <ThemeToggle />
        </div>

        <div className="px-5 sm:px-6">
          {/* Backend connection status */}
          {backendStatus !== "ready" && (
            <div
              role="status"
              aria-live="polite"
              className={`mx-auto mb-4 max-w-2xl rounded-xl border px-4 py-3 ${
                isDarkMode
                  ? "border-zinc-700 bg-zinc-900 text-zinc-200"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {backendStatus === "checking"
                      ? "Preparing your interview environment..."
                      : "Unable to connect to the backend"}
                  </p>

                  <p className="mt-1 text-sm opacity-75">
                    {backendStatus === "checking"
                      ? "The server may be waking up. This can take a little while."
                      : "Check your connection and try again."}
                  </p>
                </div>

                {backendStatus === "error" && (
                  <button
                    type="button"
                    onClick={() =>
                      setRetryVersion((version) => version + 1)
                    }
                    className="self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center mt-8 sm:mt-1 md:-mt-3 pb-8 sm:pb-10">
            <h2
              className={`text-3xl sm:text-4xl font-bold text-center max-w-sm sm:max-w-none ${
                isDarkMode ? "text-white" : "text-zinc-900"
              }`}
            >
              Intelligence<span className="text-orange-500">View</span>
            </h2>

            <p
              className={`mt-2 text-center ${
                isDarkMode ? "text-zinc-400" : "text-zinc-500"
              }`}
            >
              Practice. Improve. Get Hired.
            </p>

            <InterviewTemplate
              selectedCompany={selectedCompany}
              clearCompany={clearCompany}
              isDarkMode={isDarkMode}
            />

            <ResumeUpload
              selectedResume={selectedResume}
              handleResumeChange={handleResumeChange}
              fileInputRef={fileInputRef}
              isDarkMode={isDarkMode}
            />

            <InterviewTypeSelect
              selectedInterviewType={selectedInterviewType}
              setSelectedInterviewType={setSelectedInterviewType}
              isDarkMode={isDarkMode}
            />

            <button
              type="button"
              onClick={handleStartInterview}
              disabled={
                isStartingInterview || backendStatus !== "ready"
              }
              className="mt-6 sm:mt-8 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isStartingInterview
                ? "Starting Interview..."
                : backendStatus === "checking"
                  ? "Connecting to Backend..."
                  : backendStatus === "error"
                    ? "Backend Unavailable"
                    : "Start Interview"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
