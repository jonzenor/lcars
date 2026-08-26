# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Personal dotfiles for zsh, bash, tmux, and starship. The goal is a consistent shell experience across the user's Mac and Linux machines — keep portability in mind when adding tools or install steps. There is no build, no tests, and no application code; every change is a config edit that takes effect on the next shell/tmux reload.

`install.sh` is currently macOS-only (relies on Homebrew). Linux support is a deferred follow-up.

## Install flow

`./install.sh` is the only entry point. It:
1. Verifies Homebrew is installed; exits with brew.sh install instructions if not.
2. Runs `brew bundle` against the repo's `Brewfile` (starship, zoxide, eza, bat, tmux, ghostty, jetbrains-mono-nerd-font).
3. Clones [TPM](https://github.com/tmux-plugins/tpm) to `~/.tmux/plugins/tpm` if missing.
4. Symlinks configs (see inventory below). Existing real files at targets are renamed to `.bak`; existing symlinks are overwritten.
5. On macOS, renames `~/Library/Application Support/com.mitchellh.ghostty/config.ghostty` to `.bak` if present, so the XDG symlink is authoritative.
6. Runs `~/.tmux/plugins/tpm/bin/install_plugins` headless so `catppuccin/tmux` is installed without manual `prefix + I`.

Pass `--update` to refresh: adds `brew upgrade`, `git pull` of TPM, and `update_plugins all` instead of `install_plugins`. Symlinking and config backup behavior is unchanged between modes.

The script uses script-relative paths (`LCARS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"`), so the repo can live anywhere — not hardcoded. It is idempotent: re-running re-points symlinks, guards the TPM clone, and skips already-installed Brew packages. Passes `shellcheck` clean.

### Symlink inventory

| Source in repo | Symlink target |
| --- | --- |
| `zsh/zshrc` | `~/.zshrc` |
| `bash/bashrc` | `~/.bashrc` |
| `tmux/tmux.conf` | `~/.tmux.conf` |
| `starship/starship.toml` | `~/.config/starship.toml` |
| `bat/config` | `~/.config/bat/config` |
| `eza/theme.yml` | `~/.config/eza/theme.yml` |
| `ghostty/config` | `~/.config/ghostty/config` |

## Theming

Everything is on the catppuccin **mocha** flavor. When adding tools, keep them on mocha for consistency.

- **starship**: palette set in `starship/starship.toml`.
- **tmux**: `catppuccin/tmux` is in the TPM plugin list; `@catppuccin_flavor 'mocha'` is set. `install.sh` invokes TPM's headless `install_plugins` automatically; if you edit the plugin list later outside install.sh, run `prefix + I` inside tmux.
- **bat**: ships `Catppuccin Mocha` as a built-in theme since v0.25. `bat/config` just sets `--theme="Catppuccin Mocha"` — no theme file vendored. If a future bat version drops the built-in, re-vendor from `catppuccin/bat`.
- **eza**: `eza/theme.yml` is the **mauve** mocha variant from `catppuccin/eza`, chosen to match starship's git_branch accent. eza has no built-in catppuccin theme, so this file is required. To swap accents, replace it with another from `catppuccin/eza`'s `themes/mocha/` directory. Requires eza ≥ 0.20.
- **Ghostty**: `theme = Catppuccin Mocha` in `ghostty/config` references Ghostty's built-in theme since v1.0 — no theme file vendored. (The cloned `~/.config/ghostty/themes/catppuccin/` on the user's Mac is leftover and unused; safe to delete.) Config locations differ by OS — see "Ghostty config paths" below.

## Stylus (browser userstyles)

