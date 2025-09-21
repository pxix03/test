/* auth.js
 * 공통 인증/헤더 토글 스크립트
 * - localStorage 로 로그인 상태 유지
 * - 헤더(로그인/닉네임/장바구니/로그아웃) 표시 토글
 * - 스토어 로그인 배너(storeLocked) 토글
 * - header.js 로 헤더를 동적 주입해도 동작하도록 공개 API/이벤트 지원
 */

(function () {
  const STORAGE_KEY_USER = "ensUser";
  const STORAGE_KEY_CART = "ensCart";

  // ===== Storage helpers =====
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_USER) || "null");
    } catch {
      return null;
    }
  }

  function setUser(user) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    // 로그인 직후 UI 갱신
    applyAuthState();
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  function isLoggedIn() {
    return !!getUser();
  }

  // ===== UI toggle =====
  function applyAuthState() {
    const user = getUser();
    const loggedIn = !!user;

    // 헤더 요소들(동적 주입되었을 수도 있으니 매번 query)
    const loginBtn  = document.getElementById("loginButton");
    const userChip  = document.getElementById("userChip");
    const userName  = document.getElementById("userName");
    const cartBtn   = document.getElementById("cartButton");
    const logoutBtn = document.getElementById("logoutButton");

    if (loginBtn)  loginBtn.hidden  = loggedIn;
    if (userChip)  userChip.hidden  = !loggedIn;
    if (cartBtn)   cartBtn.hidden   = !loggedIn;
    if (logoutBtn) logoutBtn.hidden = !loggedIn;
    if (userName)  userName.textContent = loggedIn ? `${user.displayName} 님` : "";

    // 스토어 로그인 안내 배너(있을 때만 제어)
    // 비로그인도 상품은 보이게 할 수 있으므로, 여기서는 배너만 제어
    const storeLocked = document.getElementById("storeLocked");
    if (storeLocked) storeLocked.hidden = loggedIn;
  }

  // ===== Event bindings =====
  // 로그아웃 (동적 헤더에도 대응: document level 위임)
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#logoutButton");
    if (!btn) return;

    // 실제 로그아웃
    clearUser();
    // 장바구니 비우기(요구사항에 맞게 유지)
    localStorage.removeItem(STORAGE_KEY_CART);

    applyAuthState();
  });

  // 초기 로드 시 상태 적용
  document.addEventListener("DOMContentLoaded", () => {
    applyAuthState();
    // header.js 같은 동적 주입 스크립트가 기다릴 수 있도록 신호 전송
    document.dispatchEvent(new CustomEvent("ens:auth:ready"));
  });

  // ===== Public API =====
  window.__ENS_AUTH__ = {
    // 상태/저장 API
    getUser,
    setUser,
    clearUser,
    isLoggedIn,
    // UI 갱신 API (헤더가 주입된 후에도 외부에서 호출 가능)
    applyAuthState,
  };
})();
