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

            alert(
                "找不到會員資料"
            );

            location.href =
                "app.html";

            return;

        }


        if (
            memberSnap.data().role !==
            "管理員"
        ) {

            alert(
                "沒有權限"
            );

            location.href =
                "app.html";

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


        snapshot.forEach(
            memberDoc => {

                members.push({

                    id:
                        memberDoc.id,

                    ...memberDoc.data()

                });

            }
        );


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


    members.forEach(
        member => {

            if (
                member.status !==
                "已通過"
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
                    typeof member.joinDate.toDate ===
                    "function"
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
                        ).slice(
                            0,
                            10
                        );

                }


                if (
                    joinDate ===
                    todayString
                ) {

                    today++;

                }

            }

        }
    );


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

// ==================================================
// 左側會員列表
// ==================================================

function renderMemberList(
    keyword = ""
) {

    if (!memberList) return;


    memberList.innerHTML = "";


    const searchKeyword =
        keyword
            .trim()
            .toLowerCase();


    const list =
        members.filter(
            member => {

                const text = [

                    member.memberNo || "",

                    member.nickname || "",

                    member.socialPlatform || "",

                    member.socialAccount || "",

                    member.favoriteMember || "",

                    member.joinSource || "",

                    member.referrerAccount || ""

                ]
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    searchKeyword
                );

            }
        );


    list.forEach(
        member => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "member-card";


            card.dataset.id =
                member.id;


            let statusClass =
                "pending";


            if (
                member.status ===
                "已通過"
            ) {

                statusClass =
                    "approved";

            } else if (
                member.status ===
                "已拒絕"
            ) {

                statusClass =
                    "rejected";

            } else if (
                member.status ===
                "暫停"
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
                        class="status ${statusClass}"
                    >

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


                ${
                    member.status === "待審核"
                        ? `

                            <div class="member-review-actions">

                                <button
                                    type="button"
                                    class="approve-member"
                                    data-id="${escapeAttribute(
                                        member.id
                                    )}"
                                >
                                    🟢 通過
                                </button>


                                <button
                                    type="button"
                                    class="reject-member"
                                    data-id="${escapeAttribute(
                                        member.id
                                    )}"
                                >
                                    🔴 拒絕
                                </button>

                            </div>

                        `
                        : ""
                }

            `;


            memberList.appendChild(
                card
            );

        }
    );


    bindMemberClick();

}


// ==================================================
// 更新會員審核狀態
// ==================================================

async function updateMemberStatus(
    memberId,
    newStatus
) {

    const member =
        members.find(
            item =>
                item.id === memberId
        );


    if (!member) {

        alert(
            "找不到這位會員"
        );

        return;

    }


    const actionText =
        newStatus === "已通過"
            ? "通過"
            : "拒絕";


    const confirmed =
        confirm(
            `確定要${actionText}「${
                member.nickname ||
                "此會員"
            }」嗎？`
        );


    if (!confirmed) return;


    try {

        await updateDoc(

            doc(
                db,
                "members",
                memberId
            ),

            {
                status:
                    newStatus
            }

        );


        // 更新目前記憶中的會員
        member.status =
            newStatus;


        if (
            currentMember &&
            currentMember.id ===
                memberId
        ) {

            currentMember.status =
                newStatus;

        }


        // 重新整理
        renderDashboard();

        renderMemberList();


        // 保持目前會員資料
        renderProfile();


        alert(
            `已${actionText}會員！`
        );


    } catch (error) {

        console.error(
            "更新會員狀態失敗：",
            error
        );


        alert(
            "更新失敗，請稍後再試。"
        );

    }

}


// ==================================================
// 會員點擊
// ==================================================

function bindMemberClick() {

    const cards =
        document.querySelectorAll(
            ".member-card"
        );


    cards.forEach(
        card => {


            // ==============================
            // 點會員卡
            // ==============================

            card.onclick =
                () => {

                    cards.forEach(
                        item => {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    card.classList.add(
                        "active"
                    );


                    currentMember =
                        members.find(
                            member =>
                                member.id ===
                                card.dataset.id
                        );


                    editingMember =
                        false;


                    renderProfile();

                };


            // ==============================
            // 🟢 通過
            // ==============================

            const approveButton =
                card.querySelector(
                    ".approve-member"
                );


            if (
                approveButton
            ) {

                approveButton.onclick =
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const memberId =
                            approveButton.dataset.id;


                        await updateMemberStatus(
                            memberId,
                            "已通過"
                        );

                    };

            }


            // ==============================
            // 🔴 拒絕
            // ==============================

            const rejectButton =
                card.querySelector(
                    ".reject-member"
                );


            if (
                rejectButton
            ) {

                rejectButton.onclick =
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const memberId =
                            rejectButton.dataset.id;


                        await updateMemberStatus(
                            memberId,
                            "已拒絕"
                        );

                    };

            }

        }
    );


    // 沒有選擇會員
    // 自動選第一位

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


    let referrerDisplay = "-";


    if (
        currentMember.referrerMemberNo
    ) {

        referrerDisplay =
            `${currentMember.referrerMemberNo}`;


        if (
            currentMember.referrerAccount
        ) {

            referrerDisplay +=
                ` · ${currentMember.referrerAccount}`;

        }

    } else if (
        currentMember.referrerAccount
    ) {

        referrerDisplay =
            currentMember.referrerAccount;

    }


    let otherSourceDisplay =
        currentMember.otherSource ||
        "";


    profileCard.innerHTML = `

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
                    type="button"
                >

                    ✏️ 編輯

                </button>

            </div>

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
                    🔗 帳號
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.socialAccount ||
                        "-"
                    )}

                </strong>

            </div>


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


            <div class="profile-box">

                <small>
                    📍 加入來源
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.joinSource ||
                        "-"
                    )}

                </strong>

            </div>


            ${
                currentMember.joinSource ===
                "朋友推薦"
                    ? `

                        <div class="profile-box">

                            <small>
                                👤 推薦人帳號
                            </small>

                            <strong>

                                ${escapeHTML(
                                    currentMember.referrerAccount ||
                                    "-"
                                )}

                            </strong>

                        </div>


                        <div class="profile-box">

                            <small>
                                🔗 推薦人會員
                            </small>

                            <strong>

                                ${escapeHTML(
                                    currentMember.referrerMemberNo ||
                                    "尚未指定"
                                )}

                            </strong>

                        </div>

                    `
                    : ""
            }


            ${
                currentMember.joinSource ===
                "其他"
                    ? `

                        <div class="profile-box">

                            <small>
                                ✨ 其他來源／備註
                            </small>

                            <strong>

                                ${escapeHTML(
                                    otherSourceDisplay ||
                                    "-"
                                )}

                            </strong>

                        </div>

                    `
                    : ""
            }


            <div class="profile-box">

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


            <div class="profile-box">

                <small>
                    🏷️ 會員狀態
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.status ||
                        "-"
                    )}

                </strong>

            </div>


        </div>

    `;


    document
        .getElementById(
            "editMember"
        )
        ?.addEventListener(
            "click",
            () => {

                editingMember =
                    true;

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


    // ==================================================
    // 主擔
    // ==================================================

    const favoriteOptions =
        ateezMembers
            .map(
                member => `

                    <option
                        value="${escapeAttribute(
                            member
                        )}"
                        ${
                            currentMember.favoriteMember ===
                            member
                                ? "selected"
                                : ""
                        }
                    >

                        ${escapeHTML(
                            member
                        )}

                    </option>

                `
            )
            .join("");


    // ==================================================
    // 副擔
    // ==================================================

    const subFavoriteOptions =
        ateezMembers
            .map(
                member => `

                    <label
                        class="member-multi-option"
                    >

                        <input
                            type="checkbox"
                            name="subFavoriteMember"
                            value="${escapeAttribute(
                                member
                            )}"
                            ${
                                currentSubFavorites.includes(
                                    member
                                )
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>

                            ${escapeHTML(
                                member
                            )}

                        </span>

                    </label>

                `
            )
            .join("");


    // ==================================================
    // 推薦人選項
    // ==================================================

    const referrerMemberOptions =
        renderReferrerMemberOptions();


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
                    type="button"
                >

                    取消

                </button>


                <button
                    id="saveMember"
                    type="button"
                >

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
                        currentMember.memberNo ||
                        ""
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
                        currentMember.nickname ||
                        ""
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
                                currentMember.socialPlatform ===
                                "Instagram"
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
                                currentMember.socialPlatform ===
                                "Threads"
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
                            value="Facebook"
                            ${
                                currentMember.socialPlatform ===
                                "Facebook"
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
                        currentMember.socialAccount ||
                        ""
                    )}"
                >

            </div>


            <!-- 主擔 -->

            <div class="profile-box">

                <small>
                    ❤️ 主擔
                </small>

                <select
                    class="member-edit-input member-select"
                    id="editFavoriteMember"
                >

                    <option value="">
                        尚未選擇
                    </option>

                    ${favoriteOptions}

                </select>

            </div>


            <!-- 副擔 -->

            <div class="profile-box">

                <small>
                    💛 副擔
                </small>


                <div
                    class="member-multi-select"
                    id="subFavoriteSelect"
                >

                    <button
                        type="button"
                        class="member-multi-toggle"
                        id="subFavoriteToggle"
                    >

                        <span
                            id="subFavoriteText"
                        >

                            ${
                                currentSubFavorites.length
                                    ? currentSubFavorites.join(
                                        "、"
                                    )
                                    : "選擇副擔"
                            }

                        </span>


                        <span>
                            ▾
                        </span>

                    </button>


                    <div
                        class="member-multi-menu"
                        id="subFavoriteMenu"
                    >

                        ${subFavoriteOptions}

                    </div>

                </div>

            </div>


            <!-- 官方 LINE -->

            <div class="profile-box">

                <small>
                    🟢 官方 LINE
                </small>


                <label
                    class="member-checkbox"
                >

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


                <div
                    class="platform-options source-options"
                >


                    <label
                        class="platform-option"
                    >

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


                    <label
                        class="platform-option"
                    >

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


                    <label
                        class="platform-option"
                    >

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


                    <label
                        class="platform-option"
                    >

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

                </div>


                <!-- 朋友推薦 -->

                <div
                    id="referrerSection"
                    style="
                        display:${
                            currentMember.joinSource ===
                            "朋友推薦"
                                ? "block"
                                : "none"
                        };
                        margin-top:14px;
                    "
                >

                    <label
                        style="
                            display:block;
                            font-size:13px;
                            font-weight:600;
                            color:#64748b;
                            margin-bottom:7px;
                        "
                    >

                        👤 推薦人社群帳號

                    </label>


                    <input
                        class="member-edit-input"
                        id="editReferrerAccount"
                        type="text"
                        placeholder="@xxxxx"
                        value="${escapeAttribute(
                            currentMember.referrerAccount ||
                            ""
                        )}"
                    >


                    <div
                        id="referrerMatchBox"
                        style="
                            margin-top:10px;
                        "
                    ></div>


                    <label
                        style="
                            display:block;
                            font-size:13px;
                            font-weight:600;
                            color:#64748b;
                            margin-top:12px;
                            margin-bottom:7px;
                        "
                    >

                        🔗 已綁定推薦人

                    </label>


                    <select
                        class="member-edit-input"
                        id="referrerMemberSelect"
                    >

                        <option value="">
                            尚未指定
                        </option>

                        ${referrerMemberOptions}

                    </select>

                </div>


                <!-- 其他 -->

                <div
                    id="otherSourceSection"
                    style="
                        display:${
                            currentMember.joinSource ===
                            "其他"
                                ? "block"
                                : "none"
                        };
                        margin-top:14px;
                    "
                >

                    <label
                        style="
                            display:block;
                            font-size:13px;
                            font-weight:600;
                            color:#64748b;
                            margin-bottom:7px;
                        "
                    >

                        ✨ 來源／帳號／備註

                    </label>


                    <input
                        class="member-edit-input"
                        id="editOtherSource"
                        type="text"
                        placeholder="請輸入來源、帳號或其他備註"
                        value="${escapeAttribute(
                            currentMember.otherSource ||
                            ""
                        )}"
                    >

                </div>

            </div>


            <!-- 會員狀態 -->

            <div class="profile-box">

                <small>
                    🏷️ 會員狀態
                </small>


                <select
                    class="member-edit-input"
                    id="editStatus"
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
                    currentMember.adminNote ||
                    ""
                )}</textarea>

            </div>


        </div>

    `;


    // ==================================================
    // 副擔選單
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
        event => {

            event.stopPropagation();

            menu?.classList.toggle(
                "show"
            );

        }
    );


    menu?.querySelectorAll(
        'input[name="subFavoriteMember"]'
    ).forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                updateSubFavoriteText
            );

        }
    );


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


        text.textContent =
            selected.length
                ? selected.join("、")
                : "選擇副擔";

    }


    // ==================================================
    // 加入來源切換
    // ==================================================

    const joinSourceRadios =
        document.querySelectorAll(
            'input[name="joinSource"]'
        );


    const referrerSection =
        document.getElementById(
            "referrerSection"
        );


    const otherSourceSection =
        document.getElementById(
            "otherSourceSection"
        );


    joinSourceRadios.forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    if (
                        radio.value ===
                        "朋友推薦"
                    ) {

                        referrerSection.style.display =
                            "block";

                        otherSourceSection.style.display =
                            "none";

                    } else if (
                        radio.value ===
                        "其他"
                    ) {

                        referrerSection.style.display =
                            "none";

                        otherSourceSection.style.display =
                            "block";

                    } else {

                        referrerSection.style.display =
                            "none";

                        otherSourceSection.style.display =
                            "none";

                    }

                }
            );

        }
    );


    // ==================================================
    // 推薦人帳號輸入
    // ==================================================

    const referrerAccountInput =
        document.getElementById(
            "editReferrerAccount"
        );


    referrerAccountInput?.addEventListener(
        "input",
        () => {

            findReferrerMatches(
                referrerAccountInput.value
            );

        }
    );


    // ==================================================
    // 手動指定推薦人
    // ==================================================

    const referrerMemberSelect =
        document.getElementById(
            "referrerMemberSelect"
        );


    referrerMemberSelect?.addEventListener(
        "change",
        () => {

            const selectedId =
                referrerMemberSelect.value;


            currentMember.referrerMemberId =
                selectedId || "";


            const selectedMember =
                members.find(
                    member =>
                        member.id ===
                        selectedId
                );


            currentMember.referrerMemberNo =
                selectedMember
                    ?.memberNo || "";

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

                editingMember =
                    false;

                renderProfile();

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
// 推薦人選項
// ==================================================

function renderReferrerMemberOptions() {

    if (!currentMember) {

        return "";

    }


    return members

        .filter(
            member =>
                member.id !==
                currentMember.id
        )

        .sort(
            (a, b) => {

                return String(
                    a.memberNo || ""
                ).localeCompare(
                    String(
                        b.memberNo || ""
                    ),
                    "zh-Hant"
                );

            }
        )

        .map(
            member => `

                <option
                    value="${escapeAttribute(
                        member.id
                    )}"
                    ${
                        currentMember.referrerMemberId ===
                        member.id
                            ? "selected"
                            : ""
                    }
                >

                    ${escapeHTML(
                        member.memberNo ||
                        "待發號"
                    )}

                    ｜

                    ${escapeHTML(
                        member.nickname ||
                        "-"
                    )}

                </option>

            `
        )

        .join("");

}


// ==================================================
// 推薦人帳號比對
// ==================================================

function findReferrerMatches(
    input
) {

    const box =
        document.getElementById(
            "referrerMatchBox"
        );


    if (!box) return;


    const keyword =
        normalizeSocialAccount(
            input
        );


    if (!keyword) {

        box.innerHTML =
            "";

        return;

    }


    const matches =
        members.filter(
            member => {

                if (
                    member.id ===
                    currentMember?.id
                ) {

                    return false;

                }


                const possibleAccounts = [

                    member.socialAccount,

                    member.instagramAccount,

                    member.threadsAccount,

                    member.facebookAccount,

                    member.twitterAccount,

                    member.xAccount

                ];


                return possibleAccounts.some(
                    account =>
                        normalizeSocialAccount(
                            account
                        ) === keyword
                );

            }
        );


    if (
        matches.length ===
        0
    ) {

        box.innerHTML = `

            <div
                style="
                    padding:10px 12px;
                    border-radius:12px;
                    background:#fff7ed;
                    color:#c2410c;
                    font-size:13px;
                "
            >

                ⚠️ 尚未找到相符會員

            </div>

        `;

        return;

    }


    if (
        matches.length ===
        1
    ) {

        renderSingleReferrerMatch(
            matches[0]
        );

        return;

    }


    renderMultipleReferrerMatches(
        matches
    );

}


// ==================================================
// 單一推薦人
// ==================================================

function renderSingleReferrerMatch(
    member
) {

    const box =
        document.getElementById(
            "referrerMatchBox"
        );


    if (!box) return;


    box.innerHTML = `

        <div
            style="
                padding:12px;
                border-radius:14px;
                background:#f0fdf4;
                border:1px solid #bbf7d0;
            "
        >

            <div
                style="
                    color:#15803d;
                    font-size:13px;
                    font-weight:700;
                    margin-bottom:5px;
                "
            >

                🔍 找到可能的推薦人

            </div>


            <div
                style="
                    font-weight:700;
                    color:#0f172a;
                "
            >

                ${escapeHTML(
                    member.memberNo ||
                    "待發號"
                )}

                ｜

                ${escapeHTML(
                    member.nickname ||
                    "-"
                )}

            </div>


            <div
                style="
                    margin-top:3px;
                    font-size:12px;
                    color:#64748b;
                "
            >

                ${escapeHTML(
                    member.socialPlatform ||
                    ""
                )}

                ·

                ${escapeHTML(
                    member.socialAccount ||
                    ""
                )}

            </div>


            <button
                type="button"
                id="confirmReferrerMatch"
                style="
                    margin-top:9px;
                    padding:7px 12px;
                    border:0;
                    border-radius:9px;
                    background:#5d68ff;
                    color:#fff;
                    cursor:pointer;
                    font-size:12px;
                    font-weight:700;
                "
            >

                ✓ 確認這位

            </button>

        </div>

    `;


    document
        .getElementById(
            "confirmReferrerMatch"
        )
        ?.addEventListener(
            "click",
            () => {

                selectReferrerMember(
                    member
                );

            }
        );

}


// ==================================================
// 多位推薦人
// ==================================================

function renderMultipleReferrerMatches(
    matches
) {

    const box =
        document.getElementById(
            "referrerMatchBox"
        );


    if (!box) return;


    box.innerHTML = `

        <div
            style="
                padding:12px;
                border-radius:14px;
                background:#fff7ed;
                border:1px solid #fed7aa;
            "
        >

            <div
                style="
                    color:#c2410c;
                    font-size:13px;
                    font-weight:700;
                    margin-bottom:8px;
                "
            >

                ⚠️ 找到 ${matches.length} 位可能會員

            </div>


            ${matches
                .map(
                    member => `

                        <button
                            type="button"
                            class="referrer-candidate"
                            data-member-id="${escapeAttribute(
                                member.id
                            )}"
                            style="
                                display:block;
                                width:100%;
                                margin-top:6px;
                                padding:9px 11px;
                                border:1px solid #e2e8f0;
                                border-radius:10px;
                                background:#fff;
                                text-align:left;
                                cursor:pointer;
                            "
                        >

                            <strong>

                                ${escapeHTML(
                                    member.memberNo ||
                                    "待發號"
                                )}

                                ｜

                                ${escapeHTML(
                                    member.nickname ||
                                    "-"
                                )}

                            </strong>


                            <br>


                            <small>

                                ${escapeHTML(
                                    member.socialPlatform ||
                                    ""
                                )}

                                ·

                                ${escapeHTML(
                                    member.socialAccount ||
                                    ""
                                )}

                            </small>

                        </button>

                    `
                )
                .join("")}

        </div>

    `;


    box
        .querySelectorAll(
            ".referrer-candidate"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const member =
                            members.find(
                                item =>
                                    item.id ===
                                    button.dataset.memberId
                            );


                        if (
                            !member
                        ) {

                            return;

                        }


                        selectReferrerMember(
                            member
                        );

                    }
                );

            }
        );

}


