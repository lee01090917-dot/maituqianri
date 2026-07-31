import {
    auth,
    provider,
    signInWithPopup
} from "./firebase.js";

const loginButton = document.getElementById("google-login");

loginButton.addEventListener("click", async () => {

    try {

        const result = await signInWithPopup(
            auth,
            provider
        );

        console.log(result.user);

        alert(`歡迎 ${result.user.displayName}`);

    } catch (error) {

        console.error(error);

        alert("登入失敗");

    }

});
