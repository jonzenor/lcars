# Okta Catppuccin

Catppuccin theme for the **Okta End-User Dashboard** and **sign-in widget**, with all four flavors and fourteen accents selectable from Stylus.

Two files, because Okta's dashboard straddles a shadow DOM boundary and no single tool can cross it:

| File | Themes | Tool |
| --- | --- | --- |
| `catppuccin.user.less` | Content area + sign-in widget | [Stylus](https://add0n.com/stylus.html) |
| `okta-shell-catppuccin.user.js` | Navigation shell (sidebar + topbar) | [Violentmonkey](https://violentmonkey.github.io/) / Tampermonkey |

The userstyle alone gets you most of the visible surface. Add the userscript when you want the sidebar too.

## Install

**Userstyle**

1. Install the [Stylus](https://add0n.com/stylus.html) extension.
2. Open the raw [`catppuccin.user.less`](./catppuccin.user.less) — Stylus should prompt to install. If it doesn't, paste the contents into a new style via "Write new style".
3. Configure **Light flavor**, **Dark flavor**, **Accent**, and the two checkboxes in the style's settings.

**Userscript**

1. Install Violentmonkey or Tampermonkey.
2. Open the raw [`okta-shell-catppuccin.user.js`](./okta-shell-catppuccin.user.js) and confirm the install prompt.
3. Edit the `FLAVOR` and `ACCENT` constants near the top to match your Stylus choices. Userscript managers have no settings UI, so this is the knob.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| Light flavor | Latte | Palette used when the OS is in light mode |
| Dark flavor | Mocha | Palette used when the OS is in dark mode |
| Accent | Mauve | Links, focus rings, active states, primary buttons |
| Always use the dark flavor | on | Ignores the OS setting and pins the dark flavor |
| Keep a light plate behind vendor app logos | on | See below |

### Why the logo plate exists

App tiles show real vendor artwork — Salesforce, AWS, Box, TOPdesk. Most of it is drawn for a white background, and some of it is dark-on-transparent, which becomes invisible on a Mocha card. Recoloring someone else's logo isn't an option, so the default keeps a subtle light plate behind each one. Turn it off if you prefer the logos sitting directly on the card; monochrome ones look better that way, light ones glow.

## The shadow DOM problem

Worth understanding before you touch either file, because it explains why there are two.

Okta renders the navigation shell — the colored sidebar with Dashboard / My Apps / Notifications / Add apps, plus the topbar frame — inside a real shadow root:

```js
<odyssey-react-web-component-N-NN-N>.attachShadow({ mode: "open" })
:host { all: initial; contain: content; }
```

Styles land in that shadow root via Emotion, generated from a **JavaScript** token object (`odysseyTokens.HueNeutralWhite`, …) run through MUI `styleOverrides`. There is no CSS custom property to override, no `::part()` exposed, and the bundle ships a function called `encapsulateStylesFromGlobalStyles`. Document CSS — which is all a userstyle can produce — has no path in.

Everything else *is* light DOM and therefore fair game: the content area is an absolutely-positioned sibling of the web component, and the search box, account dropdown, and side-nav footer text are slotted into it (slotted content stays in the light DOM).

### How the userscript gets through

Two mechanisms, in order of preference:

1. **Brand-color intercept** — the shell's colors aren't hardcoded. They come from `window._oktaEnduser.primaryColor` / `secondaryColor`, which Okta's server injects from the org's Brands config and the React app reads at render time. The script installs an accessor on `window` that rewrites those values as the page assigns them, so the shell renders itself in Catppuccin natively. Nothing to break when Okta reshuffles class names. This is why it needs `@run-at document-start` and `@grant none`.

2. **Shadow-root stylesheet** — `mode: "open"` means `element.shadowRoot` is reachable from page script, so a constructed `CSSStyleSheet` can be adopted into it. Constructed sheets aren't subject to the page's nonce-based CSP (and `window.cspNonce` is exposed anyway, for the `<style>` fallback path).

**The stylesheet rules are structural — element selectors, not class names — because nothing here has yet seen inside that shadow root.** To tighten them, run `__ctpDumpShell()` in the console and refine against the real markup.

### The alternative you probably can't use

An Okta admin can set `primaryColor` / `secondaryColor` in **Customizations → Brands → Themes** and recolor that sidebar natively with no code at all. But it's **org-wide** — it repaints the dashboard for everyone in the org. Fine for a personal tenant, a non-starter at work.

## Selector hooks: three tiers

Okta mixes all three in one page. Knowing which you're looking at saves a lot of guessing.

| Tier | Example | How to target |
| --- | --- | --- |
| Stable BEM | `.chiclet--container`, `.dashboard--my-apps-title` | Directly |
| CSS-modules hashed | `.search--input__2Vndk`, `.ods-table__2s0bR` | `[class*="search--input__"]` |
| Emotion hashed | `.dcvgcwnp-nfdcie` | Never — use MUI globals (`.MuiButton-secondary`) |

The CSS-modules hashes change per build **and the same component ships under several different hashes in a single bundle** — `.search--input__2Vndk` and `.search--input__29Za1` are the same component. Always match the stable prefix.

Unlike Salesforce, this is not a specificity fight: Emotion emits single-class selectors, so a two-class selector already wins. `!important` appears only where Okta itself used it.

## Sign-in widget: unverified

The `#okta-sign-in` block at the bottom of the userstyle is written against the Sign-In Widget's Courage class names (`.o-form-*`, `.button-primary`, `.infobox`), stable across widget v2–v7. This org reports `IDENTITY_ENGINE` with no Gen3 widget feature flag, so the Gen2 renderer is expected — but the widget ships in a separate bundle that wasn't inspected, so treat this block as a first cut.

If your org is on the **Gen3 (Odyssey) widget** instead, these selectors won't match and the widget is probably in a shadow root too, needing the userscript treatment. To find out, open the sign-in page in a private window and check whether `#okta-sign-in` exists in the DOM. (`/login/login.htm` 302s to `/app/UserHome`, so a signed-out session is required.)

## Structure

```
Stylus/okta/
├── README.md                        # you are here
├── catppuccin.user.less             # userstyle — content area + sign-in widget
└── okta-shell-catppuccin.user.js    # userscript — shadow-DOM navigation shell
```

## Known gaps

- **Shell rules are structural.** Element selectors, pending a `__ctpDumpShell()` dump. Expect rough edges in the sidebar until then.
- **Sign-in widget is unverified.** See above.
- **Custom Okta domains won't match.** The `@-moz-document` regexps cover `*.okta.com`, `*.oktapreview.com`, and `*.okta-emea.com`. An org on a vanity domain (`login.example.com`) needs its own regexp added.
- **Odyssey host tag is version-pinned.** The bundle already ships `1-56-0` alongside `1-55-0`. The userscript matches on `[data-odyssey-react-web-component]` rather than the tag name, so version bumps are harmless — don't "fix" it to use the tag.
- **Admin console is not themed.** `*-admin.okta.com` is a different app on the same Odyssey stack; nothing here targets it.
- **Overlay portals** (`[data-odyssey-react-overlay-component]`) are light-DOM anchors whose contents may mount into their own shadow roots. The userscript's recursive sweep should reach them; dialogs and toasts are the place to check first if something stays light.
