#!/bin/sh
set -eu

CONTRACT_FILE_PATH="${CONTRACT_FILE:-/shared/contract.env}"

echo "Waiting for contract address file: ${CONTRACT_FILE_PATH}"
i=0
while [ ! -f "${CONTRACT_FILE_PATH}" ]; do
  i=$((i + 1))
  if [ "${i}" -ge 120 ]; then
    echo "Timed out waiting for contract file."
    exit 1
  fi
  sleep 2
done

set -a
. "${CONTRACT_FILE_PATH}"
set +a

echo "Starting API with contract: ${CONTRACT_ADDRESS:-missing}"
exec node dist/index.js
