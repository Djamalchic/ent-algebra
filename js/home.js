// Главная: «Сейчас», программа по неделям со ссылками на уроки, пробники.

import { STAGES, WEEKS, ALL_IDS, fmtRange, currentWeek, todayISO, fmtISO, pad2 } from "./program.js";
import { state, subscribe, setDone, addMock, removeMock, syncInfo, authClick } from "./store.js";
import { loadManifest } from "./content.js";

const NOW = currentWeek();
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lessons = {};
const weekEls = {};

export function goToWeek(n){
  const el = weekEls[n];
  if (!el) return;
  el.open = true;
  el.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block: "start"});
}

export function initHome(){
  buildPlan();
  buildNow();
  initMocks();
  document.getElementById("auth-btn").addEventListener("click", authClick);
  subscribe(applyState);
  applyState();
  loadManifest().then((m) => { lessons = m.lessons || {}; addLessonLinks(); applyState(); });
}

function buildPlan(){
  const stagesEl = document.getElementById("stages");
  for (const st of STAGES) {
    const sec = document.createElement("div");
    sec.className = "stage";
    const head = document.createElement("div");
    head.className = "stage-head";
    head.innerHTML = '<span class="range"></span><h3></h3><p></p>';
    head.children[0].textContent = st.range;
    head.children[1].textContent = st.name;
    head.children[2].textContent = st.about;
    sec.appendChild(head);

    for (const w of WEEKS.filter((x) => x.s === st.id)) {
      const d = document.createElement("details");
      d.className = "week" + (w.n === NOW.n ? " is-now" : "");
      d.id = "w-" + w.n;
      if (w.n === NOW.n) d.open = true;
      const chip = w.n === NOW.n ? `<span class="chip">${NOW.before ? "старт" : "сейчас"}</span>` : "";
      const specHtml = w.spec.length ? "Темы спецификации: " + w.spec.map((s) => `<code>${s}</code>`).join(" ") + " · " : "";
      let tasksHtml = w.tasks.map((txt, j) => {
        const k = w.ids[j];
        return `<li data-item="${k}"><input type="checkbox" id="c-${k}" data-k="${k}"><label for="c-${k}">${txt}</label><span class="ilink"></span></li>`;
      }).join("");
      const gk = w.ids[w.ids.length - 1];
      tasksHtml += `<li data-item="${gk}"><input type="checkbox" id="c-${gk}" data-k="${gk}"><label for="c-${gk}"><span class="tag">Сб · геометрия</span>${w.geo}</label><span class="ilink"></span></li>`;
      d.innerHTML =
        `<summary><span class="wk"><b>Неделя ${pad2(w.n)}</b><span>${fmtRange(w.n)}</span></span>` +
        `<span class="wtitle">${w.t}${chip}</span>` +
        `<span class="wcount" data-count="${w.n}">0/${w.ids.length}</span></summary>` +
        `<div class="wbody"><p class="meta">${specHtml}Справочно: ${w.book}</p>` +
        `<ul class="tasks">${tasksHtml}</ul></div>`;
      sec.appendChild(d);
      weekEls[w.n] = d;
    }
    stagesEl.appendChild(sec);
  }
  stagesEl.addEventListener("change", (e) => {
    const cb = e.target;
    if (cb && cb.dataset && cb.dataset.k) setDone(cb.dataset.k, cb.checked);
  });

  const strip = document.getElementById("strip");
  for (const w of WEEKS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cell" + (w.n === NOW.n ? " now" : "");
    b.setAttribute("aria-label", `Неделя ${w.n}: ${w.t}`);
    b.title = `Неделя ${w.n} · ${fmtRange(w.n)} · ${w.t}`;
    b.addEventListener("click", () => goToWeek(w.n));
    strip.appendChild(b);
  }
}

function addLessonLinks(){
  document.querySelectorAll("li[data-item]").forEach((li) => {
    const k = li.dataset.item;
    const slot = li.querySelector(".ilink");
    slot.innerHTML = "";
    const L = lessons[k];
    if (!L) return;
    const a = document.createElement("a");
    a.href = `#/l/${k}`;
    a.className = "lnk";
    a.textContent = L.mix ? "Тест →" : "Урок →";
    slot.append(a);
  });
}

function buildNow(){
  const w = WEEKS[NOW.n - 1];
  const label = document.getElementById("now-label");
  const title = document.getElementById("now-title");
  const link = document.getElementById("now-link");
  if (NOW.before) {
    label.textContent = "Старт 19 октября";
    title.textContent = `Неделя 1 — ${w.t}`;
  } else if (NOW.after) {
    label.textContent = "Программа пройдена";
    title.textContent = "Дальше — только ЕНТ. Удачи!";
  } else {
    label.textContent = `Сейчас · неделя ${NOW.n} из ${WEEKS.length}`;
    title.textContent = `${fmtRange(NOW.n)} — ${w.t}`;
  }
  link.href = "#w-" + NOW.n;
  link.addEventListener("click", (e) => { e.preventDefault(); goToWeek(NOW.n); });
}

