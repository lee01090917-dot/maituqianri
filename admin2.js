import {
    auth,
    db
} from "./firebase.js";

import {
    collection,
    getDocs,
    getDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ==================================================
// DOM
// ==================================================

const memberList =
    document.querySelector(".member-list");

const profileCard =
    document.querySelector(".profile-card");

const recentMembers =
    document.getElementById("recentMembers");

const memberCount =
    document.getElementById("memberCount");

const pendingCount =
    document.getElementById("pendingCount");

const lineCount =
    document.getElementById("lineCount");

const todayCount =
    document.getElementById("todayCount");

const memberSearch =
    document.getElementById("memberSearch");

const pendingStatCard =
    document.getElementById(
        "pendingStatCard"
    );
// ==================================================
// ATEEZ 成員
// ==================================================

const ateezMembers = [
    "星化",
    "弘中",
    "潤浩",
    "呂尚",
    "傘尼",
    "旼琦",
    "友榮",
    "鍾浩"
];


// ==================================================
// 全域資料
// ==================================================

let members = [];

let currentMember = null;

let editingMember = false;


// ==================================================
// 權限檢查
// ==================================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    try {

        const memberRef =
            doc(
                db,
                "members",
                user.uid
            );

        const memberSnap =
            await getDoc(
                memberRef
            );


        if (!memberSnap.exists()) {

            alert("找不到會員資料");

            location.href = "app.html";

            return;

        }


        if (
            memberSnap.data().role !== "管理員"
        ) {

            alert("沒有權限");

            location.href = "app.html";

            return;

        }


        await loadMembers();


    } catch (error) {

        console.error(
            "權限檢查失敗：",
            error
        );

    }

});


// ==================================================
// 載入會員
// ==================================================

async function loadMembers() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "members"
                )
            );


        members = [];


        snapshot.forEach(memberDoc => {

            members.push({

                id: memberDoc.id,

                ...memberDoc.data()

            });

        });


        renderDashboard();

        renderMemberList();

        renderRecentMembers();


    } catch (error) {

        console.error(
            "會員資料載入失敗：",
            error
        );

    }

}


// ==================================================
// Dashboard 統計
// ==================================================

function renderDashboard() {

    const total =
        members.length;

    let pending = 0;

    let line = 0;

    let today = 0;


    const todayString =
        new Date()
            .toLocaleDateString(
                "sv-SE"
            );


    members.forEach(member => {


        if (
            member.status !== "已通過"
        ) {

            pending++;

        }


        if (
            member.officialLine
        ) {

            line++;

        }


        if (
            member.joinDate
        ) {

            let joinDate = "";


            if (
                member.joinDate &&
                typeof member.joinDate.toDate === "function"
            ) {

                joinDate =
                    member.joinDate
                        .toDate()
                        .toLocaleDateString(
                            "sv-SE"
                        );

            } else {

                joinDate =
                    String(
                        member.joinDate
                    )
                        .slice(
                            0,
                            10
                        );

            }


            if (
                joinDate === todayString
            ) {

                today++;

            }

        }

    });


    if (memberCount) {

        memberCount.textContent =
            total;

    }


    if (pendingCount) {

        pendingCount.textContent =
            pending;

    }


    if (lineCount) {

        lineCount.textContent =
            line;

    }


    if (todayCount) {

        todayCount.textContent =
            today;

    }

}


// ==================================================
// 左側會員列表
// ==================================================

function renderMemberList(
    keyword = "",
    status = "",
    favorite = ""
) {

    if (!memberList) return;


    memberList.innerHTML = "";


    const searchKeyword =
        String(keyword)
            .trim()
            .toLowerCase();


    const list =
        members.filter(member => {


            // ==============================
            // 搜尋
            // ==============================

            const text = [

                member.memberNo || "",

                member.nickname || "",

                member.socialPlatform || "",

                member.socialAccount || "",

                member.favoriteMember || "",

                member.email || ""

            ]
                .join(" ")
                .toLowerCase();


            const matchSearch =
                !searchKeyword ||
                text.includes(searchKeyword);


            // ==============================
            // 會員狀態
            // ==============================

            const matchStatus =
                !status ||
                member.status === status;


            // ==============================
            // 主擔
            // ==============================

            const matchFavorite =
                !favorite ||
                member.favoriteMember === favorite;


            return (
                matchSearch &&
                matchStatus &&
                matchFavorite
            );

        });


    // ==============================
    // 沒有符合會員
    // ==============================

    if (list.length === 0) {

        memberList.innerHTML = `

            <div class="empty">

                找不到符合條件的會員

            </div>

        `;

        return;

    }


    // ==============================
    // 產生會員卡片
    // ==============================

    list.forEach(member => {


        const card =
            document.createElement("div");


        card.className =
            "member-card";


        card.dataset.id =
            member.id;


        // ==============================
        // 狀態樣式
        // ==============================

        let statusClass =
            "pending";


        if (
            member.status === "已通過"
        ) {

            statusClass =
                "approved";

        } else if (
            member.status === "已拒絕"
        ) {

            statusClass =
                "rejected";

        } else if (
            member.status === "暫停"
        ) {

            statusClass =
                "hold";

        }


        card.innerHTML = `

            <div class="member-top">

                <strong>

                    ${escapeHTML(
                        member.memberNo ||
                        "待發號"
                    )}

                </strong>


                <span
                    class="status ${statusClass}">

                    ${escapeHTML(
                        member.status ||
                        "-"
                    )}

                </span>

            </div>


            <div class="member-name">

                ${escapeHTML(
                    member.nickname ||
                    "-"
                )}

            </div>


            <div class="member-info">

                ❤️ ${escapeHTML(
                    member.favoriteMember ||
                    "-"
                )}

            </div>


            <div class="member-info">

                ${escapeHTML(
                    member.socialPlatform ||
                    "-"
                )}

            </div>

        `;


        memberList.appendChild(
            card
        );

    });


    bindMemberClick();

}


