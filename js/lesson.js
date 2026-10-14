// Страница урока (теория, практика, тест) и раздел «Ошибки».

import { getLesson, getProblem, loadManifest, renderMath, shuffle, sameNum, showNum, LEVEL_NAME, LETTERS } from "./content.js";
import { weekOf, fmtRange, itemText } from "./program.js";
import { state, subscribe, recordPractice, recordTest, addErr, removeErr, setDone } from "./store.js";

const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const TYPE_NAME = {choice: "один ответ", multi: "один или несколько ответов", number: "ответ числом"};
const tests = new Map();
let unsubHeader = null;

function h(tag, attrs = {}, html){
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  if (html != null) el.innerHTML = html;
  return el;
}

const errKey = (p) => `${p.from}:${p.id}`;
const pct = (s) => (s.n ? Math.round(s.r / s.n * 100) : 0);

// ---------- Карточка задания ----------

function problemCard(p, {num, total, onChange, order: fixedOrder} = {}){
  const card = h("article", {class: "prob"});
  const meta = h("div", {class: "pmeta"});
  meta.append(h("span", {class: "lvl", "data-l": p.lvl, text: LEVEL_NAME[p.lvl]}));
  if (num) meta.append(h("span", {class: "pnum", text: total ? `Задание ${num} из ${total}` : `Задание ${num}`}));
  meta.append(h("span", {class: "ptype", text: TYPE_NAME[p.type]}));
  card.append(meta, h("div", {class: "pq"}, p.q));

  const ans = h("div", {class: "pans"});
  card.append(ans);
  let selected = p.type === "multi" ? new Set() : null;
  let input = null;
  let locked = false;
  const optButtons = [];
  let order = null;

  if (p.type === "choice" || p.type === "multi") {
    if (p.type === "multi") ans.append(h("p", {class: "hint", text: "Отметьте все верные варианты."}));
    const natural = p.opts.map((_, i) => i);
    order = fixedOrder || (p.fixed ? natural : shuffle(natural));
    const list = h("div", {class: "opts", role: "group"});
    order.forEach((orig, pos) => {
      const b = h("button", {type: "button", class: "opt", "aria-pressed": "false", "data-k": orig});
      b.append(h("span", {class: "ol", text: LETTERS[pos]}), h("span", {class: "ot"}, p.opts[orig]));
      b.addEventListener("click", () => {
        if (locked) return;
        if (p.type === "choice") {
          selected = orig;
          optButtons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        } else {
          if (selected.has(orig)) selected.delete(orig); else selected.add(orig);
          b.setAttribute("aria-pressed", String(selected.has(orig)));
        }
        onChange && onChange();
      });
      optButtons.push(b);
      list.append(b);
    });
    ans.append(list);
  } else {
    const wrap = h("label", {class: "numin"});
    input = h("input", {type: "text", autocomplete: "off", spellcheck: "false", placeholder: "Ответ", "aria-label": "Ответ"});
    wrap.append(input);
    if (p.unit) wrap.append(h("span", {class: "unit", text: p.unit}));
    ans.append(wrap, h("p", {class: "hint", text: "Дробь — через /, например 3/4 или 1 2/3. Десятичную — через запятую."}));
    input.addEventListener("input", () => onChange && onChange());
  }

  const api = {
    el: card,
    input,
    order,
    answer(){
      if (p.type === "choice") return selected;
      if (p.type === "multi") return selected.size ? [...selected].sort((a, b) => a - b) : null;
      const v = input.value.trim();
      return v ? v : null;
    },
    set(a){
      if (a == null) return;
      if (p.type === "choice") {
        selected = a;
        optButtons.forEach((x) => x.setAttribute("aria-pressed", String(Number(x.dataset.k) === a)));
      } else if (p.type === "multi") {
        selected = new Set(a);
        optButtons.forEach((x) => x.setAttribute("aria-pressed", String(selected.has(Number(x.dataset.k)))));
      } else {
        input.value = a;
      }
    },
    correct(a = api.answer()){
      if (a == null) return false;
      if (p.type === "choice") return a === p.ans;
      if (p.type === "multi") return a.length === p.ans.length && a.every((x, i) => x === p.ans[i]);
      return sameNum(a, p.ans);
    },
    rightText(){
      if (p.type === "number") return showNum(p.ans) + (p.unit ? " " + p.unit : "");
      const letters = optButtons.filter((b) => (p.type === "choice" ? Number(b.dataset.k) === p.ans : p.ans.includes(Number(b.dataset.k))))
        .map((b) => b.querySelector(".ol").textContent);
      return letters.join(", ");
    },
    lock(){
      locked = true;
      card.querySelectorAll(".hint").forEach((e) => { e.hidden = true; });
      optButtons.forEach((b) => { b.disabled = true; });
      if (input) input.readOnly = true;
    },
    reveal(){
      api.lock();
      const a = api.answer();
      if (p.type === "number") {
        input.classList.add(api.correct(a) ? "ok" : "bad");
        return;
      }
      const right = p.type === "choice" ? new Set([p.ans]) : new Set(p.ans);
      const chosen = p.type === "choice" ? new Set(a == null ? [] : [a]) : new Set(a || []);
      optButtons.forEach((b) => {
        const k = Number(b.dataset.k);
        if (right.has(k)) b.classList.add("ok");
        else if (chosen.has(k)) b.classList.add("bad");
      });
    }
  };
  return api;
}