// ==================================================
// 選擇推薦人
// ==================================================

function selectReferrerMember(
    member
) {

    const select =
        document.getElementById(
            "referrerMemberSelect"
        );


    if (select) {

        select.value =
            member.id;

    }


    currentMember.referrerMemberId =
        member.id;


    currentMember.referrerMemberNo =
        member.memberNo || "";


    const box =
        document.getElementById(
            "referrerMatchBox"
        );


    if (box) {

        box.innerHTML = `

            <div
                style="
                    padding:10px 12px;
                    border-radius:12px;
                    background:#eef2ff;
                    color:#4f46e5;
                    font-size:13px;
                    font-weight:700;
                "
            >

                ✓ 已選擇

                ${escapeHTML(
                    member.memberNo ||
                    "待發號"
                )}

                ｜

                ${escapeHTML(
                    member.nickname ||
                    "-"
                )}

            </div>

        `;

    }

}


// ==================================================
// 社群帳號標準化
// ==================================================

function normalizeSocialAccount(
    value
) {

    return String(
        value || ""
    )

        .trim()

        .toLowerCase()

        .replace(
            /^https?:\/\//,
            ""
        )

        .replace(
            /^www\./,
            ""
        )

        .replace(
            /^(instagram\.com|threads\.net|facebook\.com)\//,
            ""
        )

        .replace(
            /^@/,
            ""
        )

        .replace(
            /\/$/,
            ""
        )

        .replace(
            /\s+/g,
            ""
        );

}


