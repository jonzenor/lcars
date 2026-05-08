# lcars

Personal dotfiles for a consistent shell experience across machines. Currently macOS-only; Linux support is planned.

## What's in it

- **Shell**: zsh (primary), bash
- **Multiplexer**: tmux + TPM
- **Prompt**: starship
- **Terminal**: Ghostty
- **CLI replacements**: eza (`ls`), bat (`cat`), zoxide (`cd`-like)

Everything is themed with [catppuccin](https://github.com/catppuccin/catppuccin) mocha.

## Install

The repo can live anywhere — `install.sh` uses its own path:

```sh
git clone <repo-url> lcars
cd lcars
./install.sh
```

This installs Homebrew packages from `Brewfile`, clones TPM, symlinks every config into the right place, and installs tmux plugins headlessly. Existing real files at symlink targets are renamed to `*.bak` before linking.

Prerequisite: Homebrew (`install.sh` exits with the install URL if it's missing).

## Update

When packages or tmux plugins are stale:

```sh
./install.sh --update
```

Adds: `brew upgrade`, `git pull` of TPM, and `update_plugins all` for installed tmux plugins. Symlinking and config backup behavior is unchanged.

## After install

- Open a fresh Ghostty window — the theme/font come from `ghostty/config`.
- Restart tmux (or run `prefix + r`) to pick up plugin changes.
