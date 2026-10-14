// Состояние ученика и синхронизация через Firebase.
// state.done  — отмеченные пункты программы {id: true}
// state.mocks — баллы пробников [{id, d, s}]
// state.stats — результаты по урокам {id: {r: верно в практике, n: всего в практике, b: лучший тест, t: тестов}}
// state.errs  — задания с ошибкой {"w1-2:add3": "w1-2"}

import { firebaseConfig } from "../firebase-config.js";
import { VALID } from "./program.js";

const FIREBASE_VERSION = "11.0.2";
const STORE_KEY = "ent-algebra-progress-v1";
const ERR_RE = /^w\d{1,2}-[\dg]:[A-Za-z0-9_-]{1,40}$/;

export let state = {done:{}, mocks:[], stats:{}, errs:{}};
const listeners = new Set();
export function subscribe(fn){ listeners.add(fn); return () => listeners.delete(fn); }
function emit(){ for (const fn of listeners) fn(state); }

const num = (v) => (typeof v === "number" && isFinite(v) && v >= 0 ? Math.round(v) : 0);

export function normalize(o){
  const done = {}, mocks = [], stats = {}, errs = {};
  if (o && typeof o === "object") {
    if (o.done && typeof o.done === "object") {
      for (const k of Object.keys(o.done)) if (o.done[k] === true && VALID.has(k)) done[k] = true;
    }
    if (Array.isArray(o.mocks)) {
      for (const m of o.mocks) {
        if (m && typeof m.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(m.d) && typeof m.s === "number" && isFinite(m.s) && typeof m.id === "string") {
          mocks.push({id:m.id, d:m.d, s:m.s});
        }
      }
    }
    if (o.stats && typeof o.stats === "object") {
      for (const k of Object.keys(o.stats)) {
        const s = o.stats[k];
        if (!VALID.has(k) || !s || typeof s !== "object") continue;
        stats[k] = {r: num(s.r), n: num(s.n), b: num(s.b), t: num(s.t)};
      }
    }
    if (o.errs && typeof o.errs === "object") {
      for (const k of Object.keys(o.errs)) {
        if (ERR_RE.test(k) && typeof o.errs[k] === "string" && VALID.has(o.errs[k])) errs[k] = o.errs[k];
      }
    }
  }
  return {done, mocks: mocks.slice(-200), stats, errs};
}

function loadLocal(){
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) state = normalize(JSON.parse(raw)); } catch (e) {}
}
function saveLocal(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}
function commit(){ saveLocal(); emit(); }

// ---------- Действия ----------

// Пустые заглушки, пока Firebase не подключён: всё хранится локально.
const cloud = {
  setDone(){}, addMock(){}, removeMock(){}, practice(){}, test(){}, addErr(){}, removeErr(){}
};

export function setDone(k, on){
  if (!!state.done[k] === on) return;
  if (on) state.done[k] = true; else delete state.done[k];
  commit();
  cloud.setDone(k, on);
}
export function addMock(m){
  state.mocks.push(m);
  commit();
  cloud.addMock(m);
}
export function removeMock(m){
  state.mocks = state.mocks.filter((x) => x.id !== m.id);
  commit();
  cloud.removeMock(m);
}
function statOf(lid){ return state.stats[lid] || (state.stats[lid] = {r:0, n:0, b:0, t:0}); }

export function recordPractice(lid, correct){
  const s = statOf(lid);
  s.n += 1;
  if (correct) s.r += 1;
  commit();
  cloud.practice(lid, correct);
}
export function recordTest(lid, score){
  const s = statOf(lid);
  s.t += 1;
  const best = Math.max(s.b, score);
  s.b = best;
  commit();
  cloud.test(lid, best);
}
export function addErr(key, lid){
  if (state.errs[key]) return;
  state.errs[key] = lid;
  commit();
  cloud.addErr(key, lid);
}
export function removeErr(key){
  if (!state.errs[key]) return;
  delete state.errs[key];
  commit();
  cloud.removeErr(key);
}

// ---------- Синхронизация ----------

const sync = {kind: "local", text: "Прогресс хранится в этом браузере.", signedIn: false, ready: false};
export function syncInfo(){ return sync; }
let authAction = null;
export function authClick(){ if (authAction) authAction(); }

function setSync(kind, text){
  sync.kind = kind;
  sync.text = text;
  emit();
}

const AUTH_ERRORS = {
  "auth/unauthorized-domain": "Этот адрес сайта не добавлен в Firebase. Добавь его: Authentication → Settings → Authorized domains.",
  "auth/network-request-failed": "Нет интернета. Попробуй войти, когда появится связь.",
  "auth/configuration-not-found": "В Firebase не включён вход через Google: Authentication → Sign-in method → Google.",
  "auth/operation-not-allowed": "В Firebase не включён вход через Google: Authentication → Sign-in method → Google."
};