function solutionBlock(p, open){
  const d = h("details", {class: "psol"});
  if (open) d.open = true;
  d.append(h("summary", {text: "Решение"}), h("div", {}, p.sol));
  return d;
}

// ---------- Практика ----------

function practice(root, problems, {title, onAnswer, emptyText} = {}){
  const counts = {all: problems.length, A: 0, B: 0, C: 0};
  for (const p of problems) counts[p.lvl]++;
  let level = "all";
  let queue = [], pos = 0;
  const session = {ok: 0, n: 0};

  const bar = h("div", {class: "pbar"});
  const chips = h("div", {class: "chips", role: "group", "aria-label": "Уровень"});
  const sess = h("p", {class: "sess"});
  bar.append(chips, sess);
  const stage = h("div", {class: "pstage"});
  root.append(bar, stage);

  const levels = [["all", "Все"], ["A", "Базовый"], ["B", "Средний"], ["C", "Сложный"]];
  for (const [k, name] of levels) {
    if (k !== "all" && !counts[k]) continue;
    const b = h("button", {type: "button", class: "chip", "aria-pressed": String(k === level)});
    b.textContent = `${name} · ${counts[k]}`;
    b.addEventListener("click", () => {
      level = k;
      chips.querySelectorAll(".chip").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      build();
      show();
    });
    chips.append(b);
  }
  if (problems.length < 2) chips.hidden = true;

  function build(){
    const pick = (l) => shuffle(problems.filter((p) => p.lvl === l));
    queue = level === "all" ? [...pick("A"), ...pick("B"), ...pick("C")] : pick(level);
    pos = 0;
  }
  function updSess(){
    sess.textContent = session.n ? `Сейчас верно ${session.ok} из ${session.n}` : (title || "");
  }

  function show(){
    stage.innerHTML = "";
    updSess();
    if (!queue.length) {
      stage.append(h("p", {class: "empty", text: emptyText || "Заданий нет."}));
      return;
    }
    if (pos >= queue.length) {
      const done = h("div", {class: "pdone"});
      done.append(h("p", {}, `<b>Задания закончились.</b> Сейчас верно ${session.ok} из ${session.n}.`));
      const again = h("button", {type: "button", class: "primary", text: "Перемешать и начать заново"});
      again.addEventListener("click", () => { build(); show(); });
      done.append(again);
      stage.append(done);
      return;
    }
    const p = queue[pos];
    const actions = h("div", {class: "pact"});
    const check = h("button", {type: "button", class: "primary", text: "Проверить", disabled: true});
    const next = h("button", {type: "button", class: "primary", text: "Дальше →", hidden: true});
    const skip = h("button", {type: "button", class: "ghost", text: "Пропустить"});
    const fb = h("p", {class: "fb", role: "status"});
    const card = problemCard(p, {num: pos + 1, total: queue.length, onChange: () => { check.disabled = card.answer() == null; }});
    actions.append(check, next, skip);
    stage.append(card.el, fb, actions);
    renderMath(stage);

    const doCheck = () => {
      if (card.answer() == null) return;
      const ok = card.correct();
      card.reveal();
      session.n++;
      if (ok) session.ok++;
      fb.className = "fb " + (ok ? "ok" : "bad");
      fb.textContent = ok ? "Верно." : `Неверно. Правильный ответ: ${card.rightText()}.`;
      const sol = solutionBlock(p, !ok);
      stage.insertBefore(sol, actions);
      renderMath(sol);
      check.hidden = true;
      skip.hidden = true;
      next.hidden = false;
      next.focus({preventScroll: true});
      updSess();
      onAnswer && onAnswer(p, ok);
    };
    check.addEventListener("click", doCheck);
    next.addEventListener("click", () => { pos++; show(); scrollToStage(); });
    skip.addEventListener("click", () => { pos++; show(); });
    if (card.input) card.input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); if (!check.hidden) doCheck(); else next.click(); } });
  }
  function scrollToStage(){
    const top = stage.getBoundingClientRect().top;
    if (top < 0) stage.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block: "start"});
  }

  build();
  show();
}

