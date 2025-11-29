# Business Glossary: Pollen Platform

**Purpose**: Canonical mapping of technical terms to business-friendly language for consistent UX across the platform.

**Audience**: Developers, UX designers, content writers, AI assistant prompts

**Last Updated**: 2025-11-11

---

## Core Concepts

| Technical Term | Business-Friendly Term | Context / Usage |
|----------------|------------------------|-----------------|
| Instance | **Data Workspace** or **Data Hub** | User's analytics environment. Use: "Your Data Workspace is ready" |
| Provisioning | **Setting up** or **Creating** | Avoid "provision". Use: "Setting up your workspace..." |
| ETL Pipeline | **Data Flow** or **Data Connection** | Moving data from source to destination. Use: "Create Data Flow", "Active Connections" |
| ETL Job | **Data Update** or **Sync** | Single run of a data flow. Use: "Your sales data synced 5 minutes ago" |
| BI Dashboard | **Insights** or **Analytics** | Business intelligence view. Use: "View Insights", "Your Analytics" |
| DWH (Data Warehouse) | **Data Workspace** or **Analytics Database** | Rarely show to users; prefer "workspace" |
| Schema | **Data Structure** or **Table Layout** | Avoid "schema". Use: "We found these fields in your data" |
| Query | **Question** or **Analysis** | Asking questions of data. Use: "Answer business questions" |
| Connector | **Integration** or **App Connection** | Linking to external service. Use: "Connect Shopify", "Google Sheets integration" |
| Template | **Solution** or **Starter Kit** | Pre-built configuration. Use: "E-commerce Analytics Solution", "Small Business Starter Kit" |

## Status & Progress

| Technical Status | Business-Friendly Message | Usage Context |
|------------------|---------------------------|---------------|
| PENDING | "Setting up your workspace..." | Job waiting to start |
| RUNNING | "Setting up..." or "Connecting to [source]..." | Job in progress |
| IN_PROGRESS | "Almost ready..." or "[X]% complete" | Show progress bar |
| COMPLETED / SUCCESS | "Your workspace is ready!" or "Data connected successfully" | Success state |
| FAILED | "[Resource] needs attention" or "Connection interrupted" | Error state - must include action |
| ACTIVE | "Updating automatically" or "Connected" | Healthy running state |
| SUSPENDED | "Paused" or "Updates paused" | User-initiated pause |
| DELETED | "Removed" or "Archived" | Soft delete |

## Navigation & UI Elements

| Technical Label | Business-Friendly Label | Location |
|-----------------|-------------------------|----------|
| Products | **My Data** | Main nav |
| ETL Pipelines | **Data Flows** | Main nav, page title |
| Instances | **Workspaces** | Breadcrumbs, technical docs only |
| BI Dashboards | **Insights** | Main nav |
| Provisioning Jobs | **Setup Progress** | Job monitoring |
| Audit Log | **Activity History** | Settings |
| Organization Settings | **Team Settings** | Settings nav |

## Error Messages & Troubleshooting

**Pattern**: State the problem in business terms + provide actionable next step

| Technical Error | Business-Friendly Message |
|-----------------|---------------------------|
| `Connection failed: authentication error` | "Your [source] database needs reconnection. Click here to update your password." |
| `ETL job failed: timeout` | "Data update took longer than expected. We'll retry automatically, or you can restart now." |
| `Schema validation error` | "We found unexpected data in 15 rows. You can skip these or adjust your settings." |
| `Provisioning failed: insufficient permissions` | "We need a bit more access to your [provider] account. Here's how to grant it: [steps]" |
| `Rate limit exceeded` | "We're pulling data a bit too quickly. We'll automatically slow down and continue." |

## Data & Metrics

| Technical Metric | Business-Friendly Metric | Example |
|------------------|-------------------------|---------|
| Rows processed | **Records** or **Items** | "5,000 orders processed" |
| Last sync timestamp | **Data freshness** | "Sales data updated 5 minutes ago" |
| Job success rate | **Reliability** | "99% of updates succeed" |
| Query count | **Questions answered** | "Your team asked 50 questions this week" |
| Storage MB | **Data volume** | "Analyzing 10,000 customer records" |
| Latency ms | **Speed** | "Answers ready in seconds" |

## Business Scenarios (Template Names)

| Technical Description | Business-Friendly Template Name |
|-----------------------|---------------------------------|
| DB clone with CDC | **Business Database Sync** |
| CSV/Excel import | **Spreadsheet Import** |
| API ingestion | **Connect Your Apps** |
| Snowflake provisioning | **Cloud Analytics Setup** |
| E-commerce analytics | **Online Store Insights** |
| Financial reporting | **Small Business Finance** |

## Provider & Technical Details

**When to show technical terms**: Only in advanced settings, error logs, API documentation, or when user explicitly requests technical details (e.g., "Show connection string").

**Default behavior**: Hide technical implementation details. Show business outcomes.

| When to Show Technical | Example |
|------------------------|---------|
| Connection details (advanced) | "Host: xyz.snowflakecomputing.com" |
| Error logs (troubleshooting) | "Error code: AUTH_FAILED_403" |
| API documentation | "POST /workspaces/{id}" |
| Power user mode | "Edit raw configuration" |

## AI Assistant Guidelines

The AI assistant MUST:
- ✅ Use business-friendly terms from this glossary
- ✅ Explain technical concepts in business context ("This connects your store to your analytics")
- ✅ Provide actionable next steps, not just error descriptions
- ✅ Ask business-focused questions ("What business questions do you want to answer?")
- ❌ Never use jargon without explanation
- ❌ Never show technical status codes without translation
- ❌ Never assume user has technical background

## Exceptions

**Power User / Advanced Mode**: When user explicitly enables "Advanced Settings" or "Developer Mode", technical terminology is permitted and expected. Clearly label this mode and provide a toggle back to business-friendly UI.

**Support Escalation**: When escalating to human support, attach full technical details (logs, error codes, job IDs) but keep user-facing message business-friendly.

## Version History

- **v1.0** (2025-11-11): Initial glossary based on spec Session 2025-11-11 clarifications
