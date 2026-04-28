#!/bin/bash

# Exit immediately on error, treat unset variables as an error, and fail if any command in a pipeline fails.
set -euo pipefail

# Function to run a command and show logs only on error
run_command() {
    local command_to_run="$*"
    local output
    local exit_code

    # Capture all output (stdout and stderr)
    output=$(eval "$command_to_run" 2>&1) || exit_code=$?
    exit_code=${exit_code:-0}

    if [ $exit_code -ne 0 ]; then
        echo -e "\033[0;31m[ERROR] Command failed (Exit Code $exit_code): $command_to_run\033[0m" >&2
        echo -e "\033[0;31m$output\033[0m" >&2

        exit $exit_code
    fi
}

install_kiro() {
    echo -e "\n🤖 Installing Kiro CLI..."
    local kiro_url="https://kiro.dev/install.sh"
    local kiro_sha256="7487a65cf310b7fb59b357c4b5e6e3f3259d383f4394ecedb39acf70f307cffb"
    local kiro_path
    kiro_path=$(mktemp)

    cleanup() {
        rm -f "$kiro_path"
    }
    trap cleanup EXIT

    run_command "curl -fsSL \"$kiro_url\" -o \"$kiro_path\""
    run_command "echo \"$kiro_sha256  $kiro_path\" | sha256sum -c -"
    run_command "bash \"$kiro_path\""

    local kiro_binary=""
    if command -v kiro-cli >/dev/null 2>&1; then
        kiro_binary="kiro-cli"
    elif command -v kiro >/dev/null 2>&1; then
        kiro_binary="kiro"
    else
        echo -e "\033[0;31m[ERROR] Kiro CLI installation did not create 'kiro-cli' or 'kiro' in PATH.\033[0m" >&2
        return 1
    fi

    run_command "$kiro_binary --help > /dev/null"
    echo "✅ Done"
}

# Installing CLI-based AI Agents

echo -e "\n🤖 Installing Copilot CLI..."
run_command "npm install -g @github/copilot@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Claude CLI..."
run_command "npm install -g @anthropic-ai/claude-code@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Codex CLI..."
run_command "npm install -g @openai/codex@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Gemini CLI..."
run_command "npm install -g @google/gemini-cli@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Augie CLI..."
run_command "npm install -g @augmentcode/auggie@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Qwen Code CLI..."
run_command "npm install -g @qwen-code/qwen-code@latest"
echo "✅ Done"

echo -e "\n🤖 Installing OpenCode CLI..."
run_command "npm install -g opencode-ai@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Junie CLI..."
run_command "npm install -g @jetbrains/junie-cli@latest"
echo "✅ Done"

echo -e "\n🤖 Installing Pi Coding Agent..."
run_command "npm install -g @mariozechner/pi-coding-agent@latest"
echo "✅ Done"

# install_kiro

echo -e "\n🤖 Installing Kimi CLI..."
# https://code.kimi.com
run_command "pipx install kimi-cli"
echo "✅ Done"

echo -e "\n🤖 Installing CodeBuddy CLI..."
run_command "npm install -g @tencent-ai/codebuddy-code@latest"
echo "✅ Done"

# Installing UV (Python package manager)
echo -e "\n🐍 Installing UV - Python Package Manager..."
run_command "pipx install uv"
echo "✅ Done"

# Installing Rust and wasm-pack for chess game build
echo -e "\n🦀 Installing Rust..."
run_command "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y"
# Add cargo to PATH for this session
export PATH="$HOME/.cargo/bin:$PATH"
echo "✅ Done"

echo -e "\n📦 Installing wasm-pack..."
run_command "$HOME/.cargo/bin/cargo install wasm-pack"
echo "✅ Done"

# Installing GitHub CLI
echo -e "\n🐙 Installing GitHub CLI..."
(type -p wget >/dev/null || (sudo apt update && sudo apt install wget -y)) \
	&& sudo mkdir -p -m 755 /etc/apt/keyrings \
	&& out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
	&& cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
	&& sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
	&& sudo mkdir -p -m 755 /etc/apt/sources.list.d \
	&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
	&& sudo DEBIAN_FRONTEND=noninteractive apt-get update \
	&& sudo DEBIAN_FRONTEND=noninteractive apt-get install gh -y
echo "✅ Done"

# Installing Spec Kit (Spec-Driven Development)
echo -e "\n📋 Installing Spec Kit..."
run_command "uv tool install specify-cli --from git+https://github.com/github/spec-kit.git"
echo "✅ Done"

# Installing DocFx (for documentation site)
echo -e "\n📚 Installing DocFx..."
run_command "dotnet tool update -g docfx"
echo "✅ Done"

echo -e "\n🧹 Cleaning cache..."
run_command "sudo apt-get autoclean"
run_command "sudo apt-get clean"

echo "✅ Setup completed. Happy coding! 🚀"
