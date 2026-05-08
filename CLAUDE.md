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

## Ghostty config paths

Ghostty checks XDG paths first (`$XDG_CONFIG_HOME/ghostty/{config.ghostty,config}`) and then macOS-specific paths (`~/Library/Application Support/com.mitchellh.ghostty/{config.ghostty,config}`). All matching files are loaded; **later loads override earlier ones**, so on macOS the Application Support file wins on conflicts unless it doesn't exist.

**Convention for this repo**: `~/.config/ghostty/config` (the XDG path) is the symlink to the repo on every OS. On macOS the Application Support file must be absent (or empty) for the XDG file to be authoritative. The user's Mac currently has it renamed to `config.ghostty.bak`.

**Preferences-pane footgun (macOS)**: if you change a setting in Ghostty's Preferences GUI, it writes to the Application Support path and silently re-introduces override behavior. Either avoid the GUI for config changes, or move the new file back into the repo afterward.

## tmux specifics

- Prefix is rebound from `C-b` to `C-a` (`tmux.conf:14-16`).
- `prefix + r` reloads `~/.tmux.conf`.
- `Alt-arrow` switches panes without the prefix.
- `tmux-continuum` auto-restore is on, so sessions persist across restarts.
