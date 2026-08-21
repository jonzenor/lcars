// ==UserScript==
// @name         Okta Shell Catppuccin
// @namespace    github.com/jonzenor/lcars/Stylus/okta
// @version      0.1.0
// @description  Themes the Okta End-User Dashboard's shadow-DOM navigation shell, which a Stylus userstyle cannot reach. Companion to catppuccin.user.less.
// @author       FinalAsgard
// @license      MIT
// @match        https://*.okta.com/*
// @match        https://*.oktapreview.com/*
// @match        https://*.okta-emea.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

/* eslint-disable no-underscore-dangle */

/* =============================================================================
   WHY THIS SCRIPT EXISTS

   Okta renders the dashboard's navigation shell — the colored sidebar with
   Dashboard / My Apps / Notifications / Add apps, plus the topbar frame — inside
   a real shadow root:

       <odyssey-react-web-component-N-NN-N>.attachShadow({ mode: "open" })
       :host { all: initial; contain: content; }

   Styles are injected into that shadow root by Emotion, from a *JavaScript*
   token object (odysseyTokens.HueNeutralWhite, …) run through MUI
   styleOverrides. There is no CSS custom property to override and no ::part()
   exposed, and the bundle contains a function named
   `encapsulateStylesFromGlobalStyles`. A Stylus userstyle has no path in.

   TWO WAYS THROUGH, IN ORDER OF PREFERENCE
   ----------------------------------------
   1. BRAND-COLOR INTERCEPT (primary — used below).
      The shell's colors are not hardcoded. They come from
          window._oktaEnduser.primaryColor      // "#006782" — sidebar fill
          window._oktaEnduser.secondaryColor    // "#002333"
          window._oktaEnduser.*ColorContrast    // text drawn on top
      which Okta's own server injects from the org's Brands config, and which
      the React app reads at render time. If we replace those values *before*
      the app boots, the shell renders itself in Catppuccin natively — no CSS
      fighting, nothing to break when Okta reshuffles class names.

      The page assigns window._oktaEnduser from an inline <head> script, which
      would clobber a plain assignment. So we install an accessor on window that
      rewrites the colors as the page sets them. Requires @run-at document-start
      and @grant none (so we share the page's window, not an isolated one).

   2. SHADOW-ROOT STYLESHEET (supplement — also below).
      mode:"open" means shadowRoot is reachable from page script, so we can
      adopt a constructed CSSStyleSheet into it. Constructed sheets are not
      subject to the page's nonce-based CSP. This covers anything the brand
      colors don't reach.

      NOTE: the rules in SHELL_CSS are deliberately structural (element
      selectors, not class names). Nothing in this repo has yet seen inside that
      shadow root, so class-name selectors would be guesses. Element selectors
      are safe because the shadow root contains only the shell. To tighten this,
      run `__ctpDumpShell()` in the console and refine from real markup.
   ============================================================================= */

