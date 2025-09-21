/* cart.js */
(function () {
  const CART_KEY = "ensCart";
  const USER_KEY = "ensUser";

  // 필요한 엘리먼트
  const listEl     = document.getElementById("cartList");     // 아이템 컨테이너
  const emptyEl    = document.getElementById("emptyState");   // 비었을 때 박스
  const subEl      = document.getElementById("subPrice");     // 소계
  const totalEl    = document.getElementById("totalPrice");   // 총계(배송/할인 없으면 소계 동일)
  const countEl    = document.getElementById("itemCount");    // 총 수량
  const checkoutEl = document.getElementById("checkoutBtn");  // 결제 버튼

  if (!listEl) return; // cart.html이 아닐 때는 종료

  const fmt = (n) => (Number(n) || 0).toLocaleString("ko-KR");

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function render() {
    const cart = loadCart();
    listEl.innerHTML = "";
    let sum = 0;
    let count = 0;

    if (cart.length === 0) {
      if (emptyEl) emptyEl.hidden = false;
    } else {
      if (emptyEl) emptyEl.hidden = true;

      cart.forEach(item => {
        sum   += item.price * item.qty;
        count += item.qty;

        const row = document.createElement("div");
        row.className = "cart-card";
        row.dataset.id = item.id;
        row.innerHTML = `
          <img src="${item.img || ""}" alt="">
          <div>
            <div class="cart-title">${item.title}</div>
            <div class="cart-price">₩${fmt(item.price)}</div>
          </div>
          <div class="cart-qty">
            <label class="visually-hidden" for="qty-${CSS.escape(item.id)}">수량</label>
            <input id="qty-${CSS.escape(item.id)}" class="qty-input" type="number" min="1" value="${item.qty}">
            <button type="button" class="button tertiary remove-btn">삭제</button>
          </div>
        `;
        listEl.appendChild(row);
      });
    }

    if (subEl)   subEl.textContent   = `₩${fmt(sum)}`;
    if (totalEl) totalEl.textContent = `₩${fmt(sum)}`;
    if (countEl) countEl.textContent = String(count);
    if (checkoutEl) checkoutEl.disabled = cart.length === 0;
  }

  // 수량 변경
  document.addEventListener("input", (e) => {
    const input = e.target.closest(".qty-input");
    if (!input) return;

    const card = input.closest(".cart-card");
    if (!card) return;
    const id = card.dataset.id;

    let qty = parseInt(input.value, 10);
    if (isNaN(qty) || qty < 1) { qty = 1; input.value = "1"; }

    const cart = loadCart();
    const i = cart.findIndex(x => x.id === id);
    if (i > -1) {
      cart[i].qty = qty;
      saveCart(cart);
      render();
    }
  });

  // 삭제 & 결제
  document.addEventListener("click", (e) => {
    // 삭제
    const rm = e.target.closest(".remove-btn");
    if (rm) {
      const card = rm.closest(".cart-card"); if (!card) return;
      const id = card.dataset.id;
      const cart = loadCart().filter(x => x.id !== id);
      saveCart(cart);
      render();
      return;
    }

    // 결제
    const pay = e.target.closest("#checkoutBtn");
    if (pay) {
      const user = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } })();
      if (!user) { alert("로그인 후 이용 가능합니다."); return; }

      const cart = loadCart();
      if (cart.length === 0) { alert("장바구니가 비어있어요."); return; }

      // 실제 결제 로직 대신 성공 가정
      alert("주문이 완료되었습니다! 감사합니다 🙌");
      saveCart([]);
      render();
    }
  });

  document.addEventListener("DOMContentLoaded", render);
  // 필요하면 다른 스크립트에서 호출할 수 있게 노출
  window.__ENS_CART__ = { render };
})();