// ==================================================
// 會員點擊
// ==================================================

function bindMemberClick() {

    const cards =
        document.querySelectorAll(
            ".member-card"
        );


    cards.forEach(card => {

        card.onclick = () => {


            cards.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });


            card.classList.add(
                "active"
            );


            currentMember =
                members.find(
                    member =>
                        member.id ===
                        card.dataset.id
                );


            editingMember = false;


            renderProfile();

        };

    });


    if (
        cards.length > 0 &&
        !currentMember
    ) {

        cards[0].click();

    }

}


// ==================================================
// 會員資料
// ==================================================

function renderProfile() {

    if (!profileCard) return;


    if (!currentMember) {

        profileCard.innerHTML = `

            <div class="empty">

                請先選擇一位會員

            </div>

        `;

        return;

    }


    if (editingMember) {

        renderEditProfile();

        return;

    }


    // ==================================================
    // 副擔
    // ==================================================

    let subFavorites = "-";


    if (
        Array.isArray(
            currentMember.subFavoriteMembers
        )
    ) {

        subFavorites =
            currentMember
                .subFavoriteMembers
                .join("、") || "-";

    }


    // ==================================================
    // 推薦人
    // ==================================================

    let referrerDisplay = "-";


    if (
        currentMember.referrerMemberNo
    ) {

        referrerDisplay =
            currentMember.referrerMemberNo;

    }
    else if (
        currentMember.referrerAccount
    ) {

        referrerDisplay =
            currentMember.referrerAccount;

    }


    // ==================================================
    // 加入來源
    // ==================================================

    let joinSourceDisplay =
        currentMember.joinSource || "-";


    // ==================================================
    // 會員狀態
    // ==================================================

    let statusClass = "status-default";


  if (
    currentMember.status ===
    "已通過"
) {
    statusClass =
        "status-active";
}
else if (
    currentMember.status ===
    "待審核"
) {
    statusClass =
        "status-pending";
}
else if (
    currentMember.status ===
    "暫停"
) {
    statusClass =
        "status-disabled";
}
else if (
    currentMember.status ===
    "已拒絕"
) {
    statusClass =
        "status-blacklist";
}


    profileCard.innerHTML = `

        <!-- ==========================================
             會員標題
        ========================================== -->

        <div class="profile-header">

            <div class="profile-person">

                <div class="profile-avatar">

                    👤

                </div>


                <div class="profile-title">

                    <h2>

                        ${escapeHTML(
                            currentMember.nickname ||
                            "-"
                        )}

                    </h2>


                    <p>

                        ${escapeHTML(
                            currentMember.memberNo ||
                            "待發號"
                        )}

                    </p>

                </div>

            </div>


            <div class="profile-actions">

                <button
                    id="editMember"
                    type="button">

                    ✏️ 編輯

                </button>

            </div>

        </div>


        <!-- ==========================================
             基本資料
        ========================================== -->

        <div class="profile-section-title">

            👤 基本資料

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    🆔 會員編號
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.memberNo ||
                        "待發號"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    📧 Email
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.email ||
                        "-"
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             社群資料
        ========================================== -->

        <div class="profile-section-title">

            🔗 社群資料

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    📱 社群平台
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.socialPlatform ||
                        "-"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    🔗 社群帳號
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.socialAccount ||
                        "-"
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             ATEEZ
        ========================================== -->

        <div class="profile-section-title">

            ❤️ ATEEZ 喜好

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    ❤️ 主擔
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.favoriteMember ||
                        "-"
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    💛 副擔
                </small>

                <strong>

                    ${escapeHTML(
                        subFavorites
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             加入資訊
        ========================================== -->

        <div class="profile-section-title">

            📍 加入資訊

        </div>


        <div class="profile-grid">


            <div class="profile-box">

                <small>
                    📍 加入來源
                </small>

                <strong>

                    ${escapeHTML(
                        joinSourceDisplay
                    )}

                </strong>

            </div>


            <div class="profile-box">

                <small>
                    👥 推薦人
                </small>

                <strong>

                    ${escapeHTML(
                        referrerDisplay
                    )}

                </strong>

            </div>


        </div>


        <!-- ==========================================
             會員狀態
        ========================================== -->

        <div class="profile-section-title">

            🛡️ 會員狀態

        </div>


        <div class="profile-grid">


           <div class="profile-box">

    <div class="profile-box-title">

        <small>
            🏷️ 會員狀態
        </small>

        <button
            type="button"
            class="quick-edit-btn"
            id="quickEditStatus">

            ✏️

        </button>

    </div>

    <strong
        class="${statusClass}"
        id="profileStatusText">

        ${escapeHTML(
            currentMember.status ||
            "-"
        )}

    </strong>

</div>


            <div class="profile-box">

                <small>
                    🟢 官方 LINE
                </small>

                <strong>

                    ${
                        currentMember.officialLine
                            ? "已加入"
                            : "未加入"
                    }

                </strong>

            </div>


        </div>


        <!-- ==========================================
             管理
        ========================================== -->

        <div class="profile-section-title">

            📝 管理資訊

        </div>


        <div class="profile-grid">


            <div class="profile-box profile-box-wide">

                <small>
                    📝 管理員備註
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.adminNote ||
                        "-"
                    )}

                </strong>

            </div>


        </div>

    `;


    // ==================================================
    // 編輯按鈕
    // ==================================================

    document
        .getElementById(
            "editMember"
        )
        ?.addEventListener(
            "click",
            () => {

                editingMember = true;

                renderProfile();

            }
        );

}

