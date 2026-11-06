-- ร่วมกันทำไม · schema ตาม DESIGN.md §4 (24 ตาราง ERD + 3 ตารางเสริม: notifications, app_settings, reward_deliveries)
-- เงิน = NUMERIC(12,2) · เวลา = TIMESTAMPTZ · ห้าม float
CREATE EXTENSION IF NOT EXISTS pgcrypto;
SET TIME ZONE 'Asia/Bangkok';

-- ---------- ผู้ใช้ ----------
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE,                       -- U01..U14 (seed)
  email           text NOT NULL UNIQUE,
  password_hash   text NOT NULL,                     -- crypt(bf)
  role            text NOT NULL CHECK (role IN ('starter','helper','voucher','staff','finance','exec')),
  display_name    text NOT NULL,
  consent_show_name boolean NOT NULL DEFAULT false,  -- BR-25
  address_enc     bytea,                             -- pgp_sym_encrypt (NFR-05)
  province        text,
  home_lat        double precision,                  -- แทน geography (ไม่ใช้ PostGIS)
  home_lng        double precision,
  household_id    text,                              -- BR-14
  skills          text[] NOT NULL DEFAULT '{}',      -- FR-34
  line_linked     boolean NOT NULL DEFAULT false,    -- FR-45
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kyc_records (
  user_id        uuid PRIMARY KEY REFERENCES users(id),
  id_card_enc    bytea NOT NULL,                     -- เข้ารหัส
  id_card_last4  text,
  face_verified  boolean NOT NULL DEFAULT false,
  assisted_by    text,                               -- FR-67 จุดบริการ/ผู้รับรองช่วยกดเครื่อง
  verified_at    timestamptz
);

-- ---------- โครงการ ----------
CREATE TABLE projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE,                       -- P01..
  starter_id      uuid NOT NULL REFERENCES users(id),
  title           text NOT NULL,
  status          text NOT NULL CHECK (status IN ('pending','active','suspended','closed','rejected')),
  funding_mode    text NOT NULL CHECK (funding_mode IN ('all_or_nothing','flexible')),
  target_amount   numeric(12,2) NOT NULL CHECK (target_amount BETWEEN 1000 AND 500000),   -- BR-01, BR-02
  duration_hours  integer NOT NULL CHECK (duration_hours IN (360,720,72)),                -- BR-03
  urgent          boolean NOT NULL DEFAULT false,    -- เคสด่วน 72 ชม.
  submitted_at    timestamptz,
  activated_at    timestamptz,
  ends_at         timestamptz,
  resubmit_count  integer NOT NULL DEFAULT 0 CHECK (resubmit_count BETWEEN 0 AND 2),      -- BR-18
  frozen          boolean NOT NULL DEFAULT false,    -- FR-56
  reject_reason   text,
  suspend_reason  text,
  required_vouchers integer NOT NULL DEFAULT 2,      -- FR-53 / BR-12
  fundraising_state text NOT NULL DEFAULT 'open' CHECK (fundraising_state IN ('open','ended')),
  outcome         text CHECK (outcome IN ('success','failed')),
  closed_at       timestamptz,
  -- เรื่องเล่า FR-09..13
  story_what      text,
  story_where     text,
  story_need      text,
  story_evidence_url text,
  voice_url       text,
  video_url       text,
  transcript      text,                              -- ถอดเสียงด้วยกฎตายตัว (NFR-16)
  area_province   text,
  lat             double precision,
  lng             double precision,
  -- ข้อมูลอ่อนไหว (BR-30): ห้ามออกหน้าสาธารณะ
  medical_enc     bytea,
  address_detail_enc bytea,
  -- ปิดโครงการ FR-22 / BR-29
  closing_before_url text,
  closing_after_url  text,
  thanks_video_url   text,
  signature_goal  integer,                           -- FR-18 เป้ารายชื่อ
  drone_wanted    boolean NOT NULL DEFAULT false,
  review_overdue_notified boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON projects(status);
CREATE INDEX ON projects(starter_id);

CREATE TABLE project_support_types (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('money','item','labor','loan','advocacy')),
  PRIMARY KEY (project_id, type)
);

