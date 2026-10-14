// Загрузка уроков, проверка числовых ответов, вывод формул.

let manifestP = null;
const weekFiles = new Map();

export function loadManifest(){
  if (!manifestP) {
    manifestP = fetch("content/manifest.json", {cache: "no-cache"})
      .then((r) => (r.ok ? r.json() : {lessons: {}}))
      .catch(() => ({lessons: {}}));
  }
  return manifestP;
}

function loadWeekFile(name){
  if (!weekFiles.has(name)) {
    const p = fetch(`content/${name}.json`, {cache: "no-cache"}).then((r) => {
      if (!r.ok) throw new Error("not found");
      return r.json();
    });
    p.catch(() => weekFiles.delete(name));
    weekFiles.set(name, p);
  }
  return weekFiles.get(name);
}

// Урок целиком. Для итоговых тестов (mix) собирает задания из перечисленных уроков.
export async function getLesson(lid){
  const man = await loadManifest();
  const entry = man.lessons[lid];
  if (!entry) return null;
  if (entry.mix) {
    const parts = await Promise.all(entry.mix.map((id) => getLesson(id).catch(() => null)));
    const types = entry.types ? new Set(entry.types) : null;
    const problems = [];
    for (const L of parts) if (L) for (const p of L.problems) if (!types || types.has(p.type)) problems.push({...p, from: L.id});
    return {id: lid, title: entry.t, spec: [], theory: [], problems, mix: entry.mix,
            count: entry.count || 15, minutes: entry.minutes || (entry.count || 15) * 2, about: entry.about || "", plan: entry.plan || null};
  }
  const data = await loadWeekFile(entry.f);
  const L = data.lessons.find((x) => x.id === lid);
  if (!L) return null;
  for (const p of L.problems) p.from = L.id;
  return L;
}

export async function getProblem(key){
  const [lid, pid] = key.split(":");
  const L = await getLesson(lid);
  if (!L) return null;
  return L.problems.find((p) => p.id === pid) || null;
}

// ---------- Числа ----------

function gcd(a, b){ a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; }

// "3/4", "-2", "0,75", "1 5/12", "−3" -> {n, d} или null
export function parseNum(raw){
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[−–]/g, "-").replace(/[\s   ]+/g, " ").replace(/,/g, ".");
  s = s.replace(/\s*\/\s*/g, "/").replace(/^-\s+/, "-");
  // Без дроби пробелы — это разделители разрядов: «20 000» = 20000.
  if (!s.includes("/")) s = s.replace(/ /g, "");
  let m;
  if ((m = /^(-)?(\d+) (\d+)\/(\d+)$/.exec(s))) {
    const w = Number(m[2]), a = Number(m[3]), b = Number(m[4]);
    if (!b) return null;
    const n = (w * b + a) * (m[1] ? -1 : 1);
    return norm(n, b);
  }
  if ((m = /^(-?\d+)\/(-?\d+)$/.exec(s))) {
    const a = Number(m[1]), b = Number(m[2]);
    if (!b) return null;
    return norm(a, b);
  }
  if ((m = /^(-)?(\d*)\.?(\d*)$/.exec(s)) && (m[2] || m[3])) {
    const frac = m[3] || "";
    const d = 10 ** frac.length;
    const n = Number((m[2] || "0") + frac) * (m[1] ? -1 : 1);
    if (!isFinite(n) || frac.length > 9) return null;
    return norm(n, d);
  }
  return null;
}
function norm(n, d){
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return {n: n / g, d: d / g};
}
export function sameNum(a, b){
  const x = parseNum(a), y = parseNum(b);
  return !!x && !!y && x.n === y.n && x.d === y.d;
}
// Ответ «3/4» → «3/4», «-7» → «−7» для показа
export function showNum(s){
  return String(s).replace("-", "−");
}

// ---------- Формулы ----------

let katexReady = null;
function whenKatex(){
  if (window.renderMathInElement) return Promise.resolve(true);
  if (!katexReady) {
    katexReady = new Promise((resolve) => {
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if (window.renderMathInElement) { clearInterval(t); resolve(true); }
        else if (tries > 100) { clearInterval(t); resolve(false); }
      }, 100);
    });
  }
  return katexReady;
}

export function renderMath(el){
  const run = () => window.renderMathInElement(el, {
    delimiters: [
      {left: "\\[", right: "\\]", display: true},
      {left: "\\(", right: "\\)", display: false}
    ],
    // Дроби в строке печатаем крупно, как в учебнике: на телефоне мелкие \frac не читаются.
    preProcess: (math) => "\\displaystyle " + math,
    throwOnError: false
  });
  if (window.renderMathInElement) { run(); return; }
  whenKatex().then((ok) => { if (ok && el.isConnected) run(); });
}

// ---------- Разное ----------

export function shuffle(arr, rnd = Math.random){
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const LEVEL_NAME = {A: "Базовый", B: "Средний", C: "Сложный"};
export const LETTERS = "ABCDEF";
