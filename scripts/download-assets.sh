#!/bin/bash -ex

# Download HTMX version to public directory
HTMX_VERSION="2.0.6"
HTMX_URL="https://cdn.jsdelivr.net/npm/htmx.org@${HTMX_VERSION}/dist/htmx.min.js"
HTMX_SHA256="b6768eed4f3af85b73a75054701bd60e17cac718aef2b7f6b254e5e0e2045616"
HTMX_FILE="public/htmx.min.js"

echo "Downloading HTMX ${HTMX_VERSION}..."
curl -fsSL -o "${HTMX_FILE}" "${HTMX_URL}"

echo "Verifying integrity..."
echo "${HTMX_SHA256}  ${HTMX_FILE}" | sha256sum -c - || {
  echo "ERROR: Integrity check failed for ${HTMX_FILE}"
  rm -f "${HTMX_FILE}"
  exit 1
}

echo "Successfully downloaded and verified HTMX ${HTMX_VERSION}"
