#!/usr/bin/env bash

set -euo pipefail

LCARS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

UPDATE_MODE=false
case "${1:-}" in
  --update) UPDATE_MODE=true ;;
  "")       ;;
  *) echo "Usage: $0 [--update]" >&2; exit 2 ;;
esac

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is not installed." >&2
  echo "Install it from https://brew.sh and re-run this script." >&2
  exit 1
fi

echo "Installing Homebrew packages..."
brew bundle --file="$LCARS_DIR/Brewfile"

if $UPDATE_MODE; then
  echo "Upgrading Homebrew packages..."
  brew upgrade
fi

if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
  echo "Cloning TPM..."
  git clone https://github.com/tmux-plugins/tpm "$HOME/.tmux/plugins/tpm"
elif $UPDATE_MODE; then
  echo "Updating TPM..."
  git -C "$HOME/.tmux/plugins/tpm" pull --ff-only
fi

link() {
  local src="$1" dest="$2"
  mkdir -p "$(dirname "$dest")"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "Backing up $dest -> $dest.bak"
    mv "$dest" "$dest.bak"
  fi
  ln -sfn "$src" "$dest"
}

echo "Linking configs..."
link "$LCARS_DIR/zsh/zshrc"              "$HOME/.zshrc"
link "$LCARS_DIR/bash/bashrc"            "$HOME/.bashrc"
link "$LCARS_DIR/tmux/tmux.conf"         "$HOME/.tmux.conf"
link "$LCARS_DIR/starship/starship.toml" "$HOME/.config/starship.toml"
link "$LCARS_DIR/bat/config"             "$HOME/.config/bat/config"
link "$LCARS_DIR/eza/theme.yml"          "$HOME/.config/eza/theme.yml"
link "$LCARS_DIR/ghostty/config"         "$HOME/.config/ghostty/config"

GHOSTTY_APP_SUPPORT="$HOME/Library/Application Support/com.mitchellh.ghostty/config.ghostty"
if [ -f "$GHOSTTY_APP_SUPPORT" ] && [ ! -L "$GHOSTTY_APP_SUPPORT" ]; then
  echo "Renaming $GHOSTTY_APP_SUPPORT -> $GHOSTTY_APP_SUPPORT.bak (XDG symlink is authoritative)"
  mv "$GHOSTTY_APP_SUPPORT" "$GHOSTTY_APP_SUPPORT.bak"
fi

if $UPDATE_MODE; then
  echo "Updating tmux plugins..."
  "$HOME/.tmux/plugins/tpm/bin/update_plugins" all
else
  echo "Installing tmux plugins..."
  "$HOME/.tmux/plugins/tpm/bin/install_plugins"
fi

echo "Done."
