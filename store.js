/* store.js — gate 강제 유지 + 클릭 시 재노출 (fixed: no real disabled) */
(() => {
  const CART_KEY = "ensCart";
  const USER_KEY = "ensUser";

  const priceToNumber = (str) => Number(String(str).replace(/[^\d]/g, "")) || 0;
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); }
    catch { return null; }
  };
  const loadCart = () => {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  };
  const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));

  function addToCart(item) {
    const cart = loadCart();
    const idx = cart.findIndex(p => p.id === item.id);
    if (idx > -1) cart[idx].qty += item.qty;
    else cart.push(item);
    saveCart(cart);
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));
  }

  // 로그인 여부에 따라 게이트/버튼 상태 적용 (실제 disabled 금지)
  function applyLoginGate() {
    const user = getUser();
    const locked = document.getElementById("storeLocked");
    const buttons = document.querySelectorAll(".store-card .button");

    const isLoggedIn = !!user;

    if (locked) {
      // 로그인 시 숨김, 비로그인 시 표시
      locked.hidden = isLoggedIn;
    }

    buttons.forEach(b => {
      if (!isLoggedIn) {
        // 실제 disabled 대신 잠금 표시만
        b.classList.add("is-locked");
        b.setAttribute("aria-disabled", "true");
        b.title = "로그인 후 이용 가능";
        // 혹시 다른 코드에서 disabled 걸었으면 제거
        b.disabled = false;
      } else {
        b.classList.remove("is-locked");
        b.removeAttribute("aria-disabled");
        b.title = "";
        b.disabled = false;
      }
    });
  }

  // 문서 전체 클릭 캡처: 잠금 버튼이면 게이트 강제 노출
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".store-card .button");
    if (!btn) return;

    const user = getUser();
    const isLocked = btn.classList.contains("is-locked") || btn.getAttribute("aria-disabled") === "true";

    // 비로그인/잠금: 게이트 노출 + 알림
    if (!user || isLocked) {
      const locked = document.getElementById("storeLocked");
      if (locked) {
        locked.hidden = false;
        locked.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      alert("로그인 후 이용 가능합니다.");
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // 로그인: 장바구니 추가
    const card = btn.closest(".store-card");
    if (!card) return;

    const id = card.dataset.id || (card.querySelector("h3")?.textContent.trim() ?? "상품");
    const title = card.dataset.title || (card.querySelector("h3")?.textContent.trim() ?? "상품");
    const price = card.dataset.price ? Number(card.dataset.price)
                : priceToNumber(card.querySelector(".price")?.textContent || "₩0");
    const img = card.dataset.img || card.querySelector("img")?.src || "";

    addToCart({ id, title, price, img, qty: 1 });
    alert("장바구니에 추가되었습니다!");
  }, true); // <- 캡처 단계에서 먼저 잡아 더 안전하게

  document.addEventListener("DOMContentLoaded", applyLoginGate);
  window.addEventListener("storage", (e) => {
    if (e.key === USER_KEY) applyLoginGate();
  });

  // 헤더 등 외부 스크립트에서 강제 재적용할 수 있도록 메서드 노출
  window.ENS = window.ENS || {};
  window.ENS.refreshStoreLoginGate = applyLoginGate;
})();
