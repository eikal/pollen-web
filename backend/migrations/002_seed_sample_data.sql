-- Seed data for development / smoke tests

-- Insert a sample organization
INSERT INTO organizations (id, name, domain, config)
VALUES (
  gen_random_uuid(),
  'Example Corp',
  'example.com',
  jsonb_build_object('notes', 'Seed org for local development')
)
ON CONFLICT DO NOTHING;

-- Insert a sample user for the org (lookup org id)
WITH org AS (
  SELECT id FROM organizations WHERE name = 'Example Corp' LIMIT 1
)
INSERT INTO users (org_id, subject, email, display_name, role)
SELECT org.id, 'seed-user', 'dev@example.com', 'Dev User', 'admin' FROM org
ON CONFLICT DO NOTHING;

-- Insert a sample ETL template
WITH org AS (
  SELECT id FROM organizations WHERE name = 'Example Corp' LIMIT 1
)
INSERT INTO etl_templates (org_id, name, description, provider, spec)
SELECT org.id, 'Sample: CSV -> Table', 'Simple CSV load template', 'generic',
  jsonb_build_object(
    'steps', jsonb_build_array(
      jsonb_build_object('type','upload','desc','Upload CSV'),
      jsonb_build_object('type','load','desc','Load into table')
    )
  )
FROM org
ON CONFLICT DO NOTHING;
