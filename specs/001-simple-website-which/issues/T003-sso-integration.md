# T003 - Authentication: SSO / OIDC integration

**Estimate:** 3d
**Owner:** @auth
**Labels:** auth, backend, frontend

## Summary
Implement OIDC/OAuth SSO flows for at least one identity provider (Azure AD or Google) and enforce organization-level RBAC for provisioning APIs.

## Acceptance criteria
- Local dev stub IdP or test IdP can be used to exercise login.
- Provisioning APIs return 403 for non-admin users and allow admin users.
- Automated test for login + RBAC.

## Checklist
- [ ] Add configuration schema for OIDC provider (client id, secret, redirect URIs)
- [ ] Implement backend OIDC callback and session/JWT issuance
- [ ] Implement frontend login flow and redirect handling
- [ ] Implement RBAC middleware for provisioning endpoints
- [ ] Add e2e test for login and provisioning access control

## Notes
- Consider using `openid-client` (node) and NextAuth.js or a lightweight custom flow for integration with the frontend.