CREATE TABLE project_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          text NOT NULL,
  qty_needed    integer NOT NULL CHECK (qty_needed > 0),
  qty_reserved  integer NOT NULL DEFAULT 0 CHECK (qty_reserved >= 0),
  CONSTRAINT items_reserved_le_needed CHECK (qty_reserved <= qty_needed)               -- BR-26, NFR-12
);

CREATE TABLE skill_needs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  skill      text NOT NULL,
  headcount  integer NOT NULL CHECK (headcount > 0),
  work_date  timestamptz NOT NULL
);

CREATE TABLE loan_requests (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_name  text NOT NULL,
  days       integer NOT NULL CHECK (days > 0)
);

CREATE TABLE loans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_request_id uuid NOT NULL REFERENCES loan_requests(id) ON DELETE CASCADE,
  lender_id       uuid NOT NULL REFERENCES users(id),
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','returned','overdue')),
  start_date      date NOT NULL,
  due_date        date NOT NULL,
  returned_at     timestamptz
);

CREATE TABLE reward_tiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tier        integer NOT NULL CHECK (tier BETWEEN 1 AND 3),
  min_amount  numeric(12,2) NOT NULL,
  description text NOT NULL,
  UNIQUE (project_id, tier)
);

CREATE TABLE milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seq         integer NOT NULL CHECK (seq >= 1),
  percent     numeric(5,2) NOT NULL CHECK (percent > 0 AND percent <= 100),
  amount      numeric(12,2) NOT NULL CHECK (amount > 0),
  status      text NOT NULL DEFAULT 'locked' CHECK (status IN ('locked','requested','approved','paid')),
  requested_at timestamptz,
  approved_at  timestamptz,
  UNIQUE (project_id, seq)
);

-- BR-09 (งวดแรก ≤ 40% เมื่อแผนมี ≥ 2 งวด) ตรวจใน lib/rules/milestones.ts เพราะต้องดูทั้งแผน (CHECK ข้ามแถวไม่ได้)
-- โครงการ Flexible เบิกตามยอดสะสม (BR-08) สร้างแถวงวดตอนขอเบิก

CREATE TABLE milestone_evidence (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  kind         text NOT NULL CHECK (kind IN ('receipt','photo')),
  file_url     text NOT NULL,
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disbursements (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES milestones(id),
  amount       numeric(12,2) NOT NULL CHECK (amount > 0),
  payee_type   text NOT NULL CHECK (payee_type IN ('starter','merchant')),
  merchant_name text,
  paid_at      timestamptz NOT NULL
);

CREATE TABLE vouchings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  voucher_id  uuid NOT NULL REFERENCES users(id),
  distance_km numeric(5,2) NOT NULL,
  status      text NOT NULL CHECK (status IN ('taken','submitted','released')),
  taken_at    timestamptz NOT NULL,
  submitted_at timestamptz,
  photo_url   text,
  note        text
);
CREATE UNIQUE INDEX vouchings_active_uq ON vouchings(project_id, voucher_id) WHERE status IN ('taken','submitted');

CREATE TABLE reviews (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  staff_id   uuid REFERENCES users(id),
  decision   text NOT NULL CHECK (decision IN ('approve','reject')),
  reason     text,
  decided_at timestamptz NOT NULL
);

-- ---------- เงิน ----------
CREATE TABLE donations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects(id),
  donor_id       uuid REFERENCES users(id),          -- NULL = ข้อมูลรวมย้อนหลัง/ไม่ประสงค์ออกนาม
  amount         numeric(12,2) NOT NULL CHECK (amount >= 0),
  tip            numeric(12,2) NOT NULL DEFAULT 0 CHECK (tip >= 0),
  gateway_fee    numeric(12,2) NOT NULL DEFAULT 0 CHECK (gateway_fee >= 0),
  method         text NOT NULL DEFAULT 'promptpay' CHECK (method IN ('promptpay','card','mobile')),
  to_central_fund boolean NOT NULL DEFAULT false,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded','expired')),
  refund_choice  text NOT NULL DEFAULT 'none' CHECK (refund_choice IN ('refund','central','none')),
  refund_chosen_at timestamptz,
  excess_refunded numeric(12,2) NOT NULL DEFAULT 0,  -- DA-03
  payment_ref    text UNIQUE,
  qr_expires_at  timestamptz,
  created_at     timestamptz NOT NULL,
  paid_at        timestamptz,
  note           text
);
CREATE INDEX ON donations(project_id, status);
CREATE INDEX ON donations(donor_id);

CREATE TABLE receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id   uuid NOT NULL UNIQUE REFERENCES donations(id),
  receipt_no    text NOT NULL UNIQUE,
  edonation_sent boolean NOT NULL DEFAULT false,
  issued_at     timestamptz NOT NULL
);

CREATE TABLE item_pledges (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    uuid NOT NULL REFERENCES project_items(id),
  donor_id   uuid NOT NULL REFERENCES users(id),
  qty        integer NOT NULL CHECK (qty > 0),
  tracking_no text NOT NULL,
  received   boolean NOT NULL DEFAULT false,         -- A-11 ต้นเรื่องยืนยันรับของ
  created_at timestamptz NOT NULL
);

CREATE TABLE volunteer_signups (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id   uuid NOT NULL REFERENCES skill_needs(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL,
  UNIQUE (need_id, user_id)
);

CREATE TABLE checkins (
  signup_id uuid PRIMARY KEY REFERENCES volunteer_signups(id) ON DELETE CASCADE,
  at        timestamptz NOT NULL,
  hours     numeric(5,2)                             -- BR-36
);

CREATE TABLE signatures (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id),
  signed_at  timestamptz NOT NULL,
  UNIQUE (project_id, user_id)                       -- BR-27
);

CREATE TABLE flags (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reporter_id  uuid NOT NULL REFERENCES users(id),
  evidence_url text NOT NULL,
  reason       text,
  created_at   timestamptz NOT NULL
);

-- ---------- บัญชี ----------
-- wallets.project_id = NULL สำหรับบัญชีพิเศษ: kind = central (กองทุนกลาง) / admin_fee (ค่าบริหารมูลนิธิ รับทิป)
CREATE TABLE wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid UNIQUE REFERENCES projects(id),
  kind       text NOT NULL DEFAULT 'project' CHECK (kind IN ('project','central','admin_fee')),
  balance    numeric(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),     -- BR-34
  CHECK ((kind = 'project' AND project_id IS NOT NULL) OR (kind <> 'project' AND project_id IS NULL))
);
CREATE UNIQUE INDEX wallets_special_uq ON wallets(kind) WHERE kind <> 'project';

CREATE TABLE ledger_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       uuid NOT NULL REFERENCES wallets(id),
  kind            text NOT NULL CHECK (kind IN ('in','out','fee')),
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  donation_id     uuid REFERENCES donations(id),
  disbursement_id uuid REFERENCES disbursements(id),
  memo            text,
  payee_name      text,
  at              timestamptz NOT NULL
);
CREATE INDEX ON ledger_entries(wallet_id);

-- ledger เพิ่มอย่างเดียว (FR-58, NFR-07)
CREATE FUNCTION ledger_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entries เพิ่มอย่างเดียว ห้ามแก้หรือลบ' USING ERRCODE = '23514';
END $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_ledger_no_update BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION ledger_append_only();

CREATE TABLE audit_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   uuid REFERENCES users(id),
  action     text NOT NULL,                          -- approve reject release freeze unfreeze pay close ...
  project_id uuid REFERENCES projects(id),
  detail     text,
  at         timestamptz NOT NULL
);

-- ---------- ตารางเสริม ----------
CREATE TABLE notifications (          -- LINE จำลอง (FR-45, 46, NFR-04)
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id),
  channel    text NOT NULL DEFAULT 'line' CHECK (channel IN ('line','receipt','system')),
  kind       text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL,
  project_id uuid REFERENCES projects(id),
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);
CREATE INDEX ON notifications(user_id, created_at DESC);

CREATE TABLE app_settings (           -- นาฬิการะบบ (NFR-18)
  key   text PRIMARY KEY,
  value text NOT NULL
);

CREATE TABLE reward_deliveries (      -- BR-33 สิ่งตอบแทนที่ต้องส่ง
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id),
  donor_id   uuid REFERENCES users(id),
  tier       integer NOT NULL CHECK (tier BETWEEN 1 AND 3),
  description text NOT NULL,
  status     text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','delivered')),
  delivered_at timestamptz,
  foundation_notified_at timestamptz
);
