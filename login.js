/* login.js */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const user = await window.__ENS_USERS__.verifyUser({ email, password });
      window.__ENS_AUTH__.setUser({ displayName: user.displayName, email: user.email });
      alert("로그인 성공!");
      location.href = "index.html";
    } catch (err) {
      alert(err.message || "로그인에 실패했습니다.");
    }
  });
});