// ==================================================
// 儲存會員
// ==================================================

async function saveMember() {

    if (!currentMember) {

        return;

    }


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

        // ==================================================
        // 基本資料
        // ==================================================

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
            document
                .querySelector(
                    'input[name="socialPlatform"]:checked'
                )
                ?.value || "";


        const socialAccount =
            document
                .getElementById(
                    "editSocialAccount"
                )
                ?.value
                .trim() || "";


        // ==================================================
        // 主擔
        // ==================================================

        const favoriteMember =
            document
                .getElementById(
                    "editFavoriteMember"
                )
                ?.value || "";


        // ==================================================
        // 副擔
        // ==================================================

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


        // ==================================================
        // 官方 LINE
        // ==================================================

        const officialLine =
            document
                .getElementById(
                    "editOfficialLine"
                )
                ?.checked || false;


        // ==================================================
        // 加入來源
        // ==================================================

        const joinSource =
            document
                .querySelector(
                    'input[name="joinSource"]:checked'
                )
                ?.value || "";


        // ==================================================
        // 推薦人
        // ==================================================

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
                    "referrerMemberSelect"
                )
                ?.value || "";


        const selectedReferrer =
            members.find(
                member =>
                    member.id ===
                    referrerMemberId
            );


        const referrerMemberNo =
            selectedReferrer
                ?.memberNo || "";


        // ==================================================
        // 其他
        // ==================================================

        const otherSource =
            document
                .getElementById(
                    "editOtherSource"
                )
                ?.value
                .trim() || "";


        // ==================================================
        // 狀態
        // ==================================================

        const status =
            document
                .getElementById(
                    "editStatus"
                )
                ?.value ||
                "待審核";


        // ==================================================
        // 管理員備註
        // ==================================================

        const adminNote =
            document
                .getElementById(
                    "editAdminNote"
                )
                ?.value
                .trim() || "";


        // ==================================================
        // 更新 Firebase
        // ==================================================

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


        // ==================================================
        // 更新本地資料
        // ==================================================

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


        // ==================================================
        // 結束編輯
        // ==================================================

        editingMember =
            false;


        renderDashboard();

        renderMemberList();

        renderRecentMembers();

        renderProfile();


        setTimeout(
            () => {

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

            },
            0
        );


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


    recentMembers.innerHTML =
        "";


    if (
        members.length ===
        0
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

            .sort(
                (a, b) => {

                    const dateA =
                        getDateValue(
                            a.joinDate
                        );


                    const dateB =
                        getDateValue(
                            b.joinDate
                        );


                    return dateB -
                        dateA;

                }
            )

            .slice(
                0,
                3
            );


    sortedMembers.forEach(
        member => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "recent-member-card";


            card.innerHTML = `

                <div
                    class="recent-member-avatar"
                >

                    👤

                </div>


                <div
                    class="recent-member-info"
                >

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


                    if (
                        target
                    ) {

                        document
                            .querySelectorAll(
                                ".member-card"
                            )
                            .forEach(
                                item => {

                                    item.classList.remove(
                                        "active"
                                    );

                                }
                            );


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
                                ?.offsetTop ||
                            0,

                        behavior:
                            "smooth"

                    });

                }
            );


            recentMembers.appendChild(
                card
            );

        }
    );

}


// ==================================================
// 日期轉換
// ==================================================

function getDateValue(
    value
) {

    if (!value) {

        return 0;

    }


    if (
        value &&
        typeof value.toDate ===
        "function"
    ) {

        return value
            .toDate()
            .getTime();

    }


    const date =
        new Date(
            value
        );


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

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        event => {

            currentMember =
                null;

            editingMember =
                false;


            renderMemberList(
                event.target.value
            );

        }
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

function escapeHTML(
    value
) {

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


function escapeAttribute(
    value
) {

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


console.log(
    "admin2-member.js V8 已載入"
);
