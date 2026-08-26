# ESV Bible Catppuccin

Catppuccin theme for the **ESV Bible online reader** at [esv.org](https://www.esv.org/), with all four flavors and fourteen accents selectable from Stylus.

One file, no userscript. Unlike the [Okta style](../okta/), esv.org keeps everything in the light DOM and — better still — paints the entire site from ten CSS custom properties, so most of the theming is a single token block.

## Install

1. Install the [Stylus](https://add0n.com/stylus.html) extension.
2. Open the raw [`catppuccin.user.less`](./catppuccin.user.less) — Stylus should prompt to install. If it doesn't, paste the contents into a new style via "Write new style".
3. Configure **Light flavor**, **Dark flavor**, **Accent**, and the two checkboxes in the style's settings.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| Light flavor | Latte | Palette used when the OS is in light mode |
| Dark flavor | Mocha | Palette used when the OS is in dark mode |
| Accent | Mauve | Links, chapter numbers, footnote markers, buttons, focus rings |
| Always use the dark flavor | on | Ignores the OS setting and pins the dark flavor |
| Recolor your saved highlights | on | Remaps highlight and study colors to the Catppuccin palette |

### You do not need to change the site's own theme setting

esv.org ships its own White / Sepia / Black themes under **Text Settings**. This style works on top of whichever one you have selected — you don't have to match it to your flavor. See "Icon polarity" below for why that took work.

If you'd rather turn the "Recolor your saved highlights" option off, do: your existing yellow/red/blue/green highlights then keep the site's own colors, which stay legible but read as slightly muddy against a Catppuccin canvas.

## Why this style is short

esv.org is by some distance the friendliest theming target in this repo. The whole site — reader, study tools, account pages, marketing pages — is painted from ten custom properties declared once on `:root`:

```css
--bg-color            --text-color
--bg-alt-color        --text-secondary-color
--text-bg-color       --text-tertiary-color
--input-bg-color      --link-color
--border-color        --button-color
```

The site's own three themes are nothing but re-declarations of that same block on `body.theme-sepia` / `body.theme-black`. Override the ten and roughly 90% of the visible surface follows. The rest of the file mops up values that were hardcoded instead of tokenized — notices, validation errors, the note editor's toolbar, the reading-plan calendar, the words-of-Christ red.

One relationship in that token set is worth preserving deliberately:

```
--bg-color  <  --bg-alt-color = --text-bg-color  <  --input-bg-color
```

The canvas is **darker** than the reading pane. Catppuccin's `mantle`/`base` pair has that same relationship in *every* flavor — `mantle` is darker than `base` in Latte too — so mapping canvas→`mantle` and pane→`base` gives a correctly raised reading surface in light and dark alike.

## Icon polarity — the one real problem

esv.org doesn't tint its icons with CSS. It swaps whole image files per theme via `content: url(...)`, in three sets:

| Body class | Asset suffix | Glyph color |
| --- | --- | --- |
| `.theme-white` | `*-light.svg` | dark (for light backgrounds) |
| `.theme-sepia` | `*-sepia.svg` | dark, warm |
| `.theme-black` | `*-dark.svg` | light (for dark backgrounds) |

So running Mocha while the site is still set to White leaves every toolbar icon a dark glyph on a dark canvas — invisible. Re-pointing at the site's own `*-dark.svg` files isn't an option: those URLs are content-hashed (`account-dark.4427cffc5ef3.svg`) and change on every deploy.

The fix is polarity-only — `filter: invert(1)` — emitted **only** for the mismatched combination. The active flavor is known at compile time inside each media-query branch, and the site's theme is knowable from the body class, so all four combinations resolve statically with no runtime detection:

| Flavor | Site theme | Emitted? |
| --- | --- | --- |
| Dark (Mocha/Frappé/Macchiato) | White or Sepia | invert |
| Dark | Black | — already correct |
| Light (Latte) | Black | invert |
| Light | White or Sepia | — already correct |

Latte is Catppuccin's only light flavor, so "is this flavor light?" reduces to a `when (@f = latte)` guard.

Inverting is safe because these glyphs are monochrome on transparent backgrounds. Genuinely colored artwork is excluded — the `.active` states of favorite/highlight/note, and the colored bookmark chips — since inverting those would mangle the hue rather than fix it.

**The search field is the exception.** Its magnifier is a `background-image` on the input itself, so inverting the element would invert the field fill and the text being typed along with the glyph. That one is replaced with an inline SVG data URI instead, which also sidesteps the content-hashed URLs. Its color is a fixed mid-gray (`#9399b2`, Mocha `overlay2`) rather than a flavor token, because a data URI can't read a CSS variable — that gray is legible against `surface0` in every flavor.

## `color-mix()` for the highlight tints

Highlights use `color-mix(in srgb, var(--ctp-yellow) 22%, transparent)` rather than Less's compile-time `fade()`. Two reasons, and the second is the important one:

1. The palette's Less variables (`@yellow`, `@red`, …) only exist inside the scope that called `#lib.palette()`, which here is the `.ctp-palette()` mixin — they aren't in scope at the top level of the document block.
2. That ruleset is emitted **once**, outside the per-flavor media-query branches, so a compile-time `fade()` would bake a single flavor's hex into it. Mixing `var(--ctp-*)` at runtime tracks whichever flavor is actually live.

Translucent fills also mean the tints composite over any flavor's base without a separate light/dark variant or a contrast fight with the body text sitting on top of them.

## Specificity

Every token selector is written `body.theme-white, body.theme-sepia, body.theme-black` rather than a bare `body`. The site declares its defaults on `:root` but its Sepia/Black overrides on `.theme-sepia` / `.theme-black` (0,1,0) — a bare `body` (0,0,1) would lose to those. `body.theme-*` (0,1,1) wins in all three. A `:not()` fallback covers any page that ships without a theme class.

No `!important` anywhere in this file; none was needed.

## Structure

```
Stylus/esv/
├── README.md                  # you are here
└── catppuccin.user.less       # the userstyle (Less, uses catppuccin's shared lib)
```

Mirrors [catppuccin/userstyles](https://github.com/catppuccin/userstyles)' `styles/<site>/` convention, using the versioned lib import (`lib/std/v1.less`). If this gets upstreamed, the `.user.less` moves into their monorepo unchanged.

## Known gaps

- **Only `esv.org` and `www.esv.org` match.** The ESV study tools and audio player live on the same host and are covered; a separate host (`*.esv.org` subdomains) would need its own regexp.
- **The site has no `prefers-color-scheme` support of its own** — its Text Settings offers an "auto" theme that's switched in JavaScript. That's why this style carries its own `forceDark` option rather than deferring to the site.
- **Hero imagery on marketing pages is untouched.** Only the flat surfaces around it are repainted; photographic backgrounds stay as-is.
- **Icon inversion is polarity-only.** Inverted glyphs land on a neutral gray rather than a palette token. Recoloring them to `subtext0` exactly would need the accent-filter chain trick used in the Okta style.
- **Verified against the current CSS bundle** (`output.9c5ddadc03ba.css`). Class names here are stable BEM-ish and not build-hashed, so they should survive deploys — but the ten custom properties are the real contract, and everything else is secondary.
