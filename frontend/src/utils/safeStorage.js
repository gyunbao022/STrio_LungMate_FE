// frontend/src/utils/safeStorage.js
// 안전한 localStorage 접근 + 메모리 폴백

const memory = new Map();

function storageAvailable() {
  try {
    if (typeof window === "undefined") return false;
    // 일부 환경은 window.localStorage 참조만으로도 throw 가능 → 전부 try 안에
    const ls = window.localStorage;
    const k = "__safe_storage_probe__";
    ls.setItem(k, "1");
    ls.removeItem(k);
    return true;
  } catch (_) {
    return false;
  }
}

const safeStorage = {
  getItem(key) {
    try {
      if (storageAvailable()) {
        return window.localStorage.getItem(key);
      }
      return memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  },

  setItem(key, value) {
    try {
      if (storageAvailable()) {
        window.localStorage.setItem(key, String(value));
      } else {
        memory.set(key, String(value));
      }
    } catch {
      memory.set(key, String(value));
    }
  },

  removeItem(key) {
    try {
      if (storageAvailable()) {
        window.localStorage.removeItem(key);
      } else {
        memory.delete(key);
      }
    } catch {
      memory.delete(key);
    }
  },

  clear() {
    try {
      if (storageAvailable()) {
        window.localStorage.clear();
      } else {
        memory.clear();
      }
    } catch {
      memory.clear();
    }
  },

  // 편의 메서드 (JSON)
  getJSON(key, fallback = null) {
    const raw = safeStorage.getItem(key);
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  setJSON(key, obj) {
    try {
      safeStorage.setItem(key, JSON.stringify(obj));
    } catch {
      // 폴백은 setItem에서 처리됨
    }
  },
};

export default safeStorage;
