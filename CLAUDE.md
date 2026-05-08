# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

Personal dotfiles for zsh, bash, tmux, and starship. The goal is a consistent shell experience across the user's Mac and Linux machines — keep portability in mind when adding tools or install steps. There is no build, no tests, and no application code; every change is a config edit that takes effect on the next shell/tmux reload.

The current `install.sh` is Mac-only (uses `brew bundle`). A Linux install path is a likely future need.

## Install flow

`./install.sh` is the only entry point. It:
1. Runs `brew bundle` (expects a `Brewfile` in the repo root — **not currently checked in**; adding one is a likely future task).
2. Clones [TPM](https://github.com/tmux-plugins/tpm) to `~/.tmux/plugins/tpm` if missing.
3. Symlinks configs into `$HOME`.

The script hardcodes `~/subspace/lcars` as the repo location — the repo must live there for the symlinks to resolve.

## Known issues in install.sh (deferred — install.sh is its own future project)

- Symlinks `tmux/.tmux.conf` and `zsh/.zshrc` (leading dots), but the actual files are `tmux/tmux.conf` and `zsh/zshrc` (no dots). Symlinks resolve to nothing.
- Doesn't link `starship/starship.toml` → `~/.config/starship.toml`, `bat/config` → `~/.config/bat/config`, `bat/themes/` → `~/.config/bat/themes/`, or `eza/theme.yml` → `~/.config/eza/theme.yml`. These configs exist in the repo but won't take effect until install.sh is rewritten.
- No `Brewfile` in the repo root despite `brew bundle` being called.

## Runtime dependencies assumed by zshrc

`zsh/zshrc` aliases and inits assume these are on `PATH`: `starship`, `zoxide`, `eza`, `bat`. They should come from `brew bundle` once a Brewfile exists.

## Theming

Everything is on the catppuccin **mocha** flavor. When adding tools, keep them on mocha for consistency.

- **starship**: palette set in `starship/starship.toml`.
- **tmux**: `catppuccin/tmux` is in the TPM plugin list; `@catppuccin_flavor 'mocha'` is set. After editing the plugin list, run `prefix + I` inside tmux to install.
- **bat**: theme `Catppuccin Mocha.tmTheme` is vendored under `bat/themes/`. `bat/config` selects it. After symlinking themes into `~/.config/bat/themes/`, run `bat cache --build` once so bat picks up the custom theme.
- **eza**: `eza/theme.yml` is the **mauve** mocha variant from `catppuccin/eza`, chosen to match starship's git_branch accent. To swap accents, replace the file with another from `catppuccin/eza`'s `themes/mocha/` directory. eza reads it from `~/.config/eza/theme.yml` (requires eza ≥ 0.20).
- **Ghostty**: `ghostty/config` is vendored. `theme = Catppuccin Mocha` references Ghostty's built-in theme — no theme file needs to be installed (the cloned `~/.config/ghostty/themes/catppuccin/` directory on the user's Mac is leftover and unused; safe to delete). Config locations differ by OS — see "Ghostty config paths" below.

## Ghostty config paths

Ghostty checks XDG paths first (`$XDG_CONFIG_HOME/ghostty/{config.ghostty,config}`) and then macOS-specific paths (`~/Library/Application Support/com.mitchellh.ghostty/{config.ghostty,config}`). All matching files are loaded; **later loads override earlier ones**, so on macOS the Application Support file wins on conflicts unless it doesn't exist.

**Convention for this repo**: `~/.config/ghostty/config` (the XDG path) is the symlink to the repo on every OS. On macOS the Application Support file must be absent (or empty) for the XDG file to be authoritative. The user's Mac currently has it renamed to `config.ghostty.bak`.

**Preferences-pane footgun (macOS)**: if you change a setting in Ghostty's Preferences GUI, it writes to the Application Support path and silently re-introduces override behavior. Either avoid the GUI for config changes, or move the new file back into the repo afterward.

## tmux specifics

- Prefix is rebound from `C-b` to `C-a` (`tmux.conf:14-16`).
- `prefix + r` reloads `~/.tmux.conf`.
- `Alt-arrow` switches panes without the prefix.
- `tmux-continuum` auto-restore is on, so sessions persist across restarts.
