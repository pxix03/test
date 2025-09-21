/* users.js */
(function () {
  const USERS_KEY = "ensUsers"; // { [email]: { displayName, passHash } }

  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveUsers(map) {
    localStorage.setItem(USERS_KEY, JSON.stringify(map));
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isStrongPassword(pw) {
    // 최소 6자 + 공백 금지 (원하면 규칙 강화 가능)
    return typeof pw === "string" && pw.length >= 6 && !/\s/.test(pw);
  }

  async function createUser({ email, displayName, password }) {
    if (!isValidEmail(email)) throw new Error("올바른 이메일을 입력해주세요.");
    if (!displayName?.trim()) throw new Error("닉네임을 입력해주세요.");
    if (!isStrongPassword(password)) throw new Error("비밀번호는 6자 이상, 공백 없이 입력해주세요.");

    const users = loadUsers();
    if (users[email]) throw new Error("이미 가입된 이메일입니다.");

    const passHash = await sha256(password);
    users[email] = { displayName: displayName.trim(), passHash };
    saveUsers(users);
    return { email, displayName };
  }

  async function verifyUser({ email, password }) {
    const users = loadUsers();
    const u = users[email];
    if (!u) throw new Error("등록되지 않은 이메일입니다.");

    const passHash = await sha256(password);
    if (passHash !== u.passHash) throw new Error("비밀번호가 올바르지 않습니다.");

    return { email, displayName: u.displayName };
  }

  // 외부 사용
  window.__ENS_USERS__ = {
    createUser,
    verifyUser,
    isValidEmail,
    isStrongPassword,
  };
})();