function applyState(){
  let total = 0;
  document.querySelectorAll("ul.tasks input[type=checkbox]").forEach((cb) => { cb.checked = !!state.done[cb.dataset.k]; });
  const strip = document.getElementById("strip");
  for (const w of WEEKS) {
    const c = w.ids.filter((id) => state.done[id]).length;
    total += c;
    const el = document.querySelector(`[data-count="${w.n}"]`);
    el.textContent = (c === w.ids.length ? "✓ " : "") + c + "/" + w.ids.length;
    el.classList.toggle("full", c === w.ids.length);
    strip.children[w.n - 1].style.setProperty("--p", (c / w.ids.length).toFixed(3));
  }
  const pct = Math.round(total / ALL_IDS.length * 100);
  document.getElementById("overall").textContent = `Отмечено ${total} из ${ALL_IDS.length} пунктов · ${pct}%`;

  document.querySelectorAll("li[data-item]").forEach((li) => {
    const s = state.stats[li.dataset.item];
    const a = li.querySelector(".lnk");
    if (!a) return;
    let badge = li.querySelector(".ibadge");
    if (s && s.t) {
      if (!badge) { badge = document.createElement("span"); badge.className = "ibadge"; a.after(badge); }
      badge.textContent = `тест ${s.b}%`;
      badge.classList.toggle("good", s.b >= 80);
    } else if (badge) badge.remove();
  });

  const errCount = Object.keys(state.errs).length;
  const errLink = document.getElementById("nav-errs");
  if (errLink) errLink.textContent = errCount ? `Ошибки · ${errCount}` : "Ошибки";

  const info = syncInfo();
  const sync = document.getElementById("sync");
  sync.dataset.state = info.kind;
  sync.textContent = info.text;
  const btn = document.getElementById("auth-btn");
  btn.hidden = !info.ready;
  btn.textContent = info.signedIn ? "Выйти" : "Войти через Google";

  renderMocks();
}

// ---------- Пробники ----------

let mockChart, mockList, mockEmpty;
const sortedMocks = () => state.mocks.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));

function initMocks(){
  const form = document.getElementById("mock-form");
  const date = document.getElementById("mock-date");
  const score = document.getElementById("mock-score");
  const msg = document.getElementById("mock-msg");
  mockChart = document.getElementById("mock-chart");
  mockList = document.getElementById("mock-list");
  mockEmpty = document.getElementById("mock-empty");
  date.value = todayISO();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = date.value, s = Number(score.value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { msg.textContent = "Укажи дату пробника."; return; }
    if (score.value === "" || !isFinite(s) || s < 0 || s > 50 || Math.round(s) !== s) { msg.textContent = "Балл — целое число от 0 до 50."; return; }
    msg.textContent = "";
    score.value = "";
    addMock({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d, s});
  });
  let resizeT = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => drawChart(sortedMocks().slice(-12)), 150);
  });
}

function renderMocks(){
  const list = sortedMocks();
  mockEmpty.hidden = list.length > 0;
  mockList.innerHTML = "";
  for (const m of list.slice().reverse()) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${fmtISO(m.d, true)} — ${m.s} / 50`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Удалить";
    btn.addEventListener("click", () => {
      if (btn.dataset.armed === "1") {
        removeMock(m);
      } else {
        btn.dataset.armed = "1";
        btn.textContent = "Точно удалить?";
        setTimeout(() => { if (btn.isConnected) { btn.dataset.armed = "0"; btn.textContent = "Удалить"; } }, 4000);
      }
    });
    li.append(span, btn);
    mockList.appendChild(li);
  }
  drawChart(list.slice(-12));
}

function drawChart(list){
  if (!list.length) { mockChart.hidden = true; mockChart.innerHTML = ""; return; }
  mockChart.hidden = false;
  const W = Math.max(300, Math.round(mockChart.clientWidth || 600)), H = 190;
  const padL = 30, padR = 6, padT = 22, padB = 26;
  const iw = W - padL - padR, ih = H - padT - padB;
  const n = list.length, slot = iw / n, bw = Math.min(44, slot * 0.62);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Баллы пробников по датам">`;
  for (const t of [0, 10, 20, 30, 40, 50]) {
    const y = padT + ih * (1 - t / 50);
    s += `<line class="gl" x1="${padL}" x2="${W - padR}" y1="${y}" y2="${y}"/>`;
    s += `<text class="ax" x="${padL - 6}" y="${y + 4}" text-anchor="end">${t}</text>`;
  }
  list.forEach((m, i) => {
    const score = Math.max(0, Math.min(50, Math.round(m.s)));
    const x = padL + slot * i + (slot - bw) / 2;
    const h = Math.max(1, ih * score / 50), y = padT + ih - h;
    s += `<rect class="bar${i === n - 1 ? " last" : ""}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>`;
    s += `<text class="val" x="${(x + bw / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle">${score}</text>`;
    s += `<text class="ax" x="${(x + bw / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle">${fmtISO(m.d, false)}</text>`;
  });
  mockChart.innerHTML = s + "</svg>";
}
