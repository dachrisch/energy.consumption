# Release Automation History

This document tracks the evolution of the release process for the Energy Consumption project.

## 2026-05-17: Transition to Automated Patch Releases

### Context
Previously, the project used `standard-version` for manual releases. This required developer intervention to bump versions, update the changelog, and push tags.

### The Solution: "Zero-Touch" Releases
We implemented a fully automated pipeline where changes (including dependency updates) trigger a cascading release process.

#### 1. Release-Please with Elevated Permissions
- **Change**: Configured `release-please-action` to use a Personal Access Token (`RELEASE_PLEASE_TOKEN`) instead of the default `GITHUB_TOKEN`.
- **Reason**: Actions triggered by `GITHUB_TOKEN` cannot trigger other workflows. Using a PAT allows the creation of the Release PR to trigger the auto-merge workflow.

#### 2. Automated Release PR Merging
- **Change**: Created `.github/workflows/release-please-automerge.yaml`.
- **Technical Detail**: 
    - Uses `pull_request_target` to ensure the workflow runs from the `main` branch context (ensuring security and access to secrets).
    - Automatically executes `gh pr merge --auto --merge` when the `autorelease: pending` label is detected.
- **Result**: When changes are merged to `main`, a Release PR is opened and immediately merged by the bot, triggering the final tag and potential deployment.

### Summary of Workflow
`Commit (feat/fix)` -> `Release-Please (Open PR)` -> `Automerge Workflow (Merge PR)` -> `Release-Please (Create Tag/Release)` -> `CI (Deploy)`
