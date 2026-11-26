#!/usr/bin/env bash
# 소스(src/js)를 압축·난독화해서 배포 폴더(js)로 — 배포 전 실행
set -e
cd "$(dirname "$0")"
for f in src/js/*.js; do
  n=$(basename "$f")
  npx --yes terser@5 "$f" --compress --mangle -o "js/$n" 2>/dev/null
done
echo "minified $(ls src/js/*.js | wc -l) files → js/"