// ==================================================
// 編輯會員資料
// ==================================================

function renderEditProfile() {

    const currentSubFavorites =
        Array.isArray(
            currentMember.subFavoriteMembers
        )
            ? currentMember.subFavoriteMembers
            : [];


    // ==========================================
    // 主擔選項
    // ==========================================

    const favoriteOptions =
        ateezMembers
            .map(member => `

                <label class="platform-option">

                    <input
                        type="radio"
                        name="favoriteMember"
                        value="${escapeAttribute(member)}"
                        ${
                            currentMember.favoriteMember === member
                                ? "checked"
                                : ""
                        }
                    >

                    <span>

                        ${escapeHTML(member)}

                    </span>

                </label>

            `)
            .join("");


    // ==========================================
    // 副擔選項
    // ==========================================

    const subFavoriteOptions =
        ateezMembers
            .map(member => `

                <label class="member-multi-option">

                    <input
                        type="checkbox"
                        name="subFavoriteMember"
                        value="${escapeAttribute(member)}"
                        ${
                            currentSubFavorites.includes(member)
                                ? "checked"
                                : ""
                        }
                    >

                    <span>

                        ${escapeHTML(member)}

                    </span>

                </label>

            `)
            .join("");


    profileCard.innerHTML = `

        <div class="profile-header">

            <div class="profile-person">

                <div class="profile-avatar">

                    ✏️

                </div>


                <div class="profile-title">

                    <h2>

                        編輯會員

                    </h2>


                    <p>

                        ${escapeHTML(
                            currentMember.memberNo ||
                            "待發號"
                        )}

                    </p>

                </div>

            </div>


            <div class="profile-actions">

                <button
                    id="cancelEditMember"
                    type="button">

                    取消

                </button>


                <button
                    id="saveMember"
                    type="button">

                    💾 儲存

                </button>

            </div>

        </div>


        <div class="profile-grid member-edit-grid">

            <!-- MQ 編號 -->

            <div class="profile-box">

                <small>
                    🆔 MQ 編號
                </small>

                <input
                    class="member-edit-input"
                    id="editMemberNo"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.memberNo || ""
                    )}"
                >

            </div>


            <!-- 暱稱 -->

            <div class="profile-box">

                <small>
                    👤 暱稱
                </small>

                <input
                    class="member-edit-input"
                    id="editNickname"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.nickname || ""
                    )}"
                >

            </div>


            <!-- 社群平台 -->

            <div class="profile-box">

                <small>
                    📱 社群平台
                </small>

                <div class="platform-options">

                    <label class="platform-option">

                        <input
                            type="radio"
                            name="socialPlatform"
                            value="Instagram"
                            ${
                                currentMember.socialPlatform === "Instagram"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            📷 Instagram
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="socialPlatform"
                            value="Threads"
                            ${
                                currentMember.socialPlatform === "Threads"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            🧵 Threads
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="socialPlatform"
                            value="Twitter"
                            ${
                                currentMember.socialPlatform === "Twitter"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            𝕏 Twitter
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="socialPlatform"
                            value="Facebook"
                            ${
                                currentMember.socialPlatform === "Facebook"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            📘 Facebook
                        </span>

                    </label>

                </div>

            </div>

                        <!-- 帳號 -->

            <div class="profile-box">

                <small>
                    🔗 帳號
                </small>

                <input
                    class="member-edit-input"
                    id="editSocialAccount"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.socialAccount || ""
                    )}"
                >

            </div>


            <!-- 主擔 -->

            <div class="profile-box">

                <small>
                    ❤️ 主擔
                </small>

                <div class="platform-options">

                    ${favoriteOptions}

                </div>

            </div>


            <!-- 副擔 -->

            <div class="profile-box">

                <small>
                    💛 副擔
                </small>


                <div
                    class="member-multi-select"
                    id="subFavoriteSelect">

                    <button
                        type="button"
                        class="member-multi-toggle"
                        id="subFavoriteToggle">

                        <span
                            id="subFavoriteText">

                            ${
                                currentSubFavorites.length
                                    ? currentSubFavorites.join("、")
                                    : "選擇副擔"
                            }

                        </span>

                        <span>
                            ▾
                        </span>

                    </button>


                    <div
                        class="member-multi-menu"
                        id="subFavoriteMenu">

                        ${subFavoriteOptions}

                    </div>

                </div>

            </div>


            <!-- 官方 LINE -->

            <div class="profile-box">

                <small>
                    🟢 官方 LINE
                </small>

                <label class="member-checkbox">

                    <input
                        id="editOfficialLine"
                        type="checkbox"
                        ${
                            currentMember.officialLine
                                ? "checked"
                                : ""
                        }
                    >

                    <span>
                        已加入官方 LINE
                    </span>

                </label>

            </div>


           <!-- 加入來源 -->

<div class="profile-box">

    <small>
        📍 加入來源
    </small>

    <div class="platform-options source-options">

        <label class="platform-option">

            <input
                type="radio"
                name="joinSource"
                value="買圖千日 用在一時 Threads"
                ${
                    currentMember.joinSource ===
                    "買圖千日 用在一時 Threads"
                        ? "checked"
                        : ""
                }
            >

            <span>
                🧵 買圖千日 用在一時 Threads
            </span>

        </label>


        <label class="platform-option">

            <input
                type="radio"
                name="joinSource"
                value="Facebook 社團"
                ${
                    currentMember.joinSource ===
                    "Facebook 社團"
                        ? "checked"
                        : ""
                }
            >

            <span>
                📘 Facebook 社團
            </span>

        </label>


        <label class="platform-option">

            <input
                type="radio"
                name="joinSource"
                value="朋友推薦"
                ${
                    currentMember.joinSource ===
                    "朋友推薦"
                        ? "checked"
                        : ""
                }
            >

            <span>
                👤 朋友推薦
            </span>

        </label>


        <label class="platform-option">

            <input
                type="radio"
                name="joinSource"
                value="其他"
                ${
                    currentMember.joinSource ===
                    "其他"
                        ? "checked"
                        : ""
                }
            >

            <span>
                ✨ 其他
            </span>

        </label>


        <!-- 朋友推薦 -->

        <div
            id="referrer-source-box"
            style="
                display:${
                    currentMember.joinSource ===
                    "朋友推薦"
                        ? "block"
                        : "none"
                };
                margin-top:12px;
            "
        >

            <input
                type="text"
                id="editReferrerAccount"
                class="member-edit-input"
                placeholder="請輸入推薦人的社群帳號，例如 @xxxxx"
                value="${escapeAttribute(
                    currentMember.referrerAccount ||
                    ""
                )}"
            >

<div
    id="referrer-match-result"
    class="referrer-match-result"
></div>

<select
    id="referrer-member-select"
    class="member-edit-input"
    style="margin-top:10px;"
>
    <option value="">
        🔗 手動指定推薦人會員
    </option>

    ${members
        .filter(member =>
            member.id !== currentMember.id
        )
        .sort((a, b) =>
            (a.memberNo || "").localeCompare(
                b.memberNo || ""
            )
        )
        .map(member => `
            <option
                value="${escapeAttribute(
                    member.id
                )}"
            >
                ${
                    member.memberNo ||
                    "尚未發號"
                }
                ｜${member.nickname || "未填暱稱"}
                ｜${member.socialPlatform || "無平台"}
                ${
                    member.socialAccount
                        ? `｜${member.socialAccount}`
                        : ""
                }
            </option>
        `)
        .join("")}
</select>

<input
    type="hidden"
    id="referrerMemberId"
    value="${escapeAttribute(
        currentMember.referrerMemberId || ""
    )}"
>

<input
    type="hidden"
    id="referrerMemberNo"
    value="${escapeAttribute(
        currentMember.referrerMemberNo || ""
    )}"
>
        </div>


        <!-- 其他 -->

        <div
            id="other-source-box"
            style="
                display:${
                    currentMember.joinSource ===
                    "其他"
                        ? "block"
                        : "none"
                };
                margin-top:12px;
            "
        >

            <input
                type="text"
                id="editOtherSource"
                class="member-edit-input"
                placeholder="請輸入來源、帳號或其他備註"
                value="${escapeAttribute(
                    currentMember.otherSource ||
                    ""
                )}"
            >

        </div>

    </div>

</div>


            <!-- 會員狀態 -->

            <div class="profile-box">

                <small>
                    🏷️ 會員狀態
                </small>

                <select
                    class="member-edit-input"
                    id="editStatus">

                    <option
                        value="已通過"
                        ${
                            currentMember.status === "已通過"
                                ? "selected"
                                : ""
                        }>

                        🟢 已通過

                    </option>


                    <option
                        value="待審核"
                        ${
                            currentMember.status === "待審核"
                                ? "selected"
                                : ""
                        }>

                        🟡 待審核

                    </option>


                    <option
                        value="已拒絕"
                        ${
                            currentMember.status === "已拒絕"
                                ? "selected"
                                : ""
                        }>

                        🔴 已拒絕

                    </option>


                    <option
                        value="暫停"
                        ${
                            currentMember.status === "暫停"
                                ? "selected"
                                : ""
                        }>

                        🟣 暫停

                    </option>

                </select>

            </div>


            <!-- 管理員備註 -->

            <div class="profile-box full">

                <small>
                    📝 管理員備註
                </small>

                <textarea
                    class="member-edit-input member-edit-textarea"
                    id="editAdminNote"
                    placeholder="輸入管理員備註..."
                >${escapeHTML(
                    currentMember.adminNote || ""
                )}</textarea>

            </div>


        </div>

    `;


    // ==================================================
