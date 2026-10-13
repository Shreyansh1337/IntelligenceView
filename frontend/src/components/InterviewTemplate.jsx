import { X } from "lucide-react";

function InterviewTemplate({
  selectedCompany,
  clearCompany,
  isDarkMode
}) {
  return (
    <div className="mt-2 w-full max-w-xl">
      <div
        className={`border rounded-xl px-4 sm:px-5 py-3 transition-colors ${
          isDarkMode
            ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-300 bg-white"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium ${
              isDarkMode ? "text-zinc-300" : "text-zinc-700"
            }`}
          >
            Interview Template:
          </span>

          {selectedCompany && (
            <>
              <span
                className={`text-sm font-semibold ${
                  isDarkMode ? "text-white" : "text-zinc-900"
                }`}
              >
                {selectedCompany}
              </span>

              <button
                type="button"
                onClick={clearCompany}
                className={`ml-auto p-1 rounded-md transition-colors ${
                  isDarkMode
                    ? "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
                aria-label="Clear selected company"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewTemplate;