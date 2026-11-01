-- Admin audit trail, support and announcements.

CREATE TYPE support_ticket_status AS ENUM ('open', 'waiting', 'closed');

CREATE TABLE admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES users (id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX admin_audit_log_target ON admin_audit_log (target_type, target_id);
CREATE TRIGGER admin_audit_log_append_only BEFORE UPDATE OR DELETE ON admin_audit_log
  FOR EACH ROW EXECUTE FUNCTION forbid_change();
CREATE TRIGGER admin_audit_log_no_truncate BEFORE TRUNCATE ON admin_audit_log
  FOR EACH STATEMENT EXECUTE FUNCTION forbid_change();

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id),
  subject text NOT NULL,
  body text NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_tickets_user ON support_tickets (user_id);
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz,
  created_by uuid REFERENCES users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);