// 朋友推薦：自動比對
// ==================================================

const referrerInput =
    document.getElementById(
        "editReferrerAccount"
    );

const referrerResult =
    document.getElementById(
        "referrer-match-result"
    );

const referrerSelect =
    document.getElementById(
        "referrer-member-select"
    );

const referrerMemberIdInput =
    document.getElementById(
        "referrerMemberId"
    );

const referrerMemberNoInput =
    document.getElementById(
        "referrerMemberNo"
    );


function normalizeReferrerAccount(account) {

    return String(account || "")
        .trim()
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/\s+/g, "");

}


function setReferrer(member) {

    if (!member) return;


    if (referrerMemberIdInput) {

        referrerMemberIdInput.value =
            member.id || "";

    }


    if (referrerMemberNoInput) {

        referrerMemberNoInput.value =
            member.memberNo || "";

    }


    if (referrerSelect) {

        referrerSelect.value =
            member.id || "";

    }


    if (referrerResult) {

        referrerResult.innerHTML = `

            <div class="referrer-selected">

                <span>
                    ✓ 已指定推薦人
                </span>

                <strong>
                    ${
                        escapeHTML(
                            member.memberNo ||
                            "尚未發號"
                        )
                    }

                    ｜

                    ${
                        escapeHTML(
                            member.nickname ||
                            "未填暱稱"
                        )
                    }
                </strong>

                <small>
                    ${
                        escapeHTML(
                            member.socialPlatform ||
                            "社群"
                        )
                    }

                    ·

                    ${
                        escapeHTML(
                            member.socialAccount ||
                            ""
                        )
                    }
                </small>

            </div>

        `;

    }

}


