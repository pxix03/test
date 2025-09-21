// cards-link.js v4 — 위임 방식 + 드래그/클릭 완전 분리
(() => {
  const sectionToHref = {
    esports:   'esports.html',
    basketball:'basketball.html',
    football:  'football.html',
    news:      'news.html',
    matches:   'matches.html',
    store:     'store.html'
  };

  // 카드 내부의 a/button/폼 요소는 원래 동작 유지
  const isInteractive = (el) => !!el.closest('a, button, input, textarea, select, label');

  // 드래그 감지 플래그를 row-scroll 컨테이너 기준으로 관리
  const DRAG_THRESHOLD = 6; // px
  let dragInfo = null; // {x, y, scroller}

  // pointerdown: 시작점 기록
  document.addEventListener('pointerdown', (e) => {
    const scroller = e.target.closest('.row-scroll');
    if (!scroller) { dragInfo = null; return; }
    dragInfo = { x: e.clientX, y: e.clientY, scroller, dragging: false };
  }, { passive: true });

  // pointermove: 임계치 넘으면 드래그로 간주
  document.addEventListener('pointermove', (e) => {
    if (!dragInfo) return;
    const dx = Math.abs(e.clientX - dragInfo.x);
    const dy = Math.abs(e.clientY - dragInfo.y);
    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      dragInfo.dragging = true;
    }
  }, { passive: true });

  // pointerup: 드래그 종료
  document.addEventListener('pointerup', () => {
    // pointerup 직후 click가 발생하므로 여기서는 플래그만 유지
    // click 처리 후 아래 click 핸들러에서 dragInfo를 null로 초기화
  }, { passive: true });

  // click: 최종적으로 여기서만 페이지 이동 처리
  document.addEventListener('click', (e) => {
    // 카드 요소만 타깃
    const card = e.target.closest('.player-card, .news-card, .score-card, .store-card');
    if (!card) { dragInfo = null; return; }

    // 카드 안의 a/button 등은 기본 동작 유지 (장바구니 버튼, '원문 열기' 등)
    if (isInteractive(e.target)) { dragInfo = null; return; }

    // 드래그 중이었으면 클릭 처리하지 않음
    if (dragInfo && dragInfo.dragging) { dragInfo = null; return; }

    // 섹션별 라우팅
    const sec = card.closest('section');
    if (!sec) { dragInfo = null; return; }
    const href = sectionToHref[sec.id];
    if (!href) { dragInfo = null; return; }

    // 이동
    window.location.href = href;
    dragInfo = null;
  });

  // 접근성(키보드) — 카드들에 role/tabindex 부여
  function enhanceCards() {
    document.querySelectorAll('.player-card, .news-card, .score-card, .store-card').forEach((card) => {
      // 이미 링크(a) 자식만 있는 카드면 굳이 role 부여 안 해도 됨
      if (!card.hasAttribute('tabindex')) card.setAttribute('tabindex', '0');
      if (!card.hasAttribute('role')) card.setAttribute('role', 'link');
      card.style.cursor = 'pointer';

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const sec = card.closest('section');
          if (!sec) return;
          const href = sectionToHref[sec.id];
          if (href) window.location.href = href;
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', enhanceCards);
})();
