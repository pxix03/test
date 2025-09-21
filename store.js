/* store.js */
(function () {
  const CART_KEY = "ensCart";
  const USER_KEY = "ensUser";
  const storeGrid = document.getElementById("storeGrid");
  if (!storeGrid) return;

  const priceToNumber = (str) => Number(String(str).replace(/[^\d]/g, "")) || 0;

  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]"); }
    catch { return []; }
  }
  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function addToCart(item) {
    const cart = loadCart();
    const idx = cart.findIndex(p => p.id === item.id);
    if (idx > -1) cart[idx].qty += item.qty;
    else cart.push(item);
    saveCart(cart);
  }

  storeGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // 로그인 체크
    const user = (() => { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } })();
    if (!user) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }

    const card = btn.closest(".store-card");
    if (!card) return;

    const title = card.querySelector("h3")?.textContent.trim() || "상품";
    const priceText = card.querySelector(".price")?.textContent || "₩0";
    const price = priceToNumber(priceText);
    const img = card.querySelector("img")?.src || "";

    // 안정적인 키를 위해 가능하면 data-id를 사용 (없으면 타이틀로 대체)
    const id = card.dataset.id || title;

    addToCart({ id, title, price, img, qty: 1 });
    alert("장바구니에 추가되었습니다!");
  });
})();