function searchReferrer(account) {

    const keyword =
        normalizeReferrerAccount(
            account
        );


    if (!referrerResult) return;


    if (!keyword) {

        referrerResult.innerHTML = "";

        return;

    }


    const matches =
        members.filter(member => {

            if (
                !member.socialAccount ||
                member.id === currentMember.id
            ) {

                return false;

            }


            return (
                normalizeReferrerAccount(
                    member.socialAccount
                ) === keyword
            );

        });


    if (!matches.length) {

        referrerResult.innerHTML = `

            <div class="referrer-no-match">

                🔍 找不到符合的會員

                <small>
                    可以使用下面的手動指定會員
                </small>

            </div>

        `;

        return;

    }


    referrerResult.innerHTML = `

        <div class="referrer-match-title">

            🔍 找到 ${matches.length} 位可能的會員

        </div>


        <div class="referrer-match-list">

            ${matches.map(member => `

                <button
                    type="button"
                    class="referrer-match-item"
                    data-referrer-id="${escapeAttribute(
                        member.id
                    )}"
                >

                    <span class="referrer-match-main">

                        <strong>

                            ${
                                escapeHTML(
                                    member.memberNo ||
                                    "尚未發號"
                                )
                            }

                            ｜

                            ${
                                escapeHTML(
                                    member.nickname ||
                                    "未填暱稱"
                                )
                            }

                        </strong>


                        <small>

                            ${
                                escapeHTML(
                                    member.socialPlatform ||
                                    "社群"
                                )
                            }

                            ·

                            ${
                                escapeHTML(
                                    member.socialAccount ||
                                    ""
                                )
                            }

                        </small>

                    </span>


                    <span>
                        ✓ 指定
                    </span>

                </button>

            `).join("")}

        </div>

    `;


    referrerResult
        .querySelectorAll(
            ".referrer-match-item"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const member =
                        members.find(
                            item =>
                                item.id ===
                                button.dataset.referrerId
                        );


                    if (member) {

                        setReferrer(
                            member
                        );

                    }

                }
            );

        });

}


