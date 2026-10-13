import SideBar from "./SideBar.jsx";
import ThemeToggle from "./ThemeToggle.jsx";
import InterviewTemplate from "./InterviewTemplate.jsx";
import ResumeUpload from "./ResumeUpload.jsx";
import InterviewTypeSelect from "./InterviewTypeSelect.jsx";

import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

function AppLayout() {
const [user, setUser] = useState(null);
const [isStartingInterview, setIsStartingInterview] = useState(false);

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
{
name: "Google",
image: "/assets/Google.png",
},
{
name: "Microsoft",
image: "/assets/Microsoft.png",
},
{
name: "Amazon",
image: "/assets/Amazon.png",
},
{
name: "Meta",
image: "/assets/Meta.png",
},
];

useEffect(() => {
async function fetchUser() {
const token = localStorage.getItem("access_token");


  if (!token) {
    logout();
    return;
  }

  try {
    const response = await fetch(
      "http://127.0.0.1:8000/protected",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      logout();
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }

    const userData = await response.json();
    setUser(userData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

fetchUser();


}, [logout]);

const clearCompany = () => {
setSelectedCompany("");
};

const handleResumeChange = (e) => {
const file = e.target.files[0];


if (file) {
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
}


};

const handleStartInterview = async () => {
if (isStartingInterview) {
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
formData.append(
  "interview_template",
  selectedCompany || "General"
);

setIsStartingInterview(true);

try {
  const response = await fetch(
    "http://127.0.0.1:8000/interview/start",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

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
    throw new Error(
      "The backend did not return an interview ID."
    );
  }

  navigate("/interview", {
    state: {
      interviewId: data.interview_id,
    },
  });
} catch (error) {
  console.error("Error starting interview:", error);

  alert(
    error.message ||
      "Unable to connect to the backend. Please try again."
  );
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
{/* Sidebar */} <SideBar
     companies={companies}
     selectedCompany={selectedCompany}
     setSelectedCompany={setSelectedCompany}
     isDarkMode={isDarkMode}
     setIsDarkMode={setIsDarkMode}
     user={user}
   />


  {/* Main Content */}
  <main className="flex-1">
    {/* Top Bar */}
    <div className="hidden md:flex h-13 px-4 sm:px-6 items-center justify-end">
      <ThemeToggle />
    </div>

    {/* Main Content Area */}
    <div className="px-5 sm:px-6">
      {/* Hero */}
      <div className="flex flex-col items-center mt-8 sm:mt-1 md:-mt-3 pb-8 sm:pb-10">
        <h2
          className={`text-3xl sm:text-4xl font-bold text-center max-w-sm sm:max-w-none ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}
        >
          Intelligence
          <span className="text-orange-500">View</span>
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

        {/* Start Interview */}
        <button
          type="button"
          onClick={handleStartInterview}
          disabled={isStartingInterview}
          className="mt-6 sm:mt-8 w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStartingInterview
            ? "Starting Interview..."
            : "Start Interview"}
        </button>
      </div>
    </div>
  </main>
</div>

);
}

export default AppLayout;
