# Research: Database Access & UX Polishing

## Decisions

### Excel Multi-Sheet Upload: Single-Sheet per Upload (with repeat uploads allowed)
- **Decision**: Require selecting one sheet per upload. Users can re-upload selecting other sheets to create/update additional tables.
- **Rationale**: Simplifies preview, mapping, and ETL operation selection; reduces accidental table proliferation.
- **Alternatives**:
  - Multi-table from one upload: Increases complexity, risk of errors, and unclear mapping.
  - Auto-detect first sheet: Hides user intent and reduces control.

### Premium CTA: Contact Form (with fallback mailto)
- **Decision**: Use an in-app contact form with fallback `mailto:support@pollen.dev`.
- **Rationale**: Enables structured intake and better triage; fallback ensures compatibility.
- **Alternatives**:
  - Direct scheduling link: Good for demos but not for all requests.
  - Mailto only: Lacks structured data and can fail on some devices.

### Credential Regeneration: Password Reset Only (username stable)
- **Decision**: Allow password reset; keep username stable.
- **Rationale**: Minimizes client reconfiguration; stable identity simplifies auditing; password rotation is sufficient for compromise.
- **Alternatives**:
  - Rotate username/password: Stronger security but higher UX cost and support load.
  - Tokens-only approach: Not aligned with standard SQL client expectations.

## Best Practices & Patterns

- **DB Access UX**: Show copy controls, mask passwords with reveal, sample client commands, search_path guidance.
- **Per-User Schema**: Limit grants to `USAGE` on schema and `SELECT/INSERT/UPDATE/DELETE` on tables within; avoid cross-schema permissions.
- **Excel Handling**: Use ExcelJS to enumerate sheets; validate header row; enforce key column selection for upsert.
- **Upload UX**: Dedicated page; clear primary/secondary actions; confirmations for destructive ops; progressive disclosure for advanced options.
- **Settings Redirect**: Guard via auth middleware; check session before navigation; telemetry on unexpected redirects.
- **Accessibility**: Focus states, ARIA labels for buttons, keyboard navigation on forms.

## References
- Industry UX references for data tools: DBeaver onboarding, Snowflake Worksheets connection docs.
