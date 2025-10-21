# CI/CD Environment Setup Guide

EntryPoint builds each webapp container once in the shared Google Cloud project `entrypoint-common`, then deploys that image into separate runtime projects (Dev, Staging, Production, …). Configuring this flow has two distinct phases:

1. **Shared Setup (one-time)** – bootstrap resources in `entrypoint-common` and the GitHub `Artifacts` environment.
2. **Per-Environment Setup (repeat per runtime project)** – provision deploy/runtime identities, grant access to the shared Artifact Registry, and configure the matching GitHub environment.

Keep these responsibilities separate to avoid accidental cross-project privilege bleed.

---

## Service Accounts Overview

| Purpose | Project | Name | Used by | Key Permissions |
|---------|---------|------|---------|-----------------|
| Build pipeline | `entrypoint-common` | `github-actions` | `.github/workflows/build-and-publish.yml` | `roles/artifactregistry.writer`, `roles/iam.serviceAccountTokenCreator` |
| Deploy pipeline (per environment) | `<env-project>` | `github-actions` | `.github/workflows/deploy-to-cloud-run.yml`, `.github/workflows/promote-to-production.yml` | `roles/run.admin`, `roles/iam.serviceAccountTokenCreator`, `roles/artifactregistry.reader` (granted in `entrypoint-common`) |
| Cloud Run runtime identity | `<env-project>` | `entrypoint-webapp-sa` | Cloud Run service | Access to runtime dependencies + `roles/artifactregistry.reader` (granted in `entrypoint-common`) |

All GitHub workflows authenticate via Workload Identity Federation (WIF); no service account keys are required.

---

## Phase 1 – One-Time Shared Setup (`entrypoint-common`)

Perform these steps exactly once (or when rotating credentials).

### 1. Enable Artifact Registry API

```bash
COMMON_PROJECT=entrypoint-common
gcloud services enable artifactregistry.googleapis.com \
  --project "${COMMON_PROJECT}"
```

> The Docker repository `us-central1-docker.pkg.dev/entrypoint-common/webapp` already exists; no creation command is required.

### 2. Create (or verify) the build service account and roles

```bash
COMMON_PROJECT=entrypoint-common
COMMON_SA_NAME=github-actions
COMMON_SA=${COMMON_SA_NAME}@${COMMON_PROJECT}.iam.gserviceaccount.com

gcloud iam service-accounts create "${COMMON_SA_NAME}" \
  --project "${COMMON_PROJECT}" \
  --display-name="GitHub build pipeline" \
  --description="Allows GitHub Actions to publish images to Artifact Registry" || true

gcloud projects add-iam-policy-binding "${COMMON_PROJECT}" \
  --member="serviceAccount:${COMMON_SA}" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "${COMMON_PROJECT}" \
  --member="serviceAccount:${COMMON_SA}" \
  --role="roles/iam.serviceAccountTokenCreator"
```

Re-running these commands is safe; Google Cloud will no-op if the account or bindings already exist.

### 3. Configure Workload Identity Federation for the build pipeline

```bash
COMMON_PROJECT=entrypoint-common
COMMON_POOL=github-actions-pool
COMMON_PROVIDER=github-actions-provider
GITHUB_OWNER=EntryPointSRM
GITHUB_REPO=entrypoint-webapp
COMMON_SA=github-actions@${COMMON_PROJECT}.iam.gserviceaccount.com
COMMON_PROJECT_NUMBER=$(gcloud projects describe "${COMMON_PROJECT}" --format='value(projectNumber)')

# Ensure the workload identity pool exists.
gcloud iam workload-identity-pools describe "${COMMON_POOL}" \
  --project "${COMMON_PROJECT}" \
  --location=global >/dev/null 2>&1 || \
gcloud iam workload-identity-pools create "${COMMON_POOL}" \
  --project "${COMMON_PROJECT}" \
  --location=global \
  --display-name="GitHub Actions"

# Ensure the OIDC provider exists and includes the repository claim.
if gcloud iam workload-identity-pools providers describe "${COMMON_PROVIDER}" \
    --project "${COMMON_PROJECT}" \
    --location=global \
    --workload-identity-pool="${COMMON_POOL}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "${COMMON_PROVIDER}" \
    --project "${COMMON_PROJECT}" \
    --location=global \
    --workload-identity-pool="${COMMON_POOL}" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="attribute.repository==\"${GITHUB_OWNER}/${GITHUB_REPO}\""
else
  gcloud iam workload-identity-pools providers create-oidc "${COMMON_PROVIDER}" \
    --project "${COMMON_PROJECT}" \
    --location=global \
    --workload-identity-pool="${COMMON_POOL}" \
    --display-name="GitHub Actions OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="attribute.repository==\"${GITHUB_OWNER}/${GITHUB_REPO}\""
fi

gcloud iam service-accounts add-iam-policy-binding "${COMMON_SA}" \
  --project "${COMMON_PROJECT}" \
  --member="principalSet://iam.googleapis.com/projects/${COMMON_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${COMMON_POOL}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --role="roles/iam.workloadIdentityUser"

echo "projects/${COMMON_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${COMMON_POOL}/providers/${COMMON_PROVIDER}"
```