// ---------- Тест ----------

function pickTest(problems, count){
  const want = count === 10 ? {A: 5, B: 3, C: 2} : {A: Math.round(count * 0.5), B: Math.round(count * 0.3), C: 0};
  if (count !== 10) want.C = count - want.A - want.B;
  const by = {A: shuffle(problems.filter((p) => p.lvl === "A")), B: shuffle(problems.filter((p) => p.lvl === "B")), C: shuffle(problems.filter((p) => p.lvl === "C"))};
  const out = [];
  for (const l of ["A", "B", "C"]) out.push(...by[l].splice(0, want[l]));
  const rest = shuffle([...by.A, ...by.B, ...by.C]);
  while (out.length < count && rest.length) out.push(rest.pop());
  const order = {A: 0, B: 1, C: 2};
  return out.sort((a, b) => order[a.lvl] - order[b.lvl]);
}

function fmtTime(sec){
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function testView(root, L){
  const count = L.mix ? 15 : 10;
  const pass = Math.ceil(count * 0.8);
  let T = tests.get(L.id);

  const startScreen = () => {
    root.innerHTML = "";
    const box = h("div", {class: "tstart"});
    box.append(h("p", {}, `<b>${count} заданий, ${count * 2} минут</b> — по 2 минуты на задание, как на ЕНТ. ` +
      (count === 10 ? "5 базовых, 3 средних и 2 сложных." : "Половина базовых, треть средних, остальные сложные.")));
    box.append(h("p", {}, `Ответы проверяются в конце. Нужно ${pass} из ${count}, чтобы тема закрылась и пункт программы отметился сам. Ошибки попадут в раздел «Ошибки».`));
    const s = state.stats[L.id];
    if (s && s.t) box.append(h("p", {class: "muted", text: `Попыток: ${s.t}. Лучший результат: ${s.b}%.`}));
    const go = h("button", {type: "button", class: "primary", text: "Начать тест"});
    go.addEventListener("click", () => {
      T = {items: pickTest(L.problems, count), answers: [], orders: [], cur: 0, end: Date.now() + count * 120000, done: false};
      tests.set(L.id, T);
      running();
    });
    box.append(go);
    root.append(box);
  };

  let timerId = null;
  const running = () => {
    root.innerHTML = "";
    const top = h("div", {class: "tbar"});
    const timer = h("span", {class: "timer", role: "timer"});
    const progress = h("span", {class: "tprog"});
    top.append(timer, progress);
    const grid = h("div", {class: "tgrid", role: "group", "aria-label": "Задания теста"});
    const stage = h("div", {class: "pstage"});
    const nav = h("div", {class: "pact"});
    const prev = h("button", {type: "button", class: "ghost", text: "← Назад"});
    const next = h("button", {type: "button", class: "primary", text: "Дальше →"});
    const finish = h("button", {type: "button", class: "ghost", text: "Завершить тест"});
    const confirmBox = h("div", {class: "confirm", hidden: true});
    nav.append(prev, next, finish);
    root.append(top, grid, stage, nav, confirmBox);

    const cells = T.items.map((_, i) => {
      const b = h("button", {type: "button", class: "tcell", text: String(i + 1)});
      b.addEventListener("click", () => { T.cur = i; showQ(); });
      grid.append(b);
      return b;
    });
    let card = null;
    const answered = () => T.answers.filter((a) => a != null).length;
    const paint = () => {
      cells.forEach((c, i) => {
        c.classList.toggle("has", T.answers[i] != null);
        c.setAttribute("aria-current", i === T.cur ? "true" : "false");
      });
      progress.textContent = `Ответов: ${answered()} из ${T.items.length}`;
      prev.disabled = T.cur === 0;
      next.textContent = T.cur === T.items.length - 1 ? "К первому" : "Дальше →";
    };
    const save = () => { if (card) T.answers[T.cur] = card.answer(); };
    const showQ = () => {
      save();
      stage.innerHTML = "";
      const i = T.cur;
      card = problemCard(T.items[i], {num: i + 1, total: T.items.length, order: T.orders[i], onChange: () => { T.answers[i] = card.answer(); paint(); }});
      T.orders[i] = card.order;
      card.set(T.answers[i]);
      stage.append(card.el);
      renderMath(stage);
      confirmBox.hidden = true;
      paint();
    };
    prev.addEventListener("click", () => { save(); T.cur = Math.max(0, T.cur - 1); card = null; showQ(); });
    next.addEventListener("click", () => { save(); T.cur = T.cur === T.items.length - 1 ? 0 : T.cur + 1; card = null; showQ(); });
    finish.addEventListener("click", () => {
      save();
      const left = T.items.length - answered();
      if (!left) { end(); return; }
      confirmBox.innerHTML = "";
      confirmBox.append(h("p", {text: `Без ответа: ${left}. Они будут засчитаны как ошибки.`}));
      const yes = h("button", {type: "button", class: "primary", text: "Завершить"});
      const no = h("button", {type: "button", class: "ghost", text: "Вернуться к заданиям"});
      yes.addEventListener("click", end);
      no.addEventListener("click", () => { confirmBox.hidden = true; });
      confirmBox.append(yes, no);
      confirmBox.hidden = false;
    });
    const tick = () => {
      const left = (T.end - Date.now()) / 1000;
      timer.textContent = fmtTime(left);
      timer.classList.toggle("low", left < 120);
      if (left <= 0) { save(); end(); }
    };
    function end(){
      clearInterval(timerId);
      if (T.done) return;
      T.done = true;
      results();
    }
    timerId = setInterval(() => { if (!root.isConnected) { clearInterval(timerId); return; } tick(); }, 500);
    tick();
    showQ();
  };

  const results = () => {
    tests.delete(L.id);
    root.innerHTML = "";
    const cards = T.items.map((p, i) => {
      const c = problemCard(p, {num: i + 1, total: T.items.length, order: T.orders[i]});
      c.set(T.answers[i]);
      return c;
    });
    const oks = cards.map((c, i) => c.correct(T.answers[i]));
    const score = oks.filter(Boolean).length;
    const percent = Math.round(score / T.items.length * 100);
    const passed = score >= pass;

    recordTest(L.id, percent);
    T.items.forEach((p, i) => { if (!oks[i]) addErr(errKey(p), p.from); else removeErr(errKey(p)); });
    if (passed) setDone(L.id, true);

    const head = h("div", {class: "tres " + (passed ? "ok" : "bad")});
    head.append(h("p", {class: "score"}, `${score} <span>из ${T.items.length}</span>`));
    head.append(h("p", {}, passed
      ? "<b>Тема закрыта.</b> Пункт программы отмечен. Ошибки, если были, — в разделе «Ошибки»."
      : `<b>Нужно ${pass} из ${T.items.length}.</b> Ещё два дня на тему: перечитайте теорию, порешайте практику и пройдите тест снова. Ошибки — в разделе «Ошибки».`));
    const again = h("button", {type: "button", class: "primary", text: "Пройти тест ещё раз"});
    again.addEventListener("click", startScreen);
    head.append(again);
    root.append(head);

    const list = h("div", {class: "review"});
    cards.forEach((c, i) => {
      const item = h("div", {class: "ritem " + (oks[i] ? "ok" : "bad")});
      c.reveal();
      item.append(c.el);
      const a = T.answers[i];
      item.append(h("p", {class: "fb " + (oks[i] ? "ok" : "bad"), text: oks[i] ? "Верно." : (a == null ? `Нет ответа. Правильный ответ: ${c.rightText()}.` : `Неверно. Правильный ответ: ${c.rightText()}.`)}));
      item.append(solutionBlock(T.items[i], !oks[i]));
      list.append(item);
    });
    root.append(list);
    renderMath(root);
    window.scrollTo({top: 0, behavior: reduceMotion ? "auto" : "smooth"});
  };

  if (T && !T.done) {
    if (T.end > Date.now()) running();
    else { T.done = true; results(); }
  } else {
    tests.delete(L.id);
    startScreen();
  }
}

// ---------- Экран урока ----------

function onAnswerFor(p, ok){
  recordPractice(p.from, ok);
  if (ok) removeErr(errKey(p)); else addErr(errKey(p), p.from);
}

export async function lessonView(main, lid, mode){
  if (unsubHeader) { unsubHeader(); unsubHeader = null; }
  main.innerHTML = "";
  const w = weekOf(lid);
  const crumbs = h("nav", {class: "crumbs", "aria-label": "Навигация"});
  crumbs.append(h("a", {href: w ? `#w-${w.n}` : "#/", text: "← Программа"}));
  if (w) crumbs.append(h("span", {text: ` · Неделя ${w.n} · ${fmtRange(w.n)}`}));
  main.append(crumbs);
  const loading = h("p", {class: "muted", text: "Загружаю урок…"});
  main.append(loading);

  let L = null;
  try { L = await getLesson(lid); } catch (e) { L = null; }
  loading.remove();
  if (!L) {
    const head = h("header", {class: "lhead"});
    head.append(h("p", {class: "eyebrow", text: "Урок"}), h("h1", {}, itemText(lid) || "Урок"));
    main.append(head);
    main.append(h("p", {class: "empty"}, w ? `Этот урок ещё готовится. Он появится до начала недели ${w.n} (${fmtRange(w.n)}). Пока можно повторить пройденные темы или разобрать ошибки.` : "Такого урока нет."));
    return;
  }
  if (L.mix) mode = "t";

  const head = h("header", {class: "lhead"});
  const specs = L.spec && L.spec.length ? " · темы спецификации " + L.spec.join(", ") : "";
  head.append(h("p", {class: "eyebrow", text: (L.mix ? "Итоговый тест" : "Урок") + specs}));
  head.append(h("h1", {text: L.title}));
  const tabs = h("div", {class: "tabs", role: "tablist"});
  const tabDefs = L.mix ? [["t", "Тест"]] : [["", "Теория"], ["p", "Практика"], ["t", "Тест"]];
  for (const [k, name] of tabDefs) {
    const a = h("a", {href: `#/l/${lid}${k ? "/" + k : ""}`, class: "tab", role: "tab", "aria-selected": String((mode || "") === k), text: name});
    tabs.append(a);
  }
  const lstat = h("p", {class: "lstat"});
  head.append(tabs, lstat);
  main.append(head);
  const paintStat = () => {
    const s = state.stats[lid];
    const parts = [];
    if (s && s.n) parts.push(`практика: верно ${s.r} из ${s.n} (${pct(s)}%)`);
    if (s && s.t) parts.push(`лучший тест: ${s.b}%`);
    if (state.done[lid]) parts.push("тема закрыта ✓");
    lstat.textContent = parts.length ? parts.join(" · ") : (L.mix ? "" : `${L.problems.length} заданий в практике`);
  };
  paintStat();
  unsubHeader = subscribe(paintStat);

  const body = h("section", {class: "lbody"});
  main.append(body);

  if (mode === "p") {
    practice(body, L.problems, {onAnswer: onAnswerFor});
  } else if (mode === "t") {
    if (L.mix) {
      const titles = await loadManifest();
      body.append(h("p", {class: "muted", text: "Задания из уроков: " + L.mix.map((id) => (titles.lessons[id] || {}).t || id).join(", ") + "."}));
    }
    const holder = h("div");
    body.append(holder);
    testView(holder, L);
  } else {
    const art = h("article", {class: "theory"});
    for (const s of L.theory) {
      const sec = h("section", {class: "th"});
      sec.append(h("h2", {text: s.h}));
      sec.append(h("div", {}, s.html));
      art.append(sec);
    }
    const cta = h("div", {class: "cta"});
    cta.append(h("a", {href: `#/l/${lid}/p`, class: "btnlink", text: "К практике →"}));
    art.append(cta);
    body.append(art);
    renderMath(art);
  }
}

// ---------- Ошибки ----------

export async function errorsView(main){
  if (unsubHeader) { unsubHeader(); unsubHeader = null; }
  main.innerHTML = "";
  const crumbs = h("nav", {class: "crumbs"});
  crumbs.append(h("a", {href: "#/", text: "← Программа"}));
  main.append(crumbs);
  const head = h("header", {class: "lhead"});
  head.append(h("p", {class: "eyebrow", text: "Тетрадь ошибок"}), h("h1", {text: "Ошибки"}));
  head.append(h("p", {class: "lede", text: "Сюда попадает каждое задание, решённое неверно в практике или тесте. Реши его правильно — и оно уйдёт из списка. Лучшее время для разбора — воскресенье."}));
  main.append(head);
  const body = h("section", {class: "lbody"});
  main.append(body);

  const man = await loadManifest();
  const groups = {};
  for (const [key, lid] of Object.entries(state.errs)) (groups[lid] = groups[lid] || []).push(key);
  const lids = Object.keys(groups).sort((a, b) => {
    const [wa, ka] = a.slice(1).split("-"), [wb, kb] = b.slice(1).split("-");
    return Number(wa) - Number(wb) || (ka === "g" ? 9 : Number(ka)) - (kb === "g" ? 9 : Number(kb));
  });
  if (!lids.length) {
    body.append(h("p", {class: "empty", text: "Ошибок нет. Когда в практике или тесте попадётся задание, решённое неверно, оно появится здесь."}));
    return;
  }
  const list = h("ul", {class: "errlist"});
  const startPractice = async (keys, title) => {
    body.innerHTML = "";
    const back = h("button", {type: "button", class: "ghost", text: "← К списку ошибок"});
    back.addEventListener("click", () => errorsView(main));
    body.append(back);
    const probs = (await Promise.all(keys.map((k) => getProblem(k)))).filter(Boolean);
    const holder = h("div");
    body.append(holder);
    practice(holder, probs, {title, onAnswer: onAnswerFor, emptyText: "Эти задания уже исправлены или удалены из уроков."});
  };
  for (const lid of lids) {
    const li = h("li");
    const w = weekOf(lid);
    const title = (man.lessons[lid] || {}).t || itemText(lid);
    li.append(h("span", {class: "et"}, `<b>${title}</b><span>Неделя ${w ? w.n : "?"} · ${groups[lid].length} ${plural(groups[lid].length, "задание", "задания", "заданий")}</span>`));
    const b = h("button", {type: "button", class: "ghost", text: "Перерешать"});
    b.addEventListener("click", () => startPractice(groups[lid], title));
    li.append(b);
    list.append(li);
  }
  const all = h("button", {type: "button", class: "primary", text: `Перерешать все (${Object.keys(state.errs).length})`});
  all.addEventListener("click", () => startPractice(Object.keys(state.errs), "Все ошибки"));
  body.append(all, list);
}

export function plural(n, one, few, many){
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return few;
  return many;
}
