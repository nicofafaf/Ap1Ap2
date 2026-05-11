/**
 * Nexus UI Audio — BluezoneCorp Futuristic User Interface SFX
 * Delegiert Hover/Click auf interaktive Elemente; respektiert prefers-reduced-motion.
 */
(function () {
  "use strict";

  var REDUCED = false;
  try {
    REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (_) {}

  var BASE =
    "/assets/BluezoneCorp_Futuristic_User_Interface/";
  var SRC_HOVER = BASE + "Bluezone_BC0303_futuristic_user_interface_high_tech_beep_038.wav";
  var SRC_CLICK = BASE + "Bluezone_BC0303_futuristic_user_interface_alert_003.wav";
  var SRC_HEAVY =
    BASE + "Bluezone_BC0303_futuristic_user_interface_transition_006.wav";

  var VOL_HOVER = 0.18;
  var VOL_CLICK = 0.42;
  var HOVER_THROTTLE_MS = 140;

  var poolHover = [];
  var poolClick = [];
  var lastHoverAt = 0;

  function makePool(src, size) {
    var out = [];
    for (var i = 0; i < size; i++) {
      var a = new Audio(src);
      a.preload = "auto";
      out.push(a);
    }
    return out;
  }

  poolHover = makePool(SRC_HOVER, 4);
  poolClick = makePool(SRC_CLICK, 4);

  function playFromPool(pool, volume) {
    if (REDUCED) return;
    var a = pool.shift();
    if (!a) return;
    a.volume = volume;
    a.currentTime = 0;
    var done = function () {
      a.removeEventListener("ended", done);
      pool.push(a);
    };
    a.addEventListener("ended", done);
    a.play().catch(function () {
      pool.push(a);
    });
  }

  var STRICT =
    [
      "button",
      "a[href]",
      '[role="button"]',
      '[role="menuitem"]',
      '[role="tab"]',
      "input[type=\"button\"]",
      "input[type=\"submit\"]",
      "input[type=\"reset\"]",
      "label[for]",
      "[data-sfx-hover]",
    ].join(",");

  function closestInteractive(el, allowPointerDiv) {
    if (!el || !el.closest) return null;
    var t = el.closest(STRICT);
    if (t) return t;
    if (allowPointerDiv) {
      var cp = el.closest(".cursor-pointer");
      if (
        cp &&
        cp.dataset.sfxIgnore == null &&
        cp.getAttribute("aria-disabled") !== "true"
      )
        return cp;
    }
    return null;
  }

  function sfxDisabled(el) {
    return el && el.dataset && el.dataset.sfx === "off";
  }

  document.addEventListener(
    "mouseover",
    function (e) {
      var t = closestInteractive(e.target, false);
      if (!t || sfxDisabled(t)) return;
      var now = Date.now();
      if (now - lastHoverAt < HOVER_THROTTLE_MS) return;
      lastHoverAt = now;
      playFromPool(poolHover, VOL_HOVER);
    },
    true
  );

  document.addEventListener(
    "click",
    function (e) {
      var t = closestInteractive(e.target, true);
      if (!t || sfxDisabled(t)) return;
      var heavy = t.dataset && t.dataset.sfxClick === "heavy";
      if (heavy) {
        var a = new Audio(SRC_HEAVY);
        a.volume = VOL_CLICK;
        a.play().catch(function () {});
        return;
      }
      playFromPool(poolClick, VOL_CLICK);
    },
    true
  );

  try {
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", function (ev) {
      REDUCED = ev.matches;
    });
  } catch (_) {}
})();