Record the provider resource string printed by the final `echo`; it becomes the `GAR_WORKLOAD_IDENTITY_PROVIDER` value used by GitHub Actions.

### 4. Configure shared GitHub variables/secrets for the build pipeline

Because every repository publishes to the same Artifact Registry, define these at the organization or repository level (GitHub → **Settings → Secrets and variables → Actions**):

- **Variables**
  - `GAR_HOSTNAME` → `us-central1-docker.pkg.dev`
  - `GAR_LOCATION` → `us-central1-docker.pkg.dev/entrypoint-common/webapp`
  - `GAR_WORKLOAD_IDENTITY_PROVIDER` → provider string from Step 3
  - `GAR_SERVICE_ACCOUNT` → `github-actions@entrypoint-common.iam.gserviceaccount.com`

If you prefer to scope them to an environment, use the same names, but the workflow no longer relies on the `Artifacts` environment being present—it reads the values directly from `vars.*`.

---

## Phase 2 – Per-Environment Setup (repeat for each runtime project)

Complete this sequence for every deployment project (e.g., `entrypoint-dev`, `entrypoint-prod`). Substitute the actual project ID in each code block.

### 1. Provision environment identities and Workload Identity Federation in Google Cloud

**This script:**
- Enables Cloud Run and IAM Credentials in the runtime project.
- Creates or verifies the GitHub deploy and Cloud Run runtime service accounts.
- Configures Workload Identity (pool + provider) with a repository-scoped condition.
- Grants the deploy service account WIF access and GitHub repository mapping.
- Grants both service accounts read access to the shared Artifact Registry repository.

```bash
# --- update these variables before running ---
ENV_PROJECT=<replace-with-env-project-id>
DEPLOY_SA_NAME=github-actions
RUNTIME_SA_NAME=entrypoint-webapp-sa
ENV_POOL=github-actions-pool
ENV_PROVIDER=github-actions-provider
GITHUB_OWNER=EntryPointSRM
GITHUB_REPO=entrypoint-webapp
CLOUD_RUN_SERVICE=entrypoint-webapp
CLOUD_RUN_REGION=us-central1
# --- derived values ---
DEPLOY_SA=${DEPLOY_SA_NAME}@${ENV_PROJECT}.iam.gserviceaccount.com
RUNTIME_SA=${RUNTIME_SA_NAME}@${ENV_PROJECT}.iam.gserviceaccount.com
ENV_PROJECT_NUMBER=$(gcloud projects describe "${ENV_PROJECT}" --format='value(projectNumber)')

# Enable Cloud Run & IAM Credentials in the environment project (Artifact Registry lives in entrypoint-common).
gcloud services enable run.googleapis.com iamcredentials.googleapis.com \
  --project "${ENV_PROJECT}"

# Create (or reuse) the deploy service account with minimum required roles.
gcloud iam service-accounts create "${DEPLOY_SA_NAME}" \
  --project "${ENV_PROJECT}" \
  --display-name="GitHub deploy pipeline" \
  --description="Allows GitHub Actions to deploy to Cloud Run" || true

gcloud projects add-iam-policy-binding "${ENV_PROJECT}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${ENV_PROJECT}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountTokenCreator"

# Create (or reuse) the Cloud Run runtime service account.
gcloud iam service-accounts create "${RUNTIME_SA_NAME}" \
  --project "${ENV_PROJECT}" \
  --display-name="Runtime SA for EntryPoint webapp" \
  --description="Identity used by Cloud Run service" || true

# Set the Cloud Run service account (assumes the Cloud Run service exists — TODO add this)
gcloud run services update "${CLOUD_RUN_SERVICE}" \
  --project "${ENV_PROJECT}" \
  --region "${CLOUD_RUN_REGION}" \
  --service-account "${RUNTIME_SA}"

# Ensure the Workload Identity pool exists.
gcloud iam workload-identity-pools describe "${ENV_POOL}" \
  --project "${ENV_PROJECT}" \
  --location=global >/dev/null 2>&1 || \
gcloud iam workload-identity-pools create "${ENV_POOL}" \
  --project "${ENV_PROJECT}" \
  --location=global \
  --display-name="GitHub Actions"

# Create or update the OIDC provider with the repository claim/condition.
if gcloud iam workload-identity-pools providers describe "${ENV_PROVIDER}" \
    --project "${ENV_PROJECT}" \
    --location=global \
    --workload-identity-pool="${ENV_POOL}" >/dev/null 2>&1; then
  gcloud iam workload-identity-pools providers update-oidc "${ENV_PROVIDER}" \
    --project "${ENV_PROJECT}" \
    --location=global \
    --workload-identity-pool="${ENV_POOL}" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="attribute.repository==\"${GITHUB_OWNER}/${GITHUB_REPO}\""
else
  gcloud iam workload-identity-pools providers create-oidc "${ENV_PROVIDER}" \
    --project "${ENV_PROJECT}" \
    --location=global \
    --workload-identity-pool="${ENV_POOL}" \
    --display-name="GitHub Actions OIDC" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
    --attribute-condition="attribute.repository==\"${GITHUB_OWNER}/${GITHUB_REPO}\""
fi

# Grant the deploy SA permission to mint federated tokens.
gcloud iam service-accounts add-iam-policy-binding "${DEPLOY_SA}" \
  --project "${ENV_PROJECT}" \
  --member="principalSet://iam.googleapis.com/projects/${ENV_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${ENV_POOL}/attribute.repository/${GITHUB_OWNER}/${GITHUB_REPO}" \
  --role="roles/iam.workloadIdentityUser"

# Allow the deploy pipeline to impersonate the runtime account.
gcloud iam service-accounts add-iam-policy-binding "${RUNTIME_SA}" \
  --project "${ENV_PROJECT}" \
  --member="serviceAccount:${DEPLOY_SA}" \
  --role="roles/iam.serviceAccountUser"

# Emit the provider resource ID for reference / environment configuration.
echo "Provider resource: projects/${ENV_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${ENV_POOL}/providers/${ENV_PROVIDER}"

# Give both service accounts read access to the shared Artifact Registry.
COMMON_PROJECT=entrypoint-common
COMMON_REPOSITORY=webapp

for SA in "${DEPLOY_SA}" "${RUNTIME_SA}"
do
  gcloud artifacts repositories add-iam-policy-binding "${COMMON_REPOSITORY}" \
    --project "${COMMON_PROJECT}" \
    --location us-central1 \
    --member="serviceAccount:${SA}" \
    --role="roles/artifactregistry.reader"
done
```