referrerInput?.addEventListener(
    "input",
    () => {

        searchReferrer(
            referrerInput.value
        );

    }
);


referrerSelect?.addEventListener(
    "change",
    () => {

        const member =
            members.find(
                item =>
                    item.id ===
                    referrerSelect.value
            );


        if (member) {

            setReferrer(
                member
            );

        }

    }
);
    // ==================================================
    // 副擔下拉選單
    // ==================================================

    const toggle =
        document.getElementById(
            "subFavoriteToggle"
        );


    const menu =
        document.getElementById(
            "subFavoriteMenu"
        );


    const text =
        document.getElementById(
            "subFavoriteText"
        );


    toggle?.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            menu?.classList.toggle(
                "show"
            );

        }
    );


    // 點選副擔

    menu?.querySelectorAll(
        'input[name="subFavoriteMember"]'
    ).forEach(checkbox => {

        checkbox.addEventListener(
            "change",
            updateSubFavoriteText
        );

    });


    function updateSubFavoriteText() {

        const selected =
            [
                ...menu.querySelectorAll(
                    'input[name="subFavoriteMember"]:checked'
                )
            ]
                .map(
                    checkbox =>
                        checkbox.value
                );


        if (
            selected.length
        ) {

            text.textContent =
                selected.join("、");

        } else {

            text.textContent =
                "選擇副擔";

        }

    }


    // 點外面關閉副擔選單

    document.addEventListener(
        "click",
        function closeSubFavorite(event) {

            if (
                !event.target.closest(
                    "#subFavoriteSelect"
                )
            ) {

                menu?.classList.remove(
                    "show"
                );

                document.removeEventListener(
                    "click",
                    closeSubFavorite
                );

            }

        }
    );


    // ==================================================
    // 取消
    // ==================================================

    document
        .getElementById(
            "cancelEditMember"
        )
        ?.addEventListener(
            "click",
            () => {

                editingMember = false;

                renderProfile();

            }
        );

// ==================================================
// 快速修改會員狀態
// ==================================================

document
    .getElementById(
        "quickEditStatus"
    )
    ?.addEventListener(
        "click",
        () => {

            const statusText =
                document.getElementById(
                    "profileStatusText"
                );

            if (!statusText) return;


            statusText.innerHTML = `

                <select
                    id="quickStatusSelect"
                    class="quick-status-select"
                >

                    <option
                        value="已通過"
                        ${
                            currentMember.status ===
                            "已通過"
                                ? "selected"
                                : ""
                        }
                    >
                        🟢 已通過
                    </option>

                    <option
                        value="待審核"
                        ${
                            currentMember.status ===
                            "待審核"
                                ? "selected"
                                : ""
                        }
                    >
                        🟡 待審核
                    </option>

                    <option
                        value="已拒絕"
                        ${
                            currentMember.status ===
                            "已拒絕"
                                ? "selected"
                                : ""
                        }
                    >
                        🔴 已拒絕
                    </option>

                    <option
                        value="暫停"
                        ${
                            currentMember.status ===
                            "暫停"
                                ? "selected"
                                : ""
                        }
                    >
                        ⚪ 暫停
                    </option>

                </select>

                <button
                    type="button"
                    id="quickSaveStatus"
                    class="quick-status-save"
                >
                    💾
                </button>

            `;


            document
                .getElementById(
                    "quickSaveStatus"
                )
                ?.addEventListener(
                    "click",
                    async () => {

                        const select =
                            document.getElementById(
                                "quickStatusSelect"
                            );

                        if (!select) return;


                        const newStatus =
                            select.value;


                        try {

                            await setDoc(
                                doc(
                                    db,
                                    "members",
                                    currentMember.id
                                ),
                                {
                                    status:
                                        newStatus
                                },
                                {
                                    merge: true
                                }
                            );


                            currentMember.status =
                                newStatus;


                            showToast(
                                "會員狀態已更新！"
                            );


                            renderProfile();


                        }
                        catch (error) {

                            console.error(
                                "更新會員狀態失敗：",
                                error
                            );

                            alert(
                                "會員狀態更新失敗，請稍後再試。"
                            );

                        }

                    }
                );

        }
    );
    
    // ==================================================
    // 儲存
    // ==================================================

    document
        .getElementById(
            "saveMember"
        )
        ?.addEventListener(
            "click",
            saveMember
        );

}