(() => {
  'use strict';

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIG — set these two to match your Stylus settings.
  // Userscript managers have no @var UI, so this is the knob.
  // ───────────────────────────────────────────────────────────────────────────
  const FLAVOR = 'mocha';   // latte | frappe | macchiato | mocha
  const ACCENT = 'mauve';   // rosewater flamingo pink mauve red maroon peach
                            // yellow green teal sky sapphire blue lavender

  const FLAVORS = {
    latte: {
      rosewater: '#dc8a78', flamingo: '#dd7878', pink: '#ea76cb', mauve: '#8839ef',
      red: '#d20f39', maroon: '#e64553', peach: '#fe640b', yellow: '#df8e1d',
      green: '#40a02b', teal: '#179299', sky: '#04a5e5', sapphire: '#209fb5',
      blue: '#1e66f5', lavender: '#7287fd', text: '#4c4f69', subtext1: '#5c5f77',
      subtext0: '#6c6f85', overlay2: '#7c7f93', overlay1: '#8c8fa1', overlay0: '#9ca0b0',
      surface2: '#acb0be', surface1: '#bcc0cc', surface0: '#ccd0da', base: '#eff1f5',
      mantle: '#e6e9ef', crust: '#dce0e8',
    },
    frappe: {
      rosewater: '#f2d5cf', flamingo: '#eebebe', pink: '#f4b8e4', mauve: '#ca9ee6',
      red: '#e78284', maroon: '#ea999c', peach: '#ef9f76', yellow: '#e5c890',
      green: '#a6d189', teal: '#81c8be', sky: '#99d1db', sapphire: '#85c1dc',
      blue: '#8caaee', lavender: '#babbf1', text: '#c6d0f5', subtext1: '#b5bfe2',
      subtext0: '#a5adce', overlay2: '#949cbb', overlay1: '#838ba7', overlay0: '#737994',
      surface2: '#626880', surface1: '#51576d', surface0: '#414559', base: '#303446',
      mantle: '#292c3c', crust: '#232634',
    },
    macchiato: {
      rosewater: '#f4dbd6', flamingo: '#f0c6c6', pink: '#f5bde6', mauve: '#c6a0f6',
      red: '#ed8796', maroon: '#ee99a0', peach: '#f5a97f', yellow: '#eed49f',
      green: '#a6da95', teal: '#8bd5ca', sky: '#91d7e3', sapphire: '#7dc4e4',
      blue: '#8aadf4', lavender: '#b7bdf8', text: '#cad3f5', subtext1: '#b8c0e0',
      subtext0: '#a5adcb', overlay2: '#939ab7', overlay1: '#8087a2', overlay0: '#6e738d',
      surface2: '#5b6078', surface1: '#494d64', surface0: '#363a4f', base: '#24273a',
      mantle: '#1e2030', crust: '#181926',
    },
    mocha: {
      rosewater: '#f5e0dc', flamingo: '#f2cdcd', pink: '#f5c2e7', mauve: '#cba6f7',
      red: '#f38ba8', maroon: '#eba0ac', peach: '#fab387', yellow: '#f9e2af',
      green: '#a6e3a1', teal: '#94e2d5', sky: '#89dceb', sapphire: '#74c7ec',
      blue: '#89b4fa', lavender: '#b4befe', text: '#cdd6f4', subtext1: '#bac2de',
      subtext0: '#a6adc8', overlay2: '#9399b2', overlay1: '#7f849c', overlay0: '#6c7086',
      surface2: '#585b70', surface1: '#45475a', surface0: '#313244', base: '#1e1e2e',
      mantle: '#181825', crust: '#11111b',
    },
  };

  const p = FLAVORS[FLAVOR] || FLAVORS.mocha;
  const accent = p[ACCENT] || p.mauve;

  // ───────────────────────────────────────────────────────────────────────────
  // 1. BRAND-COLOR INTERCEPT
  //
  // The sidebar fill is primaryColor. We give it `mantle` so it reads as a
  // panel distinct from the content area's `base`, with `crust` as the
  // secondary (deeper) tone. Contrast colors are the text drawn on top of each.
  // ───────────────────────────────────────────────────────────────────────────
  const BRAND = {
    primaryColor: p.mantle,
    primaryColorContrast: p.text,
    secondaryColor: p.crust,
    secondaryColorContrast: p.text,
  };

  const applyBrand = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    try {
      Object.assign(obj, BRAND);
    } catch {
      /* frozen object — the stylesheet pass below still applies */
    }
    return obj;
  };

  // The page has not run its inline <head> script yet at document-start, so we
  // trap the assignment rather than racing it.
  let enduser = window._oktaEnduser;
  if (enduser) applyBrand(enduser);

  try {
    Object.defineProperty(window, '_oktaEnduser', {
      configurable: true,
      enumerable: true,
      get: () => enduser,
      set: (v) => { enduser = applyBrand(v); },
    });
  } catch {
    /* Property already non-configurable; fall through to the CSS pass. */
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SHADOW-ROOT STYLESHEET
  //
  // Structural selectors only — see the header note. Backgrounds are cleared
  // and then repainted at the host so the shell cannot leave light patches
  // behind, and text/icons are pinned to palette colors.
  // ───────────────────────────────────────────────────────────────────────────
  const SHELL_CSS = `
    :host {
      color-scheme: ${FLAVOR === 'latte' ? 'light' : 'dark'};
      --ctp-base: ${p.base};
      --ctp-mantle: ${p.mantle};
      --ctp-crust: ${p.crust};
      --ctp-surface0: ${p.surface0};
      --ctp-surface1: ${p.surface1};
      --ctp-text: ${p.text};
      --ctp-subtext0: ${p.subtext0};
      --ctp-accent: ${accent};
    }

    /* Clear inherited light fills, then repaint structurally. */
    div, section, header, footer, nav, aside, ul, li, span, p, h1, h2, h3, button {
      background-color: transparent !important;
      border-color: ${p.surface0} !important;
      color: ${p.text} !important;
    }

    nav, aside {
      background-color: ${p.mantle} !important;
    }

    a {
      color: ${p.text} !important;
      text-decoration-color: ${p.overlay0} !important;
    }

    a:hover, button:hover, li:hover {
      background-color: ${p.surface0} !important;
      color: ${accent} !important;
    }

    /* Active / current nav item. aria-current is the one hook the shell is
       almost certain to expose, since it drives the highlight in the light-DOM
       markup too (<a aria-current="page" class="...home active">). */
    [aria-current="page"], [aria-current="true"], .active, .is-active {
      background-color: ${p.surface0} !important;
      color: ${accent} !important;
    }

    /* Inline icons: Okta ships hardcoded fill/stroke presentation attributes,
       which a CSS declaration overrides. Vendor logos are <img>, so untouched. */
    svg:not([data-logo]) path,
    svg:not([data-logo]) circle,
    svg:not([data-logo]) rect {
      fill: currentColor;
    }

    input, textarea, select {
      background-color: ${p.base} !important;
      border-color: ${p.surface1} !important;
      color: ${p.text} !important;
    }

    :focus-visible {
      outline: 2px solid ${accent} !important;
      outline-offset: 2px;
    }

    ::-webkit-scrollbar { width: 12px; height: 12px; }
    ::-webkit-scrollbar-track { background: ${p.mantle}; }
    ::-webkit-scrollbar-thumb {
      background: ${p.surface1};
      border: 3px solid ${p.mantle};
      border-radius: 8px;
    }
  `;

  let sheet = null;
  const getSheet = () => {
    if (sheet) return sheet;
    try {
      sheet = new CSSStyleSheet();
      sheet.replaceSync(SHELL_CSS);
    } catch {
      sheet = null;   // Constructed stylesheets unsupported — see fallback below.
    }
    return sheet;
  };

  const styled = new WeakSet();

  const paint = (root) => {
    if (!root || styled.has(root)) return;
    styled.add(root);

    const s = getSheet();
    if (s) {
      try {
        root.adoptedStyleSheets = [...root.adoptedStyleSheets, s];
        return;
      } catch { /* fall through */ }
    }

    // Fallback for engines without constructed stylesheets: a real <style>
    // element. The page exposes its CSP nonce, so reuse it.
    const el = document.createElement('style');
    if (window.cspNonce) el.setAttribute('nonce', window.cspNonce);
    el.textContent = SHELL_CSS;
    root.appendChild(el);
  };

  // Walk the tree and paint every open shadow root we find. Shells nest web
  // components, so this recurses rather than checking only the top host.
  const sweep = (node) => {
    if (!node) return;
    if (node.shadowRoot) {
      paint(node.shadowRoot);
      sweep(node.shadowRoot);
    }
    const kids = node.querySelectorAll ? node.querySelectorAll('*') : [];
    for (const el of kids) {
      if (el.shadowRoot) {
        paint(el.shadowRoot);
        sweep(el.shadowRoot);
      }
    }
  };

  const start = () => {
    sweep(document);
    // The shell mounts asynchronously and remounts on navigation, so keep
    // watching rather than sweeping once.
    new MutationObserver(() => sweep(document))
      .observe(document.documentElement, { childList: true, subtree: true });
  };

  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });

  // ───────────────────────────────────────────────────────────────────────────
  // REFINEMENT HELPER
  //
  // Run __ctpDumpShell() in the console to print the shell's real markup and
  // the stylesheets inside its shadow root. Paste that output into an issue (or
  // at Claude) to replace the structural rules above with exact selectors.
  // ───────────────────────────────────────────────────────────────────────────
  window.__ctpDumpShell = () => {
    const hosts = document.querySelectorAll('[data-odyssey-react-web-component]');
    if (!hosts.length) {
      console.warn('[ctp] No Odyssey web-component hosts found.');
      return;
    }
    hosts.forEach((h, i) => {
      const r = h.shadowRoot;
      console.group(`[ctp] host ${i}: <${h.tagName.toLowerCase()}> shadowRoot=${!!r}`);
      if (r) {
        console.log('--- markup ---\n', r.innerHTML);
        console.log('--- adoptedStyleSheets:', r.adoptedStyleSheets.length);
        r.querySelectorAll('style').forEach((s, j) =>
          console.log(`--- <style> ${j} ---\n`, s.textContent.slice(0, 4000)));
      }
      console.groupEnd();
    });
  };
})();
