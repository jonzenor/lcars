# LearnScripture.net Catppuccin

Catppuccin theme for [LearnScripture.net](https://learnscripture.net/), the Bible memorization site, with all four flavors and fourteen accents selectable from Stylus.

Personal style, not intended for submission to [catppuccin/userstyles](https://github.com/catppuccin/userstyles). It still follows upstream's Less conventions so it *could* be, but nobody has asked.

One file, no userscript. Everything on the site lives in the light DOM and is mostly token-driven.

## Install

1. Install the [Stylus](https://add0n.com/stylus.html) extension.
2. Open the raw [`catppuccin.user.less`](./catppuccin.user.less) from a pushed GitHub URL — Stylus should prompt to install. If it doesn't, paste the contents into a new style via "Write new style".
3. Configure **Light flavor**, **Dark flavor**, **Accent**, and the two checkboxes in the style's settings.

## Options

| Option | Default | What it does |
| --- | --- | --- |
| Light flavor | Latte | Palette used when the OS is in light mode |
| Dark flavor | Mocha | Palette used when the OS is in dark mode |
| Accent | Mauve | Links, primary buttons, focus rings, current-word border, progress bar |
| Always use the dark flavor | on | Ignores the OS setting and pins the dark flavor |
| Flat buttons | on | Drops the site's button gradients and drop shadows |

### You do not need to change the site's own theme setting

LearnScripture ships four themes of its own under **Preferences → Interface theme**: Calm, Bubblegum, Bubblegum 2, and Space. This style overrides all four identically, so it doesn't matter which one is selected. The Space theme's starfield and Calm's dark texture image are both removed in favor of a flat `crust` canvas.

## How the site is painted

Each of the site's themes is one block of about eighteen CSS custom properties declared on `body[data-theme=<name>]`:

```css
--topColor1 / --topColor2          --baseBackgroundColor / --baseTextColor
--topTextColor / --topLinkColor    --bgColor1 / --bgBorderColor
--topLinkHoverColor                --linkColor / --linkColorHover
--btnColor1 / --btnColor2          --footerColor
--btnTextColor                     --topWarningColor / --topErrorColor
--focusOutlineColor / --focusOutlineColorRGB
```

Override that block and roughly three quarters of the UI follows. The rest of the file mops up hardcoded grays: the secondary `.btn` gradient, form borders, `hr` and table rules, the mobile sidepanel, notices, the dashboard heatmap, the Flot chart legends, and the whole learn/test screen.

### Surface mapping

The site layers a dark outer canvas around a white content pane with light-gray boxes inside it:

| Site surface | Token |
| --- | --- |
| `body.base-page` (outer canvas) | `crust`, texture image removed |
| `.maincontent` | `base` |
| `.verseset` / `.borderedbox` / `.actionset` | `surface0`, `surface1` border |
| navbar | `mantle`; open dropdowns `crust` |
| sidepanel | `mantle`; its header and body `base` |

`surface0` is darker than `base` in Latte and lighter in the dark flavors, so the boxes read as recessed in light mode (matching the site's intent) and raised in dark mode, which is what a dark canvas wants.

### Specificity

The site's token blocks sit on `body[data-theme=calm]` and friends at (0,1,1). Ours are declared on exactly the same selectors. Stylus injects after the site's stylesheet, so equal specificity resolves in our favor and no `!important` is needed for the tokens. A `body:not([data-theme])` fallback covers any page that ships without the attribute.

The Space theme additionally hardcodes black plus a starfield on the boxes via `body[data-theme=space] .verseset` at (0,2,1). Those are restated as `body[data-theme] .verseset`, also (0,2,1), again winning on order.

### The one literal token

`--focusOutlineColorRGB` is consumed by the site as `rgba(var(--focusOutlineColorRGB), 1)`, so it has to be a bare `r, g, b` triplet. There is no way to derive that from `var(--ctp-accent)` at runtime, so it is emitted per flavor from the Less `@accent` color using `red()`, `green()`, and `blue()` at compile time, on the same `body[data-theme]` selectors as the other tokens so the site's own value can't shadow it. Everything else references `var(--ctp-*)` directly and is emitted once, outside the per-flavor branches.

### Icons

All icons are FontAwesome 4 glyphs, so they inherit `color`. None of the icon-polarity work the [ESV style](../esv/) needed applies here.

## Learn page notes

The learn/test screen is the only part of the site that's entirely hardcoded grayscale, and the part you spend the most time on. Things worth knowing:

- **Word tiles** (`.word-button`) signal state through their border: green correct, yellow partially correct, red incorrect, accent for the current word. The resting border is `surface2` so those pop.
- **Hidden words** (`.blurry`) are rendered as transparent text with a blurred text-shadow. The site's shadow is black, which disappears on a dark canvas and makes the words vanish rather than blur. The shadow is recolored to `subtext0`.
- **The typing box** (`#id-typing`) floats over the current word. It gets a `base` fill and an accent border so it reads as an input rather than a gap.
- **Progress bar** goes from gray to accent. The cyan glow on "perfect test" and "verse learnt" point events is kept, recolored to `teal`.

## Dashboard heatmap

The learning-events calendar is [cal-heatmap](https://cal-heatmap.com/) 4.1, configured with D3's continuous **Greens** scheme over the domain `[0, 10, 20, 35, 55, 80]`. It writes each cell's fill inline from that interpolator. Every past day is fed a value, so a zero-activity day gets `Greens(0)`, which is `#f7fcf5`: months of near-white squares on a dark canvas. (Future days have no data, take the CSS `.graph-rect` fill, and were already fine.)

The colors are arbitrary `rgb()` values from a continuous ramp, so there is nothing to match with an attribute selector, and a single `!important` fill would flatten the intensity ramp. Instead the data cells get a CSS filter that remaps the ramp:

```css
filter: invert(1) hue-rotate(180deg) contrast(0.75) brightness(1.1);
```

`invert()` flips white to black and dark green to pink, `hue-rotate(180deg)` swings the pink back to green, and `contrast()` / `brightness()` lift the floor off pure black. Sampled against the Greens ramp:

| Input value | Site color | After filter |
| --- | --- | --- |
| 0 | `#f7fcf5` | `#242823` |
| 0.5 | `#41ab5d` | `#3f9757` |
| 1 | `#00441b` | `#a2dab8` |

Mocha's `green` is `#a6e3a1`, so the top of the ramp lands close to the palette without ever reading it. Data cells are selected by `rect.graph-rect[style]` and `[fill]` so future cells, which carry neither, stay on their `surface0` CSS fill. Zero days come out a shade darker than that, which turns out to be a useful "recorded, but nothing" distinction.

Strokes pass through the same filter, so the hover stroke on data cells is set to `surface0`, which filters to a light gray. The red "today" highlight filters to a muted red and is left alone.

The remap is emitted only for dark flavors, via a `when not (@f = latte)` guard: on a Latte base the site's Greens ramp is already correct, and the filter would invert it.

## Flot legends

The Stats page's two line charts are [Flot](https://www.flotcharts.org/). Flot writes its legend background (white at 85% opacity) and swatch borders as inline styles, so those three rules are the only `!important` in the file.

## Verifying changes locally

The style was checked without a browser extension by fetching a few public pages, rewriting `/static/` URLs to absolute, inlining the compiled CSS (minus the `@-moz-document` wrapper), and screenshotting with headless Chrome:

```sh
npm install --prefix . less@4
./node_modules/.bin/lessc test.less out.css   # test.less = @var defaults + the style, lib import pointed at a local copy
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=out.png --window-size=1280,1100 file://$PWD/preview.html
```

Logged-in pages (dashboard, learn, user verses) redirect to sign-in when fetched anonymously, so those were themed from the CSS alone and are worth a look in the real browser after installing.