// ==================================================
// 儲存會員
// ==================================================

async function saveMember() {

    if (!currentMember) return;


    const saveButton =
        document.getElementById(
            "saveMember"
        );


    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "儲存中…";

    }


    try {

        // ==========================================
        // 基本資料
        // ==========================================

        const memberNo =
            document
                .getElementById(
                    "editMemberNo"
                )
                ?.value
                .trim() || "";


        const nickname =
            document
                .getElementById(
                    "editNickname"
                )
                ?.value
                .trim() || "";


        const socialPlatform =
            document.querySelector(
                'input[name="socialPlatform"]:checked'
            )?.value || "";


        const socialAccount =
            document
                .getElementById(
                    "editSocialAccount"
                )
                ?.value
                .trim() || "";


        // ==========================================
        // 主擔
        // ==========================================

        const favoriteMember =
            document.querySelector(
                'input[name="favoriteMember"]:checked'
            )?.value || "";


        // ==========================================
        // 副擔
        // ==========================================

        const subFavoriteMembers =
            [
                ...document.querySelectorAll(
                    'input[name="subFavoriteMember"]:checked'
                )
            ]
                .map(
                    checkbox =>
                        checkbox.value
                );


        // ==========================================
        // 其他資料
        // ==========================================

        const officialLine =
            document
                .getElementById(
                    "editOfficialLine"
                )
                ?.checked || false;


        let joinSource =
            document.querySelector(
                'input[name="joinSource"]:checked'
            )?.value || "";


        if (
            joinSource === "其他"
        ) {

            joinSource =
                document
                    .getElementById(
                       "editOtherSource"
                    )
                    ?.value
                    .trim() || "其他";

        }


       const referrerAccount =
    document
        .getElementById(
            "editReferrerAccount"
        )
        ?.value
        .trim() || "";

const referrerMemberId =
    document
        .getElementById(
            "referrerMemberId"
        )
        ?.value || "";

const referrerMemberNo =
    document
        .getElementById(
            "referrerMemberNo"
        )
        ?.value || "";
const otherSource =
    document
        .getElementById(
            "editOtherSource"
        )
        ?.value
        .trim() || "";


        const status =
            document
                .getElementById(
                    "editStatus"
                )
                ?.value ||
                "待審核";


        const adminNote =
            document
                .getElementById(
                    "editAdminNote"
                )
                ?.value
                .trim() || "";


        // ==========================================
        // 更新 Firebase
        // ==========================================

        await updateDoc(

            doc(
                db,
                "members",
                currentMember.id
            ),

            {

                memberNo,

                nickname,

                socialPlatform,

                socialAccount,

                favoriteMember,

                subFavoriteMembers,

                officialLine,

joinSource,

referrerAccount,

referrerMemberId,

referrerMemberNo,

otherSource,

status,

adminNote

            }

        );


        // ==========================================
        // 更新本地資料
        // ==========================================

        currentMember = {

            ...currentMember,

            memberNo,

            nickname,

            socialPlatform,

            socialAccount,

            favoriteMember,

            subFavoriteMembers,

           officialLine,

joinSource,

referrerAccount,

referrerMemberId,

referrerMemberNo,

otherSource,

status,

adminNote

        };


        const index =
            members.findIndex(
                member =>
                    member.id ===
                    currentMember.id
            );


        if (
            index !== -1
        ) {

            members[index] =
                currentMember;

        }


        // ==========================================
        // 結束編輯
        // ==========================================

        editingMember = false;


        renderDashboard();

        renderMemberList();

        renderRecentMembers();

        renderProfile();


        setTimeout(() => {

            const selectedCard =
                document.querySelector(
                    `.member-card[data-id="${currentMember.id}"]`
                );


            if (
                selectedCard
            ) {

                selectedCard.classList.add(
                    "active"
                );

            }

        }, 0);


        alert(
            "會員資料已儲存！"
        );


    } catch (error) {

        console.error(
            "會員資料儲存失敗：",
            error
        );


        alert(
            "儲存失敗，請稍後再試。"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "💾 儲存";

        }

    }

}

// ==================================================
// 最近加入會員
// ==================================================

