import { firebaseConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "11.0.2";
const STORE_KEY = "ent-algebra-progress-v1";
const START = new Date(2026, 9, 19);
const MONTHS = ["янв","фев","мар","апр","мая","июн","июл","авг","сен","окт","ноя","дек"];

const STAGES = [
  {id:"s1", name:"Фундамент", range:"Недели 1–3", about:"Математика 5–6 класса. Дроби, проценты и степени есть почти в каждом задании ЕНТ, и на них же держится математическая грамотность."},
  {id:"s2", name:"Алгебра 7–9 класса", range:"Недели 4–13", about:"Выражения, уравнения, неравенства, функции, системы, прогрессии. Это основа базового уровня — половины теста."},
  {id:"s3", name:"Алгебра и начала анализа 10–11 класса", range:"Недели 14–22", about:"Тригонометрия, корни n-й степени, показательные и логарифмические уравнения, производная и интеграл. Отсюда задания среднего и высокого уровня."},
  {id:"s4", name:"Режим ЕНТ", range:"Недели 23–29", about:"Новых тем нет. Пробники, разбор ошибок и отработка форматов, которые стоят по 2 балла."}
];

const WEEKS = [
  {s:"s1", t:"Диагностика и дроби", spec:["01"], book:"Математика 5–6", tasks:[
    "Пройти бесплатный пробный ЕНТ без подготовки и записать балл в блоке «Пробники»",
    "Порядок действий, признаки делимости, НОД и НОК",
    "Обыкновенные дроби: сокращение, общий знаменатель, четыре действия, смешанные числа",
    "Десятичные дроби, перевод из обыкновенных и обратно: 30 примеров без калькулятора"],
    geo:"Углы, параллельные прямые, сумма углов треугольника"},
  {s:"s1", t:"Рациональные числа, пропорции, проценты", spec:["01"], book:"Математика 6", tasks:[
    "Отрицательные числа, модуль числа, координатная прямая",
    "Отношения и пропорции, прямая и обратная пропорциональность",
    "Проценты: процент от числа, число по проценту, процентное отношение, изменение цены на p%",
    "10 заданий из образца НЦТ по математической грамотности"],
    geo:"Признаки равенства треугольников, равнобедренный треугольник"},
  {s:"s1", t:"Степени и многочлены", spec:["02","04"], book:"Алгебра 7", tasks:[
    "Свойства степеней: a<sup>m</sup>·a<sup>n</sup>, a<sup>m</sup>:a<sup>n</sup>, (a<sup>m</sup>)<sup>n</sup>, (ab)<sup>n</sup>",
    "Нулевой и отрицательный показатель, стандартный вид числа",
    "Одночлены и многочлены: подобные слагаемые, умножение многочленов",
    "Значение буквенного выражения при заданных переменных"],
    geo:"Прямоугольный треугольник: теорема Пифагора, sin, cos, tg острого угла"},

  {s:"s2", t:"Формулы сокращённого умножения", spec:["04"], book:"Алгебра 7", tasks:[
    "Выучить в обе стороны: (a ± b)<sup>2</sup>, a<sup>2</sup> − b<sup>2</sup>, (a ± b)<sup>3</sup>, a<sup>3</sup> ± b<sup>3</sup>",
    "Разложение на множители: общий множитель, группировка, ФСУ",
    "Упрощение выражений: 30 примеров на скорость",
    "Тесты ЕНТ по теме: 15 заданий, 2 минуты на каждое"],
    geo:"Подобие треугольников, теорема Фалеса, средняя линия"},
  {s:"s2", t:"Алгебраические дроби", spec:["01","04"], book:"Алгебра 7–8", tasks:[
    "Сокращение дробей: сначала разложить, потом сокращать; допустимые значения переменной",
    "Сложение, вычитание, умножение и деление алгебраических дробей",
    "Задания «упростите выражение» в 3–4 действия",
    "Тесты ЕНТ по теме: 15 заданий"],
    geo:"Четырёхугольники: параллелограмм, прямоугольник, ромб, квадрат, трапеция"},
  {s:"s2", t:"Квадратные корни и радикалы", spec:["01"], book:"Алгебра 8", tasks:[
    "Арифметический корень, √(a<sup>2</sup>) = |a|, рациональные и иррациональные числа",
    "Свойства корней, вынесение множителя из-под корня и внесение под корень",
    "Избавление от иррациональности в знаменателе, сравнение корней",
    "Тесты ЕНТ по теме: 15 заданий"],
    geo:"Площади треугольника и четырёхугольников"},
  {s:"s2", t:"Линейные и квадратные уравнения", spec:["05"], book:"Алгебра 7–8", tasks:[
    "Линейные уравнения, простейшие уравнения с модулем",
    "Квадратные уравнения: дискриминант, неполные уравнения",
    "Теорема Виета, разложение квадратного трёхчлена на множители",
    "Тесты ЕНТ по теме: 20 заданий"],
    geo:"Окружность: касательная, хорды, центральные и вписанные углы"},
  {s:"s2", t:"Дробно-рациональные уравнения и текстовые задачи", spec:["05","13"], book:"Алгебра 8", tasks:[
    "Дробно-рациональные уравнения: ОДЗ и проверка корней",
    "Биквадратные уравнения и замена переменной",
    "Текстовые задачи на движение, работу, смеси и проценты: составить уравнение",
    "Тесты ЕНТ по теме: 20 заданий"],
    geo:"Вписанные и описанные окружности треугольника и четырёхугольника"},
  {s:"s2", t:"Функции и графики", spec:["13"], book:"Алгебра 7–9", tasks:[
    "Область определения и множество значений, чтение графика",
    "Линейная функция y = kx + b: смысл k и b, пересечение прямых",
    "Парабола: вершина, ветви, нули, промежутки знакопостоянства",
    "y = k/x, y = √x, y = |x| и сдвиги графиков"],
    geo:"Теоремы синусов и косинусов, решение треугольников"},
  {s:"s2", t:"Неравенства и их системы", spec:["10","11"], book:"Алгебра 8–9", tasks:[
    "Линейные неравенства и числовые промежутки",
    "Квадратные неравенства через параболу; метод интервалов",
    "Рациональные (дробные) неравенства",
    "Системы линейных и дробно-рациональных неравенств, двойные неравенства"],
    geo:"Правильные многоугольники, длина окружности, площадь круга и сектора"},
  {s:"s2", t:"Повторение и пробник №2", spec:[], book:"тетрадь ошибок", tasks:[
    "Перерешать все задания из тетради ошибок за ноябрь и декабрь",
    "Пробник №2, записать балл",
    "Выписать три самые слабые темы и пройти их заново по шагам"],
    geo:"Векторы на плоскости: сложение, координаты, скалярное произведение"},
  {s:"s2", t:"Системы уравнений", spec:["08"], book:"Алгебра 7, 9", tasks:[
    "Системы линейных уравнений: подстановка и сложение",
    "Графический смысл системы, число решений",
    "Нелинейные системы: одно уравнение второй степени, симметричные системы",
    "Тесты ЕНТ по теме: 20 заданий"],
    geo:"Метод координат: расстояние, середина отрезка, уравнения прямой и окружности"},
  {s:"s2", t:"Прогрессии", spec:["12"], book:"Алгебра 9", tasks:[
    "Арифметическая прогрессия: a<sub>n</sub>, S<sub>n</sub>, характеристическое свойство",
    "Геометрическая прогрессия: b<sub>n</sub>, S<sub>n</sub>, бесконечно убывающая прогрессия",
    "Текстовые задачи на прогрессии",
    "Мини-пробник по алгебре 7–9 класса: 20 заданий за 40 минут"],
    geo:"Преобразования плоскости: симметрия, поворот, перенос, гомотетия"},

  {s:"s3", t:"Тригонометрия I: определения", spec:["03"], book:"Алгебра 9, АНА 10", tasks:[
    "Радианы, единичная окружность, знаки sin, cos, tg по четвертям",
    "Значения для 0°, 30°, 45°, 60°, 90° и кратных углов — наизусть",
    "Основное тригонометрическое тождество, связь tg, ctg, sin и cos",
    "Формулы приведения"],
    geo:"Стереометрия: аксиомы, взаимное расположение прямых и плоскостей"},
  {s:"s3", t:"Тригонометрия II: формулы", spec:["03"], book:"АНА 10", tasks:[
    "Формулы сложения и двойного угла",
    "Формулы понижения степени",
    "Сумма и разность синусов и косинусов",
    "Вычисление и упрощение тригонометрических выражений: 30 примеров"],
    geo:"Перпендикулярность, теорема о трёх перпендикулярах, угол между прямой и плоскостью"},
  {s:"s3", t:"Тригонометрия III: уравнения и неравенства", spec:["06","09","10"], book:"АНА 10", tasks:[
    "arcsin, arccos, arctg; уравнения sin x = a, cos x = a, tg x = a",
    "Уравнения, сводящиеся к квадратным, и однородные уравнения",
    "Отбор корней на промежутке; системы тригонометрических уравнений",
    "Простейшие тригонометрические неравенства"],
    geo:"Двугранный угол, расстояние от точки до плоскости"},
  {s:"s3", t:"Корни n-й степени и иррациональные уравнения", spec:["01","02","06","09","10"], book:"АНА 10–11", tasks:[
    "Корень n-й степени, степень с рациональным показателем",
    "Иррациональные уравнения: возведение в степень, проверка корней, замена",
    "Простейшие иррациональные неравенства и системы иррациональных уравнений",
    "Пробник №3, записать балл"],
    geo:"Призма, параллелепипед, куб: площадь поверхности и объём"},
  {s:"s3", t:"Показательные уравнения и неравенства", spec:["07","09","10","11"], book:"АНА 11", tasks:[
    "Показательная функция и её график",
    "Уравнения: одно основание, вынесение общего множителя, замена t = a<sup>x</sup>",
    "Неравенства: при основании меньше 1 знак меняется",
    "Системы показательных уравнений и неравенств"],
    geo:"Пирамида и усечённая пирамида"},
  {s:"s3", t:"Логарифмы", spec:["01","07"], book:"АНА 11", tasks:[
    "Определение логарифма и основное логарифмическое тождество",
    "Логарифм произведения, частного и степени; переход к новому основанию",
    "Вычисление логарифмических выражений: 30 примеров",
    "Логарифмическая функция и её график"],
    geo:"Цилиндр и конус"},
  {s:"s3", t:"Логарифмические уравнения и неравенства", spec:["07","09","10","11"], book:"АНА 11", tasks:[
    "Логарифмические уравнения: ОДЗ, потенцирование, замена переменной",
    "Логарифмические неравенства при основании больше и меньше 1",
    "Системы логарифмических уравнений и неравенств",
    "Смешанные задания: показательные и логарифмические вместе"],
    geo:"Шар и сфера, комбинации тел"},
  {s:"s3", t:"Производная", spec:["13"], book:"АНА 10", tasks:[
    "Смысл производной: скорость и угловой коэффициент касательной",
    "Таблица производных и правила: сумма, произведение, частное, сложная функция",
    "Уравнение касательной",
    "Монотонность, экстремумы, наибольшее и наименьшее значение на отрезке"],
    geo:"Координаты и векторы в пространстве"},
  {s:"s3", t:"Первообразная и интеграл", spec:["13"], book:"АНА 11", tasks:[
    "Первообразная, таблица первообразных и правила",
    "Определённый интеграл, формула Ньютона–Лейбница",
    "Площадь криволинейной трапеции, путь по известной скорости",
    "Пробник №4, записать балл"],
    geo:"Преобразования в пространстве: симметрия, параллельный перенос"},

  {s:"s4", t:"Моделирование и задания по контексту", spec:["13"], book:"образец варианта НЦТ", tasks:[
    "Текстовые задачи всех типов: движение, работа, проценты, смеси",
    "Графики, таблицы, диаграммы: что именно спрашивают",
    "Задачи на наибольшее и наименьшее значение через производную",
    "1 пробник и разбор каждой ошибки"],
    geo:"Объёмы и площади поверхности: 20 задач"},
  {s:"s4", t:"Форматы на 2 балла", spec:[], book:"образец варианта НЦТ", tasks:[
    "Задания с несколькими ответами: проверять каждый вариант отдельно",
    "Задания на соответствие: свойства функций, графики и формулы",
    "2 пробника и разбор",
    "10 заданий математической грамотности на время"],
    geo:"Угол между прямой и плоскостью, между плоскостями: 15 задач"},
  {s:"s4", t:"Повторение: выражения и уравнения", spec:["01","02","04","05","06","07","08","09"], book:"тетрадь формул", tasks:[
    "Пройти тетрадь формул от первой до последней страницы",
    "Уравнения всех типов: по 5 заданий на каждый тип",
    "2 пробника и разбор"],
    geo:"Планиметрия: 20 задач из пробников"},
  {s:"s4", t:"Повторение: неравенства, системы, прогрессии", spec:["10","11","12"], book:"тетрадь ошибок", tasks:[
    "Неравенства всех типов: по 5 заданий на каждый тип",
    "Системы уравнений и неравенств, прогрессии",
    "2 пробника и разбор"],
    geo:"Стереометрия: 20 задач из пробников"},
  {s:"s4", t:"Повторение: тригонометрия, логарифмы, анализ", spec:["03","07","13"], book:"тетрадь ошибок", tasks:[
    "Тригонометрия: 20 заданий на время",
    "Логарифмы и показательные: 20 заданий на время",
    "Производная и интеграл: 15 заданий",
    "2 пробника и разбор"],
    geo:"Векторы и координаты: 15 задач"},
  {s:"s4", t:"Слабые темы", spec:[], book:"тетрадь ошибок", tasks:[
    "Перерешать всю тетрадь ошибок",
    "Три худшие темы по последним пробникам: заново по шагам",
    "3 полных пробника в реальном времени"],
    geo:"Геометрия из ошибок пробников"},
  {s:"s4", t:"Неделя перед ЕНТ", spec:[], book:"тетрадь формул", tasks:[
    "Один пробник в начале недели, дальше только формулы",
    "Новых тем не брать",
    "Проверить документы, время и адрес тестирования; выспаться"],
    geo:"Пролистать формулы площадей и объёмов"}
];

// ---------- Состояние ----------

const ALL_IDS = [];
WEEKS.forEach((w, i) => {
  w.n = i + 1;
  w.ids = w.tasks.map((_, j) => `w${w.n}-${j}`);
  w.ids.push(`w${w.n}-g`);
  ALL_IDS.push(...w.ids);
});
const VALID = new Set(ALL_IDS);

let state = {done:{}, mocks:[]};

function normalize(o){
  const done = {}, mocks = [];
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
  }
  return {done, mocks: mocks.slice(-200)};
}

