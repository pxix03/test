// row-scroll.js v9 — 임계치 기반 드래그/클릭 분리 + 버튼 표시 정확
(() => {
  function setupRowShell(shell) {
    const row = shell.querySelector('.row-scroll');
    if (!row) return;

    const prevBtn = shell.querySelector('.row-nav2.prev');
    const nextBtn = shell.querySelector('.row-nav2.next');

    // --- 위치 판정 (DOM 박스 기준) ---
    const isAtStart = () => {
      const first = row.firstElementChild;
      if (!first) return true;
      const rr = row.getBoundingClientRect();
      const fr = first.getBoundingClientRect();
      return fr.left - rr.left >= -4;
    };
    const isAtEnd = () => {
      const last = row.lastElementChild;
      if (!last) return true;
      const rr = row.getBoundingClientRect();
      const lr = last.getBoundingClientRect();
      return rr.right - lr.right >= -4;
    };

    function updateArrows() {
      if (prevBtn) prevBtn.hidden = isAtStart();
      if (nextBtn) nextBtn.hidden = isAtEnd();
    }

    // 초기 상태
    if (row.scrollLeft !== 0) row.scrollLeft = 0;
    if (prevBtn) prevBtn.hidden = true;
    if (nextBtn) nextBtn.hidden = false;

    const reflowOnce = () => requestAnimationFrame(() => requestAnimationFrame(updateArrows));
    reflowOnce();

    row.addEventListener('scroll', updateArrows, { passive: true });
    const refresh = () => reflowOnce();
    window.addEventListener('resize', refresh);
    window.addEventListener('pageshow', refresh);
    shell.querySelectorAll('img').forEach(img => {
      if (img.complete) return;
      img.addEventListener('load', refresh, { once: true });
      img.addEventListener('error', refresh, { once: true });
    });

    // --- 버튼 클릭(페이지 단위) ---
    const page = () => Math.max(280, Math.round(row.clientWidth * 0.9));
    if (prevBtn) prevBtn.addEventListener('click', () => row.scrollBy({ left: -page(), behavior: 'smooth' }));
    if (nextBtn) prevBtn && nextBtn.addEventListener('click', () => row.scrollBy({ left:  page(), behavior: 'smooth' }));

    // --- 휠을 가로 스크롤로 ---
    row.addEventListener('wheel', (e) => {
      if (e.ctrlKey) return;
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (!dx) return;
      if ((dx < 0 && isAtStart()) || (dx > 0 && isAtEnd())) return;
      e.preventDefault();
      row.scrollLeft += dx;
    }, { passive: false });

    // --- 드래그 스크롤 (임계치 기반으로 클릭 보존) ---
    const DRAG_THRESHOLD = 6; // px
    let dragging = false, moved = false, startX = 0, startLeft = 0, lastDragEndAt = 0;

    row.addEventListener('pointerdown', (e) => {
      // 스크롤 영역에서만
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = row.scrollLeft;
      // 여기서는 pointer capture 걸지 않음 (임계치 넘길 때만)
    }, { passive: true });

    row.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;

      // 임계치 전: 아무것도 막지 않음 → 클릭 살아있음
      if (!moved && Math.abs(dx) <= DRAG_THRESHOLD) return;

      // 임계치 초과: 드래그 전환
      if (!moved) {
        moved = true;
        try { row.setPointerCapture(e.pointerId); } catch {}
        row.classList.add('is-dragging');
      }

      // 드래그 중에만 기본동작 차단 + 스크롤
      e.preventDefault();
      row.scrollLeft = startLeft - dx;
    }, { passive: false });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;

      if (moved) {
        // 드래그 직후 발생할 synthetic click 억제용 타임스탬프
        lastDragEndAt = performance.now();
      }
      moved = false;
      row.classList.remove('is-dragging');
      try { e && row.releasePointerCapture && row.releasePointerCapture(e.pointerId); } catch {}
    };

    row.addEventListener('pointerup', endDrag, { passive: true });
    row.addEventListener('pointercancel', endDrag, { passive: true });

    // 드래그 후 발생하는 클릭 억제 (캡처 단계에서 짧게 차단)
    row.addEventListener('click', (e) => {
      if (performance.now() - lastDragEndAt < 120) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true); // capture

    reflowOnce();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.row-shell').forEach(setupRowShell);
  });
})();
