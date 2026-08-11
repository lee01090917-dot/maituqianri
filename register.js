import {
    auth,
    db
} from "./firebase.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==================================================
// DOM
// ==================================================

const saveButton =
    document.getElementById("save");

const referrerArea =
    document.getElementById("referrer-area");

const referrerAccount =
    document.getElementById("referrerAccount");

const otherSourceArea =
    document.getElementById("other-source-area");

const otherSource =
    document.getElementById("otherSource");


// ==================================================
// 加入來源切換
// ==================================================

const joinSourceRadios =
    document.querySelectorAll(
        'input[name="joinSource"]'
    );


joinSourceRadios.forEach(radio => {

    radio.addEventListener(
        "change",
        () => {

            const value =
                radio.value;


            // ------------------------------
            // 朋友推薦
            // ------------------------------

            if (
                value === "朋友推薦"
            ) {

                referrerArea.style.display =
                    "block";

                otherSourceArea.style.display =
                    "none";

                otherSource.value =
                    "";

                setTimeout(() => {

                    referrerAccount?.focus();

                }, 50);

            }


            // ------------------------------
            // 其他
            // ------------------------------

            else if (
                value === "其他"
            ) {

                referrerArea.style.display =
                    "none";

                otherSourceArea.style.display =
                    "block";

                referrerAccount.value =
                    "";

                setTimeout(() => {

                    otherSource?.focus();

                }, 50);

            }


            // ------------------------------
            // Threads / Facebook
            // ------------------------------

            else {

                referrerArea.style.display =
                    "none";

                otherSourceArea.style.display =
                    "none";

                referrerAccount.value =
                    "";

                otherSource.value =
                    "";

            }

        }
    );

});


// ==================================================
// 登入狀態
// ==================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            location.href =
                "login.html";

            return;

        }


        // ==================================================
        // 送出申請
        // ==================================================

        saveButton.addEventListener(
            "click",
            async () => {

                // ------------------------------
                // 防止重複送出
                // ------------------------------

                if (
                    saveButton.disabled
                ) {

                    return;

                }


                // ------------------------------
                // 基本資料
                // ------------------------------

                const nickname =
                    document
                        .getElementById(
                            "nickname"
                        )
                        .value
                        .trim();


                const platform =
                    document
                        .getElementById(
                            "platform"
                        )
                        .value;


                const account =
                    document
                        .getElementById(
                            "account"
                        )
                        .value
                        .trim();


                // ------------------------------
                // 加入來源
                // ------------------------------

                const selectedSource =
                    document.querySelector(
                        'input[name="joinSource"]:checked'
                    );


                const joinSource =
                    selectedSource
                        ? selectedSource.value
                        : "";


                // ------------------------------
                // 朋友推薦
                // ------------------------------

                const enteredReferrerAccount =
                    referrerAccount
                        ? referrerAccount.value.trim()
                        : "";


                // ------------------------------
                // 其他
                // ------------------------------

                const enteredOtherSource =
                    otherSource
                        ? otherSource.value.trim()
                        : "";


                // ==================================================
                // 基本資料檢查
                // ==================================================

                if (
                    !nickname ||
                    !platform ||
                    !account
                ) {

                    alert(
                        "請填寫完整的會員資料！"
                    );

                    return;

                }


                // ==================================================
                // 加入來源檢查
                // ==================================================

                if (
                    !joinSource
                ) {

                    alert(
                        "請選擇加入來源！"
                    );

                    return;

                }


                // ==================================================
                // 朋友推薦檢查
                // ==================================================

                if (
                    joinSource ===
                    "朋友推薦" &&
                    !enteredReferrerAccount
                ) {

                    alert(
                        "請填寫推薦人的社群帳號！"
                    );

                    referrerAccount?.focus();

                    return;

                }


                // ==================================================
                // 其他檢查
                // ==================================================

                if (
                    joinSource ===
                    "其他" &&
                    !enteredOtherSource
                ) {

                    alert(
                        "請填寫來源、帳號或其他備註！"
                    );

                    otherSource?.focus();

                    return;

                }


                // ==================================================
                // 儲存中
                // ==================================================

                saveButton.disabled =
                    true;

                saveButton.textContent =
                    "送出中…";


                try {

                    // ==================================================
                    // Firebase 資料
                    // ==================================================

                    await setDoc(

                        doc(
                            db,
                            "members",
                            user.uid
                        ),

                        {

                            // ------------------------------
                            // 帳號基本資料
                            // ------------------------------

                            email:
                                user.email,

                            nickname:
                                nickname,

                            socialPlatform:
                                platform,

                            socialAccount:
                                account,


                            // ------------------------------
                            // 會員編號
                            // ------------------------------

                            memberNo:
                                "",


                            // ------------------------------
                            // 身分
                            // ------------------------------

                            role:
                                "會員",


                            // ------------------------------
                            // 狀態
                            // ------------------------------

                            status:
                                "待審核",


                            // ------------------------------
                            // 暱稱紀錄
                            // ------------------------------

                            previousNicknames:
                                [nickname],


                            // ------------------------------
                            // 加入來源
                            // ------------------------------

                            joinSource:
                                joinSource,


                            // ------------------------------
                            // 朋友推薦
                            // ------------------------------

                            referrerAccount:
                                joinSource ===
                                "朋友推薦"
                                    ? enteredReferrerAccount
                                    : "",


                            // ------------------------------
                            // 其他來源
                            // ------------------------------

                            otherSource:
                                joinSource ===
                                "其他"
                                    ? enteredOtherSource
                                    : "",


                            // ------------------------------
                            // 推薦人會員
                            // ------------------------------
                            // 這裡先留空。
                            // 後台之後會自動比對，
                            // 再讓管理員確認。

                            referrerMemberId:
                                "",

                            referrerMemberNo:
                                "",


                            // ------------------------------
                            // 管理員備註
                            // ------------------------------

                            adminNote:
                                ""

                        }

                    );


                    // ==================================================
                    // 送出成功
                    // ==================================================

                    location.href =
                        "pending.html";


                } catch (error) {

                    console.error(
                        "會員申請失敗：",
                        error
                    );


                    alert(
                        "送出申請失敗，請稍後再試。"
                    );


                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        "送出申請";

                }

            }
        );

    }
);
