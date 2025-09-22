/* header.js — 견고+정리 버전 (공통 후처리 분리, 현재 페이지 강조 보강, 인증 상태 안전 호출) */
(async function () {
  const mount = document.getElementById("app-header");
  if (!mount) return;

  const isFile = location.protocol === "file:";

  async function tryFetch(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  }

  async function loadHeaderHTML() {
    // 서버 환경 권장. 파일 경로는 프로젝트 구조에 맞춰 후보로 시도
    const candidates = [
      "/partials/header.html",
      "./partials/header.html",
      "partials/header.html",
    ];
    for (const url of candidates) {
      try {
        return await tryFetch(url);
      } catch {
        // 다음 후보로
      }
    }
    throw new Error("partials/header.html fetch 실패(모든 후보 경로)");
  }

  function applyCurrentPageHighlight() {
    // 해시/쿼리 제거 + index.html 정규화
    const path = location.pathname;
    const file = (path.split("/").pop() || "index.html").toLowerCase();
    const normalized =
      file === "" || file === "/" ? "index.html" : file;

    document.querySelectorAll(".site-nav a").forEach(a => {
      const raw = (a.getAttribute("href") || "").toLowerCase();
      // a.href가 절대경로일 수 있어 파일명만 비교
      const hrefFile = raw.split("#")[0].split("?")[0].split("/").pop() || "index.html";
      if (hrefFile === normalized) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  }

  function callAuthApply() {
    // 이미 준비됐으면 즉시, 아니면 준비 이벤트 기다렸다가 1회 호출
    if (window.__ENS_AUTH__?.applyAuthState) {
      window.__ENS_AUTH__.applyAuthState();
    } else {
      document.addEventListener(
        "ens:auth:ready",
        () => window.__ENS_AUTH__?.applyAuthState?.(),
        { once: true }
      );
    }
  }

  function mountHeader(html) {
    mount.innerHTML = html;
    applyCurrentPageHighlight();
    callAuthApply();
  }

  function mountFallbackHeader() {
    const warn = isFile
      ? `<div style="padding:12px;border:1px dashed #f66;border-radius:8px;background:rgba(255,0,0,.08)">
           ⚠️ file:// 환경에선 fetch가 차단됩니다. 간단 서버로 열어주세요(예: <code>npx http-server</code>).
         </div>`
      : `<div style="padding:12px;border:1px dashed #f66;border-radius:8px;background:rgba(255,0,0,.08)">
           ⚠️ <code>partials/header.html</code> 경로를 확인하세요.
         </div>`;

    mount.innerHTML = `
      <header class="site-header">
        <div class="inner header-top row-compact">
          <a href="index.html#hero" class="logo">ENS<span>Sports</span></a>
          <form class="site-search" action="search.html" method="get" role="search">
            <input type="search" name="q" placeholder="검색 (선수, 뉴스, 팀, 상품…)" />
            <button type="submit" class="button primary">검색</button>
          </form>
          <div class="auth-controls">
            <a href="login.html" class="button tertiary" id="loginButton">로그인</a>
            <div class="user-chip" id="userChip" hidden><span id="userName"></span></div>
            <a href="cart.html" class="button secondary" id="cartButton" hidden>장바구니</a>
            <button type="button" class="button tertiary" id="logoutButton" hidden>로그아웃</button>
          </div>
        </div>
        <div class="inner header-nav">
          <nav class="site-nav" aria-label="주요 탐색">
            <a href="esports.html">리그 오브 레전드</a>
            <a href="basketball.html">NBA</a>
            <a href="football.html">EPL</a>
            <a href="news.html">뉴스</a>
            <a href="matches.html">경기 결과</a>
            <a href="store.html">스토어</a>
          </nav>
        </div>
      </header>
      ${warn}
    `;
    applyCurrentPageHighlight();
    callAuthApply();
  }

  // --- 실제 실행 ---
  try {
    const html = await loadHeaderHTML();
    mountHeader(html);
  } catch (err) {
    console.error("[header] 주입 실패:", err);
    mountFallbackHeader();
  }

  // ===== 공통 후처리 (성공/폴백 모두에서 동작해야 하는 것들) =====

  // 브라우저가 이전 스크롤 위치를 보존하지 않도록
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  // 해시가 있으면 헤더 높이를 감안해 보정
  function adjustHashScrollForHeader() {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    const header = document.querySelector(".site-header");
    if (!target || !header) return;

    target.scrollIntoView({ block: "start" });
    const h = header.offsetHeight || 0;
    window.scrollBy(0, -h);
  }
  // 헤더 주입 직후 호출
  adjustHashScrollForHeader();

  // 로고 클릭 시 항상 최상단부터 보이도록(해시 제거)
  document.addEventListener("click", (e) => {
    const logo = e.target.closest("a.logo");
    if (!logo) return;
    e.preventDefault();
    window.location.href = "index.html";
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  // (선택) 헤더가 준비됐음을 알리는 이벤트 — 다른 모듈이 필요 시 참조
  window.dispatchEvent(new CustomEvent("ens:header:ready"));
})();
