const signinWithGoogle = () => {
    window.location.href = "http://localhost:4000/api/v1/Oauth2/google"
}

const button = document.getElementById("signin")
button.addEventListener("click", signinWithGoogle);