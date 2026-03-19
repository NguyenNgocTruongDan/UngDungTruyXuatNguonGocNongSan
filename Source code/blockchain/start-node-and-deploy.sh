#!/bin/sh
set -eu

SHARED_DIR="${SHARED_DIR:-/shared}"
CONTRACT_FILE="${CONTRACT_FILE:-${SHARED_DIR}/contract.env}"

mkdir -p "${SHARED_DIR}"
rm -f "${CONTRACT_FILE}"

echo "Starting Hardhat node..."
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
NODE_PID=$!

cleanup() {
  kill "${NODE_PID}" 2>/dev/null || true
}

trap cleanup INT TERM

echo "Waiting for Hardhat node to be ready..."
i=0
while ! grep -q "Started HTTP and WebSocket JSON-RPC server" /tmp/hardhat-node.log 2>/dev/null; do
  i=$((i + 1))
  if [ "${i}" -ge 60 ]; then
    echo "Hardhat node failed to start."
    cat /tmp/hardhat-node.log
    exit 1
  fi
  sleep 2
done

echo "Deploying local contract..."
DEPLOY_OUTPUT="$(npm run deploy:local 2>&1)" || {
  echo "${DEPLOY_OUTPUT}"
  exit 1
}

echo "${DEPLOY_OUTPUT}"

CONTRACT_ADDRESS="$(printf '%s\n' "${DEPLOY_OUTPUT}" | sed -n 's/^CONTRACT_ADDRESS=//p' | tail -n 1)"

if [ -z "${CONTRACT_ADDRESS}" ]; then
  echo "Could not parse contract address from deploy output."
  exit 1
fi

printf 'CONTRACT_ADDRESS=%s\n' "${CONTRACT_ADDRESS}" > "${CONTRACT_FILE}"
echo "Saved contract address to ${CONTRACT_FILE}"

wait "${NODE_PID}"
