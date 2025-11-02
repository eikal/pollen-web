# T004 - Onboarding wizard (frontend)

**Estimate:** 3d
**Owner:** @frontend
**Labels:** frontend, ux, onboarding

## Summary
Create a step-by-step onboarding wizard where an org admin picks a DWH provider, follows instructions to grant provisioning permissions, configures ETL templates, and starts a provisioning job.

## Acceptance criteria
- Onboarding wizard pages exist: provider selection, permission instructions, credential entry, review & submit.
- Submitting the wizard calls the backend API and creates a `ProvisioningJob` record.
- Validation and friendly errors are displayed for common misconfigurations.

## Checklist
- [ ] Implement provider selection UI
- [ ] Implement permission instruction pages per provider
- [ ] Implement credential input form and validation
- [ ] Wire submit to backend API and handle job creation response
- [ ] Add UI tests for happy path and an error path

## Notes
- Keep steps minimal and provide copyable console commands for creating roles/service accounts.
