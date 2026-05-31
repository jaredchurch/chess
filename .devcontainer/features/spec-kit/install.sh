#!/bin/bash
set -e

# refer: https://github.com/github/spec-kit

# export DEBIAN_FRONTEND=noninteractive

uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
uv tool update-shell
echo "✅ Install Spec Kit"

### End of File
