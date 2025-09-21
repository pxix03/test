/* header.js (견고 버전) */
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
    // 1) 루트 기준 절대경로 (http 서버 권장)
    const candidates = [
      "/partials/header.html",
      "./partials/header.html",
      "partials/header.html",
    ];
    for (const url of candidates) {
      try {
        return await tryFetch(url);
      } catch (e) {
        // 다음 후보로
      }
    }
    throw new Error("partials/header.html fetch 실패(모든 후보 경로)");
  }

  function mountHeader(html) {
    mount.innerHTML = html;

    // 현재 페이지 내비 강조
    const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".site-nav a").forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      if (href.endsWith(current)) a.setAttribute("aria-current", "page");
    });

    // 인증 상태 토글
    const callAuth = () => {
      if (window.__ENS_AUTH__?.applyAuthState) {
        window.__ENS_AUTH__.applyAuthState();
      } else {
        document.addEventListener("ens:auth:ready", () => {
          window.__ENS_AUTH__?.applyAuthState?.();
        }, { once: true });
      }
    };
    callAuth();
  }

  try {
    const html = await loadHeaderHTML();
    mountHeader(html);
  } catch (err) {
    console.error("[header] 주입 실패:", err);
    // file:// 폴백 안내 + 최소 헤더
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
  // 브라우저가 이전 스크롤 위치를 보존하지 않도록
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // 해시가 있으면 헤더 높이를 감안해 보정
  function adjustHashScrollForHeader() {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    const header = document.querySelector('.site-header');
    if (!target || !header) return;

    // target으로 스크롤한 뒤 헤더 높이만큼 위로 올려서 가림 방지
    target.scrollIntoView({ block: 'start' });
    const h = header.offsetHeight || 0;
    window.scrollBy(0, -h);
  }

  // 헤더 주입 직후 호출
  adjustHashScrollForHeader();

  // 로고 클릭 시 항상 최상단부터 보이도록(해시 제거)
  document.addEventListener('click', (e) => {
    const logo = e.target.closest('a.logo');
    if (!logo) return;
    e.preventDefault();
    // 홈으로 이동 + 최상단 고정
    window.location.href = 'index.html';
    window.scrollTo({ top: 0, behavior: 'auto' });
  });

    // 폴백에서도 인증 상태 반영
    window.__ENS_AUTH__?.applyAuthState?.();
  }
})();
