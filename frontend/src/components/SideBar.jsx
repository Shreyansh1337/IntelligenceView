
import { LayoutDashboard, MessageSquare } from "lucide-react";
import ThemeToggle from "./ThemeToggle.jsx";
import UserProfile from "./UserProfile.jsx";
import { useNavigate, useLocation } from "react-router-dom";

function SideBar({
  companies,
  selectedCompany,
  setSelectedCompany,
  isDarkMode,
  setIsDarkMode,
  user,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === "/dashboard";

  return (
    <aside
      className={`w-full md:w-64 md:min-h-screen md:flex md:flex-col transition-colors ${
        isDarkMode ? "bg-zinc-900" : "bg-white"
      }`}
    >
      {/* Brand */}
      <div className="h-14 md:h-16 px-4 flex items-center">
        <h1
          className={`text-xl font-bold cursor-pointer ${
            isDarkMode ? "text-white" : "text-zinc-900"
          }`}
          onClick={() => navigate("/")}
        >
          Intelligence
          <span className="text-orange-500">View</span>
        </h1>

        <div className="ml-auto md:hidden">
          <ThemeToggle
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
          />
        </div>
      </div>

      <nav className="px-4 mt-3 md:mt-4">
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isDashboard
              ? isDarkMode
                ? "bg-zinc-800 text-white"
                : "bg-zinc-100 text-zinc-900"
              : isDarkMode
                ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          }`}
        >
          <LayoutDashboard
            size={18}
            className={
              isDarkMode ? "text-zinc-300" : "text-zinc-700"
            }
          />
          Dashboard
        </button>

        {/* Interview Templates */}
        <div className="mt-4 md:mt-6">
          <div
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium ${
              isDarkMode ? "text-zinc-200" : "text-zinc-900"
            }`}
          >
            <MessageSquare
              size={18}
              className={
                isDarkMode ? "text-zinc-300" : "text-zinc-700"
              }
            />
            Interview Templates
          </div>

          {/* Companies */}
          <div className="mt-2 grid grid-cols-2 gap-2 md:block">
            {companies.map((company) => {
              const isSelected =
                selectedCompany === company.name;

              return (
                <button
                  key={company.name}
                  type="button"
                  onClick={() =>
                    setSelectedCompany(company.name)
                  }
                  className={`flex items-center gap-2 w-full text-left px-3 py-2.5 md:py-2 text-sm rounded-lg transition-colors ${
                    isSelected
                      ? isDarkMode
                        ? "bg-zinc-800 text-white font-medium"
                        : "bg-zinc-100 text-zinc-900 font-medium"
                      : isDarkMode
                        ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
                >
                  <img
                    src={company.image}
                    alt={`${company.name} logo`}
                    className="w-5 h-5 object-contain"
                  />
                  <span>{company.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="mt-auto">
        <UserProfile
          user={user}
          isDarkMode={isDarkMode}
        />
      </div>
    </aside>
  );
}

export default SideBar;
