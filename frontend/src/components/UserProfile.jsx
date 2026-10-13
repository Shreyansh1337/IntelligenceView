import { LogOut, CircleUser } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function UserProfile({ user, isDarkMode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <div className="px-4 pb-4">
      <Link
        to="/dashboard"
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isDarkMode
            ? "text-zinc-200 hover:bg-zinc-800"
            : "text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        <CircleUser size={18} />
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">
          {user?.name || "Loading profile..."}
        </span>
        {user?.email && (
          <span
            className={`block truncate text-xs ${
              isDarkMode ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {user.email}
          </span>
        )}
      </div>
    </Link>


<button
  type="button"
  onClick={handleLogout}
  className={`mt-1 flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isDarkMode
      ? "text-red-400 hover:bg-zinc-800 hover:text-red-300"
      : "text-red-600 hover:bg-zinc-100 hover:text-red-700"
  }`}
>
        <LogOut size={18} />
        <span>Log out</span>
      </button>
    </div>
  );
}

export default UserProfile;