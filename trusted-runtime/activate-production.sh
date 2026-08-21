#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="fifa17-career-showdown-prod"
REGION="us-east4"
REPOSITORY="cms-trusted-runtime"
IMAGE="career-mode-showdown-trusted-runtime"
SERVICE="career-mode-showdown-trusted-runtime"
SERVICE_ACCOUNT_ID="cms-trusted-runtime"
SERVICE_ACCOUNT="${SERVICE_ACCOUNT_ID}@${PROJECT_ID}.iam.gserviceaccount.com"
ROLE_ID="careerModeShowdownAccountBootstrap"
ROLE_NAME="projects/${PROJECT_ID}/roles/${ROLE_ID}"
ROLE_FILE="trusted-runtime/runtime-role.yaml"
BUILD_FILE="trusted-runtime/cloudbuild.yaml"

fail(){ printf 'ERROR: %s\n' "$*" >&2; exit 1; }
info(){ printf '%s\n' "$*"; }

command -v gcloud >/dev/null 2>&1 || fail "gcloud is required. Run this from Google Cloud Shell or an authenticated gcloud environment."
command -v git >/dev/null 2>&1 || fail "git is required to bind the image tag to an exact source revision."

ACTIVE_ACCOUNT="$(gcloud auth list --filter=status:ACTIVE --format='value(account)' | head -n1)"
[[ -n "$ACTIVE_ACCOUNT" ]] || fail "No active gcloud account is available."

gcloud config set project "$PROJECT_ID" >/dev/null
CURRENT_PROJECT="$(gcloud config get-value project 2>/dev/null)"
[[ "$CURRENT_PROJECT" == "$PROJECT_ID" ]] || fail "Active gcloud project is not ${PROJECT_ID}."

GIT_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
[[ "$GIT_SHA" =~ ^[0-9a-f]{40}$ ]] || fail "Run this from an exact checked-out repository commit."

if [[ -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  fail "GOOGLE_APPLICATION_CREDENTIALS is set. Exported service-account credential files are forbidden for this production runtime."
fi

info "Production trusted runtime activation preflight"
info "Project: ${PROJECT_ID}"
info "Region: ${REGION}"
info "Source SHA: ${GIT_SHA}"
info "Deployer: ${ACTIVE_ACCOUNT}"

# Enabling services can require billing to already be enabled. This script never
# creates or changes a billing account. If the command fails for billing, stop and
# resolve billing explicitly in the Google Cloud console before rerunning.
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  identitytoolkit.googleapis.com \
  firestore.googleapis.com \
  firebaseappcheck.googleapis.com \
  --project="$PROJECT_ID"

if ! gcloud artifacts repositories describe "$REPOSITORY" --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$REPOSITORY" \
    --project="$PROJECT_ID" \
    --repository-format=docker \
    --location="$REGION" \
    --description="Career Mode Showdown trusted runtime images"
fi

if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project="$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create "$SERVICE_ACCOUNT_ID" \
    --project="$PROJECT_ID" \
    --display-name="Career Mode Showdown Trusted Runtime" \
    --description="Dedicated Cloud Run identity for exact account-bootstrap provider access only"
fi

# A pre-existing role with this ID is never silently overwritten. It must already
# contain exactly the Stage 2H permission set or activation stops for review.
EXPECTED_PERMISSIONS="datastore.databases.get datastore.entities.create datastore.entities.get firebaseauth.users.get"
if gcloud iam roles describe "$ROLE_ID" --project="$PROJECT_ID" >/tmp/cms-role.txt 2>/dev/null; then
  ACTUAL_PERMISSIONS="$(gcloud iam roles describe "$ROLE_ID" --project="$PROJECT_ID" --format='value(includedPermissions)' | tr ';,' '\n' | sed '/^$/d' | sort | xargs)"
  [[ "$ACTUAL_PERMISSIONS" == "$EXPECTED_PERMISSIONS" ]] || fail "Existing custom role ${ROLE_NAME} does not match the exact four-permission Stage 2H boundary. Nothing was changed."
else
  gcloud iam roles create "$ROLE_ID" \
    --project="$PROJECT_ID" \
    --file="$ROLE_FILE"
fi

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="$ROLE_NAME" \
  --condition=None >/dev/null

# The build identity receives image-upload authority only on this dedicated
# Artifact Registry repository. It is not the Cloud Run runtime identity.
BUILD_SERVICE_ACCOUNT="$(gcloud builds get-default-service-account --project="$PROJECT_ID" 2>/dev/null || true)"
[[ -n "$BUILD_SERVICE_ACCOUNT" ]] || fail "Could not resolve the Cloud Build service account."
gcloud artifacts repositories add-iam-policy-binding "$REPOSITORY" \
  --project="$PROJECT_ID" \
  --location="$REGION" \
  --member="serviceAccount:${BUILD_SERVICE_ACCOUNT}" \
  --role="roles/artifactregistry.writer" >/dev/null

IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE}:${GIT_SHA}"
gcloud builds submit . \
  --project="$PROJECT_ID" \
  --config="$BUILD_FILE" \
  --substitutions="_REGION=${REGION},_REPOSITORY=${REPOSITORY},_IMAGE=${IMAGE},_TAG=${GIT_SHA}"

gcloud run deploy "$SERVICE" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --image="$IMAGE_URI" \
  --service-account="$SERVICE_ACCOUNT" \
  --allow-unauthenticated \
  --ingress=all \
  --min-instances=0 \
  --max-instances=2 \
  --cpu=1 \
  --memory=512Mi \
  --concurrency=20 \
  --timeout=15s \
  --port=8080 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"

SERVICE_URL="$(gcloud run services describe "$SERVICE" --project="$PROJECT_ID" --region="$REGION" --format='value(status.url)')"
[[ "$SERVICE_URL" == https://* ]] || fail "Cloud Run did not return a valid HTTPS service URL."

# Prove the public network layer is alive without granting application authority.
HEALTH_RESPONSE="$(curl --fail --silent --show-error "${SERVICE_URL}/healthz")"
[[ "$HEALTH_RESPONSE" == *'"ok":true'* ]] || fail "Trusted runtime health endpoint did not return the expected bounded response."

# A protected operation without both transient credentials must remain rejected.
HTTP_STATUS="$(curl --silent --output /tmp/cms-protected-response.json --write-out '%{http_code}' \
  -X POST \
  -H 'Origin: https://nikahanghojjati-oss.github.io' \
  -H 'Content-Type: application/json' \
  --data '{}' \
  "${SERVICE_URL}/v1/account/bootstrap")"
[[ "$HTTP_STATUS" == "401" ]] || fail "Protected account-bootstrap endpoint did not fail closed without credentials; observed HTTP ${HTTP_STATUS}."

info "Trusted runtime deployment completed."
info "Service URL: ${SERVICE_URL}"
info "Runtime identity: ${SERVICE_ACCOUNT}"
info "Runtime role: ${ROLE_NAME}"
info "Image: ${IMAGE_URI}"
info "IMPORTANT: this proves deployment and unauthenticated fail-closed behavior only. Do not award RJR production-auth/IAM points until a legitimate App Check + Firebase Auth request and exact IAM behavior are separately proven."