function loadLocal(){
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) state = normalize(JSON.parse(raw)); } catch (e) {}
}
function saveLocal(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
}

// ---------- Даты ----------

function weekStart(n){ const d = new Date(START); d.setDate(d.getDate() + (n - 1) * 7); return d; }
function fmtRange(n){
  const a = weekStart(n), b = new Date(a); b.setDate(b.getDate() + 6);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`;
  return `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}
function currentWeek(){
  const t = new Date(); t.setHours(0,0,0,0);
  const days = Math.round((t - START) / 864e5);
  if (days < 0) return {n:1, before:true};
  const n = Math.floor(days / 7) + 1;
  if (n > WEEKS.length) return {n:WEEKS.length, after:true};
  return {n};
}
function todayISO(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtISO(iso, withYear){
  const p = iso.split("-");
  return p[2] + "." + p[1] + (withYear ? "." + p[0] : "");
}
const pad2 = (n) => String(n).padStart(2, "0");

const NOW = currentWeek();
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- Разметка программы ----------

const stagesEl = document.getElementById("stages");
const weekEls = {};
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
      const id = "c-" + w.ids[j];
      return `<li><input type="checkbox" id="${id}" data-k="${w.ids[j]}"><label for="${id}">${txt}</label></li>`;
    }).join("");
    const gk = w.ids[w.ids.length - 1];
    tasksHtml += `<li><input type="checkbox" id="c-${gk}" data-k="${gk}"><label for="c-${gk}"><span class="tag">Сб · геометрия</span>${w.geo}</label></li>`;

    d.innerHTML =
      `<summary><span class="wk"><b>Неделя ${pad2(w.n)}</b><span>${fmtRange(w.n)}</span></span>` +
      `<span class="wtitle">${w.t}${chip}</span>` +
      `<span class="wcount" data-count="${w.n}">0/${w.ids.length}</span></summary>` +
      `<div class="wbody"><p class="meta">${specHtml}Где теория: ${w.book}</p>` +
      `<ul class="tasks">${tasksHtml}</ul></div>`;
    sec.appendChild(d);
    weekEls[w.n] = d;
  }
  stagesEl.appendChild(sec);
}

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

