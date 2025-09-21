/* search.js */
(function () {
  const data = window.__ENS_SEARCH_DATA__ || [];
  const $q = document.getElementById("siteSearchInput");
  const $kw = document.getElementById("kw");
  const $results = document.getElementById("results");
  const $empty = document.getElementById("empty");
  const $count = document.getElementById("resultCount");
  const $pager = document.getElementById("pager");
  const $prev = document.getElementById("prevPage");
  const $next = document.getElementById("nextPage");
  const PAGE_SIZE = 12;

  const params = new URLSearchParams(location.search);
  const initialQuery = (params.get("q") || "").trim();
  let filterType = "all";
  let page = 1;
  let current = [];

  if ($q) $q.value = initialQuery;
  if ($kw) $kw.textContent = initialQuery || "(전체)";

  // 간단 점수: 제목 완전일치 > 제목 포함 > 태그 포함 > 설명 포함
  function score(item, terms) {
    let s = 0;
    const title = item.title.toLowerCase();
    const desc = (item.desc || "").toLowerCase();
    const tags = (item.tags || []).map(t => String(t).toLowerCase());
    const titleWords = title.split(/\s+/);

    for (const t of terms) {
      if (!t) continue;
      if (title === t) s += 10;
      else if (title.includes(t)) s += 6;
      if (tags.some(tag => tag.includes(t))) s += 4;
      if (desc.includes(t)) s += 2;
      if (titleWords.includes(t)) s += 1;
    }
    // 타입 가중치(선택): store/뉴스 등 원하는 카테고리에 가중치
    return s;
  }

  function tokenize(q) {
    return q.toLowerCase().split(/[,\s]+/).filter(Boolean);
  }

  function highlight(text, terms) {
    if (!terms.length) return text;
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp("(" + terms.map(esc).join("|") + ")", "gi");
    return text.replace(rx, "<mark>$1</mark>");
  }

  function applyFilter(results) {
    if (filterType === "all") return results;
    return results.filter(r => r.type === filterType);
  }

  function render() {
    const total = current.length;
    $count.textContent = `${total}건 검색됨`;
    if (!total) {
      $results.innerHTML = "";
      $empty.hidden = false;
      $pager.hidden = true;
      return;
    }
    $empty.hidden = true;

    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
    page = Math.min(page, maxPage);
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = current.slice(start, start + PAGE_SIZE);

    $results.innerHTML = pageItems.map(item => {
      const badge = item.type.toUpperCase();
      const img = item.image ? `<img src="${item.image}" alt="" style="width:100%;max-height:160px;object-fit:cover;border-radius:12px;">` : "";
      const price = item.price ? `<div class="meta"><strong>${item.price}</strong></div>` : "";
      return `
        <article class="result-card">
          <span class="badge">${badge}</span>
          ${img}
          <h3><a href="${item.url}">${item._titleHL}</a></h3>
          <p class="desc">${item._descHL || ""}</p>
          ${price}
          <a class="button text" href="${item.url}">바로가기</a>
        </article>`;
    }).join("");

    // pager
    if (maxPage > 1) {
      $pager.hidden = false;
      $prev.disabled = page <= 1;
      $next.disabled = page >= maxPage;
    } else {
      $pager.hidden = true;
    }
  }

  function runSearch(q) {
    const terms = tokenize(q);
    // 전체 검색(쿼리 비어도 전체)
    let res = data.map(item => ({
      ...item,
      _score: terms.length ? score(item, terms) : 1,
    }));
    if (terms.length) {
      res = res.filter(r => r._score > 0);
    }
    // 하이라이트 텍스트 생성
    res.forEach(r => {
      r._titleHL = terms.length ? highlight(r.title, terms) : r.title;
      r._descHL = r.desc ? (terms.length ? highlight(r.desc, terms) : r.desc) : "";
    });
    // 필터/정렬/페이징
    res.sort((a, b) => b._score - a._score || a.title.localeCompare(b.title));
    current = applyFilter(res);
    page = 1;
    render();
  }

  // 초기 검색 실행
  runSearch(initialQuery);

  // 필터 버튼
  document.querySelectorAll(".filters [data-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      filterType = btn.getAttribute("data-filter");
      page = 1;
      render();
    });
  });

  // 페이지 이동
  if ($prev) $prev.addEventListener("click", () => { page = Math.max(1, page - 1); render(); });
  if ($next) $next.addEventListener("click", () => { page = page + 1; render(); });

  // 주소창에서 q가 바뀌었을 때(사용자가 폼 다시 제출하는 경우)
  const form = document.getElementById("siteSearchForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      // 기본 서브밋 동작(페이지 이동) 유지 → search.html?q=... 으로 새로고침
      // 만약 이동 없이 same-page 갱신을 원하면 preventDefault() 후 runSearch 호출하면 됨.
    });
  }
})();
