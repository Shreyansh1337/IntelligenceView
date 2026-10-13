import { CloudUpload, FileUser } from "lucide-react";

function ResumeUpload({
  selectedResume,
  handleResumeChange,
  fileInputRef,
  isDarkMode,
}) {
  return (
    <div className="mt-5 w-full max-w-xl">
      <div
        className={`border rounded-xl p-4 sm:p-8 text-center transition-colors ${
          isDarkMode
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
      >
        <CloudUpload
          size={40}
          strokeWidth={1.5}
          className={`mx-auto sm:w-12 sm:h-12 ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}
        />

        <h3
          className={`mt-4 text-lg font-semibold ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}
        >
          Upload Your Resume
        </h3>

        <p
          className={`mt-2 text-sm ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}
        >
          PDF • We'll analyze it for your interview
        </p>

<div className="mt-2 min-h-5">
  {selectedResume && (
    <p
      className={`text-sm ${
        isDarkMode ? "text-zinc-300" : "text-zinc-700"
      }`}
    >
      Selected: {selectedResume.name}
    </p>
  )}
</div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleResumeChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <FileUser size={17} />
          {selectedResume ? "Change Resume" : "Upload Resume"}
        </button>
      </div>
    </div>
  );
}

export default ResumeUpload;
