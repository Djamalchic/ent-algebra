// Точка входа: состояние, главная, маршруты #/l/<урок>[/p|/t] и #/errors.

import { initStore } from "./js/store.js";
import { initHome, goToWeek } from "./js/home.js";
import { lessonView, errorsView } from "./js/lesson.js";

const home = document.getElementById("view-home");
const page = document.getElementById("view-page");
const navProgram = document.getElementById("nav-program");
const navErrs = document.getElementById("nav-errs");

function route(){
  const hash = location.hash || "";
  let m;
  if ((m = /^#\/l\/(w\d{1,2}-[\dg])(?:\/(p|t))?$/.exec(hash))) {
    show(page);
    lessonView(page, m[1], m[2] || "");
    window.scrollTo(0, 0);
    mark(null);
    return;
  }
  if (hash === "#/errors") {
    show(page);
    errorsView(page);
    window.scrollTo(0, 0);
    mark(navErrs);
    return;
  }
  const wasHidden = home.hidden;
  show(home);
  mark(navProgram);
  if ((m = /^#w-(\d+)$/.exec(hash))) goToWeek(Number(m[1]));
  else if (wasHidden) window.scrollTo(0, 0);
}

function show(el){
  home.hidden = el !== home;
  page.hidden = el !== page;
  if (el !== page) page.innerHTML = "";
}
function mark(link){
  for (const a of [navProgram, navErrs]) a.setAttribute("aria-current", a === link ? "page" : "false");
}

initStore();
initHome();
window.addEventListener("hashchange", route);
route();

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}