function goToWeek(n){
  const el = weekEls[n];
  if (!el) return;
  el.open = true;
  el.scrollIntoView({behavior: reduceMotion ? "auto" : "smooth", block: "start"});
}

{
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

// ---------- Отрисовка состояния ----------

function applyState(){
  let total = 0;
  document.querySelectorAll("ul.tasks input[type=checkbox]").forEach((cb) => { cb.checked = !!state.done[cb.dataset.k]; });
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
  renderMocks();
}

const mockForm = document.getElementById("mock-form");
const mockDate = document.getElementById("mock-date");
const mockScore = document.getElementById("mock-score");
const mockMsg = document.getElementById("mock-msg");
const mockChart = document.getElementById("mock-chart");
const mockList = document.getElementById("mock-list");
const mockEmpty = document.getElementById("mock-empty");
mockDate.value = todayISO();

const sortedMocks = () => state.mocks.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));

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

let resizeT = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => drawChart(sortedMocks().slice(-12)), 150);
});

// ---------- Действия ----------

stagesEl.addEventListener("change", (e) => {
  const cb = e.target;
  if (!cb || !cb.dataset || !cb.dataset.k) return;
  setDone(cb.dataset.k, cb.checked);
});

mockForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = mockDate.value, s = Number(mockScore.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) { mockMsg.textContent = "Укажи дату пробника."; return; }
  if (mockScore.value === "" || !isFinite(s) || s < 0 || s > 50 || Math.round(s) !== s) { mockMsg.textContent = "Балл — целое число от 0 до 50."; return; }
  mockMsg.textContent = "";
  mockScore.value = "";
  addMock({id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d, s});
});

