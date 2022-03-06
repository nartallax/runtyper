#!/bin/bash
set -e
cd `dirname "$0"`
cd ..

ENTRYPOINT_FILE=${1-ts/entrypoint.ts}
DTS_FILE=${2-target/runtyper.d.ts}
TSCONFIG_FILE=${3-tsconfig.json}




TMP_TSCONFIG_FILE="$TSCONFIG_FILE.tmp.json"
trap '{ rm -- "$TMP_TSCONFIG_FILE"; }' EXIT
cat "$TSCONFIG_FILE" | sed 's/"removeComments": true/"removeComments": false/' > "$TMP_TSCONFIG_FILE"

TMP_DTS_FILE="$DTS_FILE.tmp"
./node_modules/.bin/dts-bundle-generator -o "$DTS_FILE" --project "$TMP_TSCONFIG_FILE" --no-banner "$ENTRYPOINT_FILE"
sed 's/export [*] from.*//g' "$DTS_FILE" | sed 's/export [{][}].*//g' > $TMP_DTS_FILE
mv $TMP_DTS_FILE "$DTS_FILE"