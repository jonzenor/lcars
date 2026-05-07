#!/usr/bin/env bash

set -e

echo "Installing Homebrew packages..."
brew bundle

echo "Installing TPM..."
if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
  git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
fi

echo "Creating symlinks..."
ln -sf ~/subspace/lcars/tmux/.tmux.conf ~/.tmux.conf
ln -sf ~/subspace/lcars/zsh/.zshrc ~/.zshrc

echo "Done."
