
const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

const API_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://intelligenceview.onrender.com";

const signupForm = document.querySelector(".sign-up-form");
const loginForm = document.querySelector(".sign-in-form");

const signupButton = signupForm.querySelector('input[type="submit"]');
const loginButton = loginForm.querySelector('input[type="submit"]');

const signupMessage = document.querySelector("#signup-message");
const loginMessage = document.querySelector("#login-message");

sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
});

let backendReady = false;
let checkingBackend = false;

async function checkBackend() {
    if (checkingBackend) return;
    checkingBackend = true;
    backendReady = false;

    loginButton.disabled = true;
    signupButton.disabled = true;

    loginMessage.textContent = "Connecting to server...";
    signupMessage.textContent = "Connecting to server...";

    const deadline = Date.now() + 90000;

    while (Date.now() < deadline) {
        try {
            const response = await fetch(`${API_URL}/health`, {
                method: "GET",
                signal: AbortSignal.timeout(10000)
            });

            if (response.ok) {
                backendReady = true;
                loginButton.disabled = false;
                signupButton.disabled = false;

                loginMessage.textContent = "Server connected. You can sign in.";
                signupMessage.textContent = "Server connected. You can sign up.";
                checkingBackend = false;
                return;
            }
        } catch (error) {
            // The Render service may be waking up.
        }

        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    loginMessage.textContent = "Server is taking longer than expected. Please retry.";
    signupMessage.textContent = "Server is taking longer than expected. Please retry.";

    checkingBackend = false;
}

// Signup
signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!backendReady) {
        signupMessage.textContent = "Server is not ready. Please wait or retry.";
        return;
    }

    const name = document.querySelector("#signup-name").value.trim();
    const email = document.querySelector("#signup-email").value.trim();
    const password = document.querySelector("#signup-password").value;

    signupButton.disabled = true;
    signupMessage.textContent = "Creating account...";

    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
            signal: AbortSignal.timeout(30000)
        });

        const data = await response.json();

        if (response.ok) {
            signupMessage.textContent = data.message || "Account created successfully!";
        } else {
            signupMessage.textContent =
                typeof data.detail === "string"
                    ? data.detail
                    : "Unable to create account. Please check your details.";
        }
    } catch (error) {
        signupMessage.textContent =
            "Could not reach the server. Please check your connection and retry.";
    } finally {
        signupButton.disabled = !backendReady;
    }
});

// Login
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!backendReady) {
        loginMessage.textContent = "Server is not ready. Please wait or retry.";
        return;
    }

    const email = document.querySelector("#login-email").value.trim();
    const password = document.querySelector("#login-password").value;

    loginButton.disabled = true;
    loginMessage.textContent = "Signing in...";

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
            signal: AbortSignal.timeout(30000)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("access_token", data.access_token);
            loginMessage.textContent = "Login successful!";
        } else {
            loginMessage.textContent =
                typeof data.detail === "string"
                    ? data.detail
                    : "Login failed. Please check your credentials.";
        }
    } catch (error) {
        loginMessage.textContent =
            "Could not reach the server. Please check your connection and retry.";
    } finally {
        loginButton.disabled = !backendReady;
    }
});

// Existing protected endpoint helper
async function getCurrentUser() {
    const token = localStorage.getItem("access_token");

    if (!token) {
        console.warn("No access token found.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/protected`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(15000)
        });

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Unable to fetch current user:", error);
    }
}

// Check the backend as soon as the auth page opens.
checkBackend();
