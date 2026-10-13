import { ChevronDown } from "lucide-react";

function InterviewTypeSelect({
  selectedInterviewType,
  setSelectedInterviewType,
  isDarkMode
}) {
  return (
    <div className="mt-1 w-full max-w-xl">
      <label
        htmlFor="interview-type"
        className={`block text-sm font-medium mb-2 ${
          isDarkMode ? "text-zinc-300" : "text-zinc-700"
        }`}
      >
        Interview Type
      </label>

      <div className="relative">
        <select
          id="interview-type"
          value={selectedInterviewType}
          onChange={(e) => setSelectedInterviewType(e.target.value)}
          className={`w-full appearance-none border rounded-xl px-4 py-3.5 sm:py-3 pr-10 text-sm outline-none transition-colors ${
            isDarkMode
              ? "border-zinc-700 bg-zinc-900 text-white focus:border-zinc-500"
              : "border-zinc-300 bg-white text-zinc-900 focus:border-zinc-500"
          }`}
        >
          <option>Technical Interview</option>
          <option>HR Interview</option>
          <option>Behavioral Interview</option>
          <option>Managerial Interview</option>
          <option>Non-technical Interview</option>
        </select>

        <ChevronDown
          size={18}
          className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${
            isDarkMode ? "text-zinc-400" : "text-zinc-500"
          }`}
        />
      </div>
    </div>
  );
}

export default InterviewTypeSelect;