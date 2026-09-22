#!/usr/bin/env bash
set -euo pipefail

main() {
    ZOLA_VERSION=0.23.6

    curl -fsSL "https://github.com/getzola/zola/releases/download/v${ZOLA_VERSION}/zola-v${ZOLA_VERSION}-x86_64-unknown-linux-gnu.tar.gz" | tar -xz zola

    ./zola build
}

main
