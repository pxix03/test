/* signup.js */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signupForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nickname = document.getElementById("nickname").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const user = await window.__ENS_USERS__.createUser({
        email,
        displayName: nickname,
        password,
      });
      // 가입 성공 → 로그인 상태로 전환
      window.__ENS_AUTH__.setUser({ displayName: user.displayName, email: user.email });
      alert("회원가입이 완료되었습니다. 반갑습니다!");
      location.href = "index.html";
    } catch (err) {
      alert(err.message || "회원가입 중 오류가 발생했습니다.");
    }
  });
});