function renderRecentMembers() {

    if (!recentMembers) return;


    recentMembers.innerHTML = "";


    if (
        members.length === 0
    ) {

        recentMembers.innerHTML = `

            <div class="recent-empty">

                目前尚無會員資料

            </div>

        `;

        return;

    }


    const sortedMembers =
        [...members]
            .sort((a, b) => {

                const dateA =
                    getDateValue(
                        a.joinDate
                    );


                const dateB =
                    getDateValue(
                        b.joinDate
                    );


                return dateB - dateA;

            })
            .slice(0, 3);


    sortedMembers.forEach(member => {


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "recent-member-card";


        card.innerHTML = `

            <div class="recent-member-avatar">

                👤

            </div>


            <div class="recent-member-info">

                <strong>

                    ${escapeHTML(
                        member.nickname ||
                        "待發號"
                    )}

                </strong>


                <span>

                    ${
                        member.memberNo
                            ? escapeHTML(
                                member.memberNo
                            )
                            : "尚未發號"
                    }

                    ·

                    ${
                        member.socialPlatform
                            ? escapeHTML(
                                member.socialPlatform
                            )
                            : "尚未填寫平台"
                    }

                </span>

            </div>

        `;


        card.addEventListener(
            "click",
            () => {

                currentMember =
                    member;


                editingMember =
                    false;


                renderProfile();


                const target =
                    document.querySelector(
                        `.member-card[data-id="${member.id}"]`
                    );


                if (target) {

                    document
                        .querySelectorAll(
                            ".member-card"
                        )
                        .forEach(item => {

                            item.classList.remove(
                                "active"
                            );

                        });


                    target.classList.add(
                        "active"
                    );

                }


                window.scrollTo({

                    top:
                        document
                            .querySelector(
                                ".workspace"
                            )
                            ?.offsetTop || 0,

                    behavior:
                        "smooth"

                });

            }
        );


        recentMembers.appendChild(
            card
        );

    });

}


// ==================================================
// 日期轉換
// ==================================================

function getDateValue(value) {

    if (!value) {

        return 0;

    }


    if (
        value &&
        typeof value.toDate === "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return 0;

    }


    return date.getTime();

}


// ==================================================
// 搜尋
// ==================================================

// ==================================================
// 搜尋＋會員篩選
// ==================================================

const memberStatusFilter =
    document.getElementById(
        "memberStatusFilter"
    );

const memberFavoriteFilter =
    document.getElementById(
        "memberFavoriteFilter"
    );


function applyMemberFilters() {

    currentMember = null;

    editingMember = false;


    const keyword =
        memberSearch
            ?.value
            ?.trim() || "";


    const status =
        memberStatusFilter
            ?.value || "";


    const favorite =
        memberFavoriteFilter
            ?.value || "";


    renderMemberList(
        keyword,
        status,
        favorite
    );

}


// ==============================
// 搜尋
// ==============================

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        applyMemberFilters
    );

}


// ==============================
// 狀態篩選
// ==============================

if (memberStatusFilter) {

    memberStatusFilter.addEventListener(
        "change",
        applyMemberFilters
    );

}


// ==============================
// 主擔篩選
// ==============================

if (memberFavoriteFilter) {

    memberFavoriteFilter.addEventListener(
        "change",
        applyMemberFilters
    );

}

// ==================================================
// Modal
// ==================================================

const memberModal =
    document.getElementById(
        "memberModal"
    );


const taskModal =
    document.getElementById(
        "taskModal"
    );


const addMemberBtn =
    document.getElementById(
        "addMember"
    );


const addTaskBtn =
    document.getElementById(
        "addTask"
    );


const closeMemberModal =
    document.getElementById(
        "closeMemberModal"
    );


const closeTaskModal =
    document.getElementById(
        "closeTaskModal"
    );


// ==================================================
// 新增會員
// ==================================================

addMemberBtn?.addEventListener(
    "click",
    () => {

        memberModal?.classList.remove(
            "hidden"
        );

    }
);


// ==================================================
// 關閉會員 Modal
// ==================================================

closeMemberModal?.addEventListener(
    "click",
    () => {

        memberModal?.classList.add(
            "hidden"
        );

    }
);


// ==================================================
// 新增待辦
// ==================================================

addTaskBtn?.addEventListener(
    "click",
    () => {

        taskModal?.classList.remove(
            "hidden"
        );

    }
);


// ==================================================
// 關閉新增待辦
// ==================================================

closeTaskModal?.addEventListener(
    "click",
    () => {

        taskModal?.classList.add(
            "hidden"
        );

    }
);


// ==================================================
// HTML 安全處理
// ==================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        );

}


// ==================================================
// 完成
// ==================================================

console.log(
    "admin2.js V7 已載入"
);
