# Salesforce Catppuccin

Catppuccin theme for Salesforce Lightning Experience, with a distinct **header stripe color per environment** so you always know whether you're in production or a sandbox at a glance.

## Install

1. Install the [Stylus](https://add0n.com/stylus.html) browser extension (Chrome / Firefox / Edge).
2. Open the raw file: [`catppuccin.user.less`](./catppuccin.user.less)
3. Stylus should prompt to install. If not, copy the file contents and paste them into a new Stylus style via the extension's "Write new style" UI.
4. In Stylus, configure your preferred **Flavor** and **Accent** via the style's settings.

## Per-environment header stripe

A 4px stripe sits at the top of the Salesforce global header bar. The color tells you which environment you're in:

| Environment | URL pattern | Stripe color |
| --- | --- | --- |
| Production | `*.lightning.force.com` (without `.sandbox.`) | **Red** (Catppuccin `red`) — visual caution |
| Sandbox | `*.sandbox.lightning.force.com` | **Mauve** (Catppuccin `mauve`) — calm |

Both colors come from the active Catppuccin flavor's palette, so they shift with your flavor selection. The behavior works for any Salesforce org without configuration — URL patterns are global, not org-specific.

## Why not different accents *everywhere* per environment?

The original idea was to swap the *entire* theme accent based on which env you're in (so links, buttons, focus rings would all turn red in prod). The blocker: Chrome's Stylus build silently drops chained CSS custom properties (e.g. `--sf-accent: var(--prodAccent)` evaluates to empty). The clean alternative is to scope a single accent for the theme and use a prominent header stripe as the environment indicator. The stripe is unmissable; the rest of the theme stays coherent.

## Structure

```
Stylus/salesforce/
├── README.md                  # you are here
└── catppuccin.user.less       # the userstyle (Less, uses catppuccin's shared lib)
```

Mirrors [catppuccin/userstyles](https://github.com/catppuccin/userstyles)' `styles/<site>/` convention. If we ever upstream this style, the `.user.less` file moves into their monorepo without changes.

## Status

**v0.1.0 (Phase 2)** — header stripe lands here. Full Catppuccin theme rules (navigation, home, list views, record pages, modals, Setup) are pending the Phase 3 audit. See the TODO inside `catppuccin.user.less`.

## Known gaps

- Header selectors (`.slds-global-header_container`, `.desktop.container.oneHeader`, `header.oneHeader`) are best-guess SLDS class names. If the stripe doesn't appear after install, the audit pass needs to update them.
- Salesforce Setup pages on newer orgs may live at `*.salesforce-setup.com` — not yet covered by the regex.
- SLDS 2 / Cosmos theme (org-wide opt-in) exposes design tokens that would dramatically simplify theming. This style targets SLDS 1, the current default for most orgs.