function setDone(k, on){
  if (on) state.done[k] = true; else delete state.done[k];
  saveLocal();
  applyState();
  cloud.setDone(k, on);
}
function addMock(m){
  state.mocks.push(m);
  saveLocal();
  applyState();
  cloud.addMock(m);
}
function removeMock(m){
  state.mocks = state.mocks.filter((x) => x.id !== m.id);
  saveLocal();
  applyState();
  cloud.removeMock(m);
}

// ---------- Синхронизация (Firebase) ----------

const syncEl = document.getElementById("sync");
const authBtn = document.getElementById("auth-btn");
function setSync(kind, text){
  syncEl.dataset.state = kind;
  syncEl.textContent = text;
}

const AUTH_ERRORS = {
  "auth/unauthorized-domain": "Этот адрес сайта не добавлен в Firebase. Добавь его: Authentication → Settings → Authorized domains.",
  "auth/network-request-failed": "Нет интернета. Попробуй войти, когда появится связь.",
  "auth/configuration-not-found": "В Firebase не включён вход через Google: Authentication → Sign-in method → Google.",
  "auth/operation-not-allowed": "В Firebase не включён вход через Google: Authentication → Sign-in method → Google."
};

// Пустая заглушка, пока Firebase не подключён: всё хранится локально.
const cloud = {setDone(){}, addMock(){}, removeMock(){}};

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
  const {doc, setDoc, onSnapshot, deleteField, arrayUnion, arrayRemove} = fsMod;

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

  authBtn.hidden = false;
  authBtn.onclick = async () => {
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
  authMod.getRedirectResult(auth).catch((err) => {
    if (err && err.code) setSync("error", AUTH_ERRORS[err.code] || "Не получилось войти: " + err.code);
  });

  authMod.onAuthStateChanged(auth, (user) => {
    if (unsub) { unsub(); unsub = null; }
    ref = null;
    if (!user) {
      authBtn.textContent = "Войти через Google";
      setSync("local", "Войди через Google, и прогресс будет одинаковым на телефоне и компьютере. Пока он хранится только в этом браузере.");
      return;
    }
    who = user.displayName || user.email || "Google";
    authBtn.textContent = "Выйти";
    setSync("pending", "Загружаю прогресс…");
    ref = doc(db, "progress", user.uid);
    firstSnap = true;
    unsub = onSnapshot(ref, {includeMetadataChanges: true}, (snap) => {
      const cloudState = normalize(snap.exists() ? snap.data() : {});
      if (firstSnap) {
        firstSnap = false;
        // Отметки, сделанные до входа, добавляем в аккаунт, ничего не стирая.
        const addDone = {};
        for (const k of Object.keys(state.done)) if (!cloudState.done[k]) addDone[k] = true;
        const cloudIds = new Set(cloudState.mocks.map((m) => m.id));
        const addMocks = state.mocks.filter((m) => !cloudIds.has(m.id)).map((m) => ({id: m.id, d: m.d, s: m.s}));
        const patch = {v: 1};
        if (Object.keys(addDone).length) patch.done = addDone;
        if (addMocks.length) patch.mocks = arrayUnion(...addMocks);
        if (patch.done || patch.mocks) { write(patch); return; }
      }
      state = cloudState;
      saveLocal();
      applyState();
      if (snap.metadata.hasPendingWrites) setSync("pending", `Синхронизация включена · ${who} · изменения отправятся, как только будет интернет`);
      else setSync("cloud", `Синхронизация включена · ${who}`);
    }, (err) => {
      report(err);
    });
  });
}

// ---------- Старт ----------

loadLocal();
applyState();
connectFirebase();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