Grant the runtime account additional project-specific permissions (Secrets Manager, Cloud SQL, etc.) as required by the application.

### 2. Configure the GitHub environment for this project

In GitHub → **Settings → Environments**, create or update the environment that will deploy into this project (for example `Dev`, `Staging`, or `Production`):

- **Environment variables**
  - `CLOUD_RUN_SERVICE` = `entrypoint-webapp` (or the actual Cloud Run service name)
  - `CLOUD_RUN_REGION` = `us-central1`
  - `GCP_WORKLOAD_IDENTITY_PROVIDER` = provider string from the Google Cloud setup script
  - `GCP_SERVICE_ACCOUNT` = `github-actions@<env-project>.iam.gserviceaccount.com`

Note that if your GitHub plan supports org-level variables, you can set shared values (for example `CLOUD_RUN_REGION`) at that level to avoid replicating them for each environment.

Add additional vars/secrets as needed for that environment.

---

## Workflow Expectations & Validation

- **Build (`.github/workflows/build-and-publish.yml`)**
  - Uses organization/repository-level variables (`GAR_*`) to authenticate as `github-actions@entrypoint-common` and publishes images to `us-central1-docker.pkg.dev/entrypoint-common/webapp/entrypoint-webapp:${GITHUB_SHA}`.
  - Exposes the image URI via the `image_path` output for downstream workflows.

- **Deploy (`.github/workflows/deploy-to-cloud-run.yml`)**
  - Invoked either automatically (for Dev) or manually (via reusable workflow) with an `image` input.
  - Authenticates using the environment-specific `github-actions@<env-project>` service account and deploys to Cloud Run as `entrypoint-webapp-sa@<env-project>`.
  - On success, calls the shared `deployment-release-notes.yml` reusable workflow to generate notes, upload the Markdown artifact, and update the GitHub deployment status (including environment URL and summary).

### Validation Checklist

1. Manually trigger **Build and Publish to Google Artifact Registry**; confirm a new image revision appears in `entrypoint-common/webapp`.
2. For each runtime environment, rerun the deploy workflow using the emitted image URI; verify Cloud Run pulls successfully.
3. Inspect Artifact Registry IAM (in `entrypoint-common`) to ensure each deploy and runtime service account has `roles/artifactregistry.reader`.
4. Audit GitHub environments to confirm secrets/vars are scoped to the correct environment (no shared credentials across environments).

With this separation, all builds originate from the shared project, while deployments remain restricted to their respective runtime projects.
