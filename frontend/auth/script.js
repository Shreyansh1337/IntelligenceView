const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener('click', () =>{
    container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener('click', () =>{
    container.classList.remove("sign-up-mode");
});
const signupForm = document.querySelector(".sign-up-form");

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.querySelector("#signup-name").value;
    const email = document.querySelector("#signup-email").value;
    const password = document.querySelector("#signup-password").value;

    const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            name: name,
            email: email,
            password: password
        })
    });

    const data = await response.json();

    const message = document.querySelector("#signup-message");

    if (response.ok) {
        message.textContent = data.message;
    } else {
        message.textContent = data.detail;
    }
});
const loginForm = document.querySelector(".sign-in-form");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.querySelector("#login-email").value;
    const password = document.querySelector("#login-password").value;

    const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    const message = document.querySelector("#login-message");

    if (response.ok) {
        localStorage.setItem("access_token", data.access_token);
        message.textContent = "Login successful!";
    } else {
        message.textContent = data.detail;
    }
});
async function getCurrentUser() {
    const token = localStorage.getItem("access_token");

    const response = await fetch("http://127.0.0.1:8000/protected", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    console.log(data);
}