`Stylus/` holds [Stylus](https://add0n.com/stylus.html) userstyles that extend the catppuccin aesthetic into web apps the user spends time in. Not installed by `install.sh` — Stylus styles are imported into the browser extension, not symlinked from disk.

Convention varies by style:
- **`Stylus/agility-catppuccin-mocha.user.css`** — vanilla CSS (`@preprocessor default`), palette inlined as `--ctp-*` custom properties, Stylus injects the user-selected accent hex as `--accent`. **Important constraint baked into the file's comments: chained CSS custom properties (e.g. `--ctp-accent: var(--accent)`) do NOT resolve in Chrome's Stylus build — they come out empty. Always reference vars directly; never alias.**
- **`Stylus/salesforce/catppuccin.user.less`** — Less (`@preprocessor less`), imports catppuccin's shared lib at `https://userstyles.catppuccin.com/lib/lib.less` to get `#lib.palette()`, `#lib.css-variables()`, `#lib.defaults()`. Mirrors [catppuccin/userstyles](https://github.com/catppuccin/userstyles) `styles/<site>/` upstream convention so the file could be upstreamed by copy. Same chained-var constraint applies — see the file's header comment.

- **`Stylus/okta/catppuccin.user.less`** — Less, same lib convention as the salesforce style, but note the lib import now points at the **versioned** path `https://userstyles.catppuccin.com/lib/std/v1.less` (the old `lib/lib.less` is a one-line forwarder to it). Exposes `lightFlavor` + `darkFlavor` + `accentColor` selects, so only the `--ctp-*` *definitions* are emitted per color-scheme while the ruleset itself is emitted once. Ships with a companion **userscript** — see below.

- **`Stylus/esv/catppuccin.user.less`** — Less, same versioned-lib convention as the okta style. The easiest target in the repo: esv.org paints the whole site from ten CSS custom properties (`--bg-color`, `--text-bg-color`, `--link-color`, …) declared on `:root` and re-declared on `body.theme-sepia` / `body.theme-black`, so one token block covers ~90% of the surface. Two things worth knowing before editing it — see `Stylus/esv/README.md` for the full reasoning:
  - **Token selectors must carry a theme class.** The site's own overrides sit on `.theme-black` (0,1,0), so a bare `body` (0,0,1) loses. Written `body.theme-*` (0,1,1) throughout. No `!important` needed anywhere in the file.
  - **Icons are swapped per theme as whole image files**, not tinted with CSS, and their URLs are content-hashed — so they can't be re-pointed. Handled with polarity-only `filter: invert(1)`, emitted only for the mismatched flavor/site-theme combination (resolved at compile time via a `when (@f = latte)` guard, since Latte is Catppuccin's only light flavor). The upshot is the user never has to match the site's Text Settings theme to their flavor. The search field is the exception — its glyph is a `background-image` on the input, so it gets an inline SVG data URI instead of an invert.

The four styles use different preprocessors intentionally: the agility one predates the others and uses the simpler vanilla-CSS approach; the salesforce, okta, and esv ones were authored against upstream's Less convention to keep an upstreaming option open. Future styles should pick whichever fits — neither is "the standard."

**Note on `color-mix()` vs Less `fade()`** (learned in the esv style): the palette's Less variables (`@yellow`, `@accent`, …) only exist inside the scope that called `#lib.palette()` — they are *not* in scope at the top level of an `@-moz-document` block. More importantly, rules emitted once outside the per-flavor media-query branches would bake a single flavor's hex if they used compile-time `fade()`. Use `color-mix(in srgb, var(--ctp-x) N%, transparent)` there so the tint tracks the live flavor. This is a `var()` in a property value, not a chained custom property, so it's safe in Chrome's Stylus build.

The salesforce style also includes a per-environment header stripe (red on prod, mauve on sandboxes) driven by `@-moz-document` URL-pattern matching — no org-specific data in the file, works for any Salesforce user.

### Shadow DOM: when a userstyle is not enough

`Stylus/okta/` is the first style in this repo that **cannot** be done with Stylus alone, and the reason generalizes. Okta renders its dashboard navigation shell inside a real shadow root (`attachShadow({mode:"open"})` with `:host { all: initial }`), styled by Emotion from a **JavaScript** token object — no CSS custom property to override, no `::part()` exposed. Document CSS has no path in.

So that directory ships two files: the `.user.less` for the light-DOM content area, and `okta-shell-catppuccin.user.js` (Violentmonkey/Tampermonkey) for the shell. The userscript's primary mechanism is *not* CSS injection — it intercepts `window._oktaEnduser.primaryColor` at `document-start` so the app renders itself themed, which survives class-name churn. Adopting a constructed `CSSStyleSheet` into the open shadow root is the secondary pass (constructed sheets bypass the nonce CSP).

**The general lesson for future styles:** before writing rules, check whether the target renders into a shadow root. If it does, look for (a) brand/theme values the app reads from a global at boot, then (b) `mode:"open"` + `adoptedStyleSheets`. Contrast with Salesforce, where LWC shadow roots consume `--lwc-*` custom properties — those *do* inherit across the boundary, which is why that style works as pure CSS.

Full write-up in `Stylus/okta/README.md`.

## Ghostty config paths

Ghostty checks XDG paths first (`$XDG_CONFIG_HOME/ghostty/{config.ghostty,config}`) and then macOS-specific paths (`~/Library/Application Support/com.mitchellh.ghostty/{config.ghostty,config}`). All matching files are loaded; **later loads override earlier ones**, so on macOS the Application Support file wins on conflicts unless it doesn't exist.

**Convention for this repo**: `~/.config/ghostty/config` (the XDG path) is the symlink to the repo on every OS. On macOS the Application Support file must be absent (or empty) for the XDG file to be authoritative. The user's Mac currently has it renamed to `config.ghostty.bak`.

**Preferences-pane footgun (macOS)**: if you change a setting in Ghostty's Preferences GUI, it writes to the Application Support path and silently re-introduces override behavior. Either avoid the GUI for config changes, or move the new file back into the repo afterward.

## tmux specifics

- Prefix is rebound from `C-b` to `C-a` (`tmux.conf:14-16`).
- `prefix + r` reloads `~/.tmux.conf`.
- `Alt-arrow` switches panes without the prefix.
- `tmux-continuum` auto-restore is on, so sessions persist across restarts.
