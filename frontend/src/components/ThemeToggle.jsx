import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext.jsx";

function ThemeToggle() {
  const { isDarkMode, setIsDarkMode } = useTheme();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 h-2 rounded-lg transition-colors ${
        isDarkMode
          ? "text-zinc-300 hover:bg-zinc-800"
          : "text-zinc-700 hover:bg-zinc-100"
      }`}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun size={20} className="text-yellow-400" />
      ) : (
        <Moon size={20} className="text-zinc-700" />
      )}
    </button>
  );
}

export default ThemeToggle;
