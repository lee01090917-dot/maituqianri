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
    keyword = ""
) {

    if (!memberList) return;


    memberList.innerHTML = "";


    const searchKeyword =
        keyword
            .trim()
            .toLowerCase();


    const list =
        members.filter(member => {


            const text = [

                member.memberNo || "",

                member.nickname || "",

                member.socialPlatform || "",

                member.socialAccount || "",

                member.favoriteMember || ""

            ]

                .join(" ")

                .toLowerCase();


            return text.includes(
                searchKeyword
            );

        });


    list.forEach(member => {


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
                    type="button">

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


            <div class="profile-box">

                <small>
                    👥 推薦人
                </small>

                <strong>

                    ${escapeHTML(
                        currentMember.referrerNickname ||
                        "-"
                    )}

                </strong>

            </div>


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
                            value="官方 LINE"
                            ${
                                currentMember.joinSource === "官方 LINE"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            🟢 官方 LINE
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="joinSource"
                            value="Instagram"
                            ${
                                currentMember.joinSource === "Instagram"
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
                            name="joinSource"
                            value="Threads"
                            ${
                                currentMember.joinSource === "Threads"
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
                            name="joinSource"
                            value="Twitter"
                            ${
                                currentMember.joinSource === "Twitter" ||
                                currentMember.joinSource === "X / Twitter"
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
                            name="joinSource"
                            value="Facebook"
                            ${
                                currentMember.joinSource === "Facebook"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            📘 Facebook
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="joinSource"
                            value="社群群組"
                            ${
                                currentMember.joinSource === "社群群組"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            👥 社群群組
                        </span>

                    </label>


                    <label class="platform-option">

                        <input
                            type="radio"
                            name="joinSource"
                            value="朋友推薦"
                            ${
                                currentMember.joinSource === "朋友推薦"
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            👤 朋友推薦
                        </span>

                    </label>


                    <!-- 其他 -->

                    <label class="platform-option">

                        <input
                            type="radio"
                            name="joinSource"
                            value="其他"
                            id="joinSourceOtherRadio"
                            ${
                                ![
                                    "官方 LINE",
                                    "Instagram",
                                    "Threads",
                                    "Twitter",
                                    "X / Twitter",
                                    "Facebook",
                                    "社群群組",
                                    "朋友推薦"
                                ].includes(
                                    currentMember.joinSource
                                )
                                    ? "checked"
                                    : ""
                            }
                        >

                        <span>
                            ✨ 其他
                        </span>

                    </label>


                    <!-- 其他來源輸入 -->

                    <div class="other-source-input">

                        <input
                            type="text"
                            id="joinSourceOtherText"
                            placeholder="請輸入加入來源..."
                            value="${
                                ![
                                    "官方 LINE",
                                    "Instagram",
                                    "Threads",
                                    "Twitter",
                                    "X / Twitter",
                                    "Facebook",
                                    "社群群組",
                                    "朋友推薦"
                                ].includes(
                                    currentMember.joinSource
                                )
                                    ? escapeAttribute(
                                        currentMember.joinSource || ""
                                    )
                                    : ""
                            }"
                        >

                    </div>

                </div>

            </div>


            <!-- 推薦人 -->

            <div class="profile-box">

                <small>
                    👥 推薦人
                </small>

                <input
                    class="member-edit-input"
                    id="editReferrer"
                    type="text"
                    value="${escapeAttribute(
                        currentMember.referrerNickname || ""
                    )}"
                >

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
    // 「其他」加入來源
    // ==================================================

    const otherSourceRadio =
        document.getElementById(
            "joinSourceOtherRadio"
        );

    const otherSourceInput =
        document.getElementById(
            "joinSourceOtherText"
        );


    otherSourceRadio?.addEventListener(
    "change",
    () => {

        if (
            otherSourceRadio.checked
        ) {

            setTimeout(() => {

                otherSourceInput?.focus();

            }, 50);

        }

    }
);

  otherSourceInput?.addEventListener(
    "focus",
    () => {

        if (
            otherSourceRadio
        ) {

            otherSourceRadio.checked =
                true;

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
                        "joinSourceOtherText"
                    )
                    ?.value
                    .trim() || "其他";

        }


        const referrerNickname =
            document
                .getElementById(
                    "editReferrer"
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

                referrerNickname,

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

            referrerNickname,

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

if (memberSearch) {

    memberSearch.addEventListener(
        "input",
        event => {

            currentMember = null;

            editingMember = false;


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