async function connectFirebase(){
  if (!firebaseConfig) {
    setSync("local", "Синхронизация ещё не настроена: прогресс хранится только в этом браузере.");
    return;
  }
  setSync("pending", "Подключаю синхронизацию…");
  const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  let appMod, authMod, fsMod;
  try {
    [appMod, authMod, fsMod] = await Promise.all([
      import(base + "firebase-app.js"),
      import(base + "firebase-auth.js"),
      import(base + "firebase-firestore.js")
    ]);
  } catch (e) {
    setSync("local", "Нет связи с сервером синхронизации. Прогресс сохраняется в этом браузере и отправится позже.");
    return;
  }

  const app = appMod.initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  let db;
  try {
    db = fsMod.initializeFirestore(app, {localCache: fsMod.persistentLocalCache({tabManager: fsMod.persistentMultipleTabManager()})});
  } catch (e) {
    db = fsMod.getFirestore(app);
  }
  const {doc, setDoc, onSnapshot, deleteField, arrayUnion, arrayRemove, increment} = fsMod;

  let ref = null;
  let unsub = null;
  let firstSnap = true;
  let who = "";

  const report = (err) => {
    const code = err && err.code;
    if (code === "permission-denied") setSync("error", "Firebase отклонил запись: проверь правила Firestore (файл firestore.rules).");
    else setSync("error", "Не удалось сохранить: " + (code || "ошибка") + ". Отметки остались в этом браузере.");
  };
  const write = (data) => { if (ref) setDoc(ref, data, {merge: true}).catch(report); };

  cloud.setDone = (k, on) => write({v: 1, done: {[k]: on ? true : deleteField()}});
  cloud.addMock = (m) => write({v: 1, mocks: arrayUnion({id: m.id, d: m.d, s: m.s})});
  cloud.removeMock = (m) => write({mocks: arrayRemove({id: m.id, d: m.d, s: m.s})});
  cloud.practice = (lid, ok) => write({stats: {[lid]: {n: increment(1), r: increment(ok ? 1 : 0)}}});
  cloud.test = (lid, best) => write({stats: {[lid]: {b: best, t: increment(1)}}});
  cloud.addErr = (key, lid) => write({errs: {[key]: lid}});
  cloud.removeErr = (key) => write({errs: {[key]: deleteField()}});

  authAction = async () => {
    if (auth.currentUser) { await authMod.signOut(auth); return; }
    const provider = new authMod.GoogleAuthProvider();
    try {
      await authMod.signInWithPopup(auth, provider);
    } catch (err) {
      const code = err && err.code;
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        try { await authMod.signInWithRedirect(auth, provider); } catch (e2) { setSync("error", AUTH_ERRORS[e2.code] || "Не получилось войти: " + (e2.code || "ошибка")); }
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setSync("error", AUTH_ERRORS[code] || "Не получилось войти: " + (code || "ошибка"));
      }
    }
  };
  sync.ready = true;
  authMod.getRedirectResult(auth).catch((err) => {
    if (err && err.code) setSync("error", AUTH_ERRORS[err.code] || "Не получилось войти: " + err.code);
  });

  authMod.onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    ref = null;
    if (!user) {
      sync.signedIn = false;
      setSync("local", "Войди через Google, и прогресс будет одинаковым на телефоне и компьютере. Пока он хранится только в этом браузере.");
      return;
    }
    sync.signedIn = true;
    who = user.displayName || user.email || "Google";
    setSync("pending", "Загружаю прогресс…");
    ref = doc(db, "progress", user.uid);
    firstSnap = true;
    unsub = onSnapshot(ref, {includeMetadataChanges: true}, (snap) => {
      const cloudState = normalize(snap.exists() ? snap.data() : {});
      if (firstSnap) {
        firstSnap = false;
        // То, что сделано до входа, добавляем в аккаунт, ничего не стирая.
        const patch = {v: 1};
        const addDone = {};
        for (const k of Object.keys(state.done)) if (!cloudState.done[k]) addDone[k] = true;
        if (Object.keys(addDone).length) patch.done = addDone;
        const cloudIds = new Set(cloudState.mocks.map((m) => m.id));
        const addMocks = state.mocks.filter((m) => !cloudIds.has(m.id)).map((m) => ({id: m.id, d: m.d, s: m.s}));
        if (addMocks.length) patch.mocks = arrayUnion(...addMocks);
        const addStats = {};
        for (const k of Object.keys(state.stats)) if (!cloudState.stats[k]) addStats[k] = state.stats[k];
        if (Object.keys(addStats).length) patch.stats = addStats;
        const addErrs = {};
        for (const k of Object.keys(state.errs)) if (!cloudState.errs[k]) addErrs[k] = state.errs[k];
        if (Object.keys(addErrs).length) patch.errs = addErrs;
        if (Object.keys(patch).length > 1) { write(patch); return; }
      }
      state = cloudState;
      saveLocal();
      if (snap.metadata.hasPendingWrites) setSync("pending", `Синхронизация включена · ${who} · изменения отправятся, как только будет интернет`);
      else setSync("cloud", `Синхронизация включена · ${who}`);
    }, (err) => {
      report(err);
    });
  });
}

export function initStore(){
  loadLocal();
  emit();
  connectFirebase();
}
