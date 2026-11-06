-- ร่วมกันทำไม · seed ตาม TEST-DATA.md (วันนี้ = 2026-11-06 10:00 +07:00)
-- ใช้ซ้ำโดย POST /api/test/reset (ไฟล์สำเนาที่ web/seed/02-seed.sql สร้างด้วย scripts/sync-seed.mjs)
-- คีย์เข้ารหัสทดสอบ = 'ruamkan-dev-key' (ตรงกับ DATA_KEY ค่าเริ่มต้นของ web)
SET TIME ZONE 'Asia/Bangkok';

INSERT INTO app_settings(key, value) VALUES ('fixed_now', '2026-11-06T10:00:00+07:00');

-- ---------- ผู้ใช้ 14 บัญชี · รหัสผ่านทุกบัญชี Test@1234 ----------
-- พิกัด: โครงการ P04 อยู่ที่ (14.0, 100.0) ผู้รับรองอยู่บนเส้นเมริเดียนเดียวกัน ระยะ = Δlat × 111.194927 กม.
INSERT INTO users (id, code, email, password_hash, role, display_name, consent_show_name, address_enc, province, home_lat, home_lng, household_id, skills, line_linked) VALUES
('a0000000-0000-4000-8000-000000000001','U01','somsri@test.local', crypt('Test@1234', gen_salt('bf',6)),'starter','สมศรี ใจดี',true, pgp_sym_encrypt('99/1 หมู่ 3 ต.หนองแสง', 'ruamkan-dev-key'),'นครราชสีมา',15.0,101.0,'HH-U01','{}',true),
('a0000000-0000-4000-8000-000000000002','U02','boonma@test.local', crypt('Test@1234', gen_salt('bf',6)),'starter','ลุงบุญมา',true, pgp_sym_encrypt('12 หมู่ 1 ต.โนนสูง', 'ruamkan-dev-key'),'นครราชสีมา',14.5,101.5,'HH-U02','{}',false),
('a0000000-0000-4000-8000-000000000003','U03','noi@test.local', crypt('Test@1234', gen_salt('bf',6)),'starter','ป้าน้อย (ตัวแทนชุมชน)',true, pgp_sym_encrypt('7 หมู่ 5 ต.ศาลา', 'ruamkan-dev-key'),'ขอนแก่น',16.4,102.8,'HH-U03','{}',false),
('a0000000-0000-4000-8000-000000000004','U04','may@test.local', crypt('Test@1234', gen_salt('bf',6)),'helper','คุณเมย์',true, pgp_sym_encrypt('88 ถ.สุขุมวิท', 'ruamkan-dev-key'),'กรุงเทพฯ',13.75,100.5,'HH-U04','{}',true),
('a0000000-0000-4000-8000-000000000005','U05','ton@test.local', crypt('Test@1234', gen_salt('bf',6)),'helper','คุณต้น',false, pgp_sym_encrypt('45 ถ.พหลโยธิน', 'ruamkan-dev-key'),'กรุงเทพฯ',13.8,100.55,'HH-U05','{}',false),
('a0000000-0000-4000-8000-000000000006','U06','wichai@test.local', crypt('Test@1234', gen_salt('bf',6)),'helper','ช่างวิชัย',true, pgp_sym_encrypt('21 หมู่ 2 ต.บ้านใหม่', 'ruamkan-dev-key'),'นครราชสีมา',15.1,101.1,'HH-U06','{ช่างไฟ}',true),
('a0000000-0000-4000-8000-000000000007','U07','thong@test.local', crypt('Test@1234', gen_salt('bf',6)),'voucher','ผู้ใหญ่บ้านทอง',true, pgp_sym_encrypt('1 หมู่ 4', 'ruamkan-dev-key'),'สระบุรี',14.0 + 4.90/111.194926645,100.0,'HH-U07','{}',false),
('a0000000-0000-4000-8000-000000000008','U08','kaew@test.local', crypt('Test@1234', gen_salt('bf',6)),'voucher','ครูแก้ว',true, pgp_sym_encrypt('2 หมู่ 4', 'ruamkan-dev-key'),'สระบุรี',14.0 + 5.00/111.194926645,100.0,'HH-U08','{}',false),
('a0000000-0000-4000-8000-000000000009','U09','nid@test.local', crypt('Test@1234', gen_salt('bf',6)),'voucher','อสม.นิด',true, pgp_sym_encrypt('3 หมู่ 4', 'ruamkan-dev-key'),'สระบุรี',14.0 + 5.10/111.194926645,100.0,'HH-U09','{}',false),
('a0000000-0000-4000-8000-000000000010','U10','yai@test.local', crypt('Test@1234', gen_salt('bf',6)),'voucher','ป้ายาย (ญาติสมศรี)',true, pgp_sym_encrypt('99/2 หมู่ 3 ต.หนองแสง', 'ruamkan-dev-key'),'นครราชสีมา',15.0 + 1.00/111.194926645,101.0,'HH-U01','{}',false),
('a0000000-0000-4000-8000-000000000011','U11','staff@test.local', crypt('Test@1234', gen_salt('bf',6)),'staff','เจ้าหน้าที่ปอ',true, NULL,'กรุงเทพฯ',13.7,100.5,'HH-U11','{}',false),
('a0000000-0000-4000-8000-000000000012','U12','wipa@test.local', crypt('Test@1234', gen_salt('bf',6)),'finance','คุณวิภา',true, NULL,'กรุงเทพฯ',13.7,100.5,'HH-U12','{}',false),
('a0000000-0000-4000-8000-000000000013','U13','somchai@test.local', crypt('Test@1234', gen_salt('bf',6)),'exec','คุณสมชาย',true, NULL,'กรุงเทพฯ',13.7,100.5,'HH-U13','{}',false),
('a0000000-0000-4000-8000-000000000014','U14','tester@test.local', crypt('Test@1234', gen_salt('bf',6)),'helper','ผู้บริจาคทั่วไป',false, pgp_sym_encrypt('5 ถ.ราชดำเนิน', 'ruamkan-dev-key'),'กรุงเทพฯ',13.75,100.5,'HH-U14','{}',false);

-- KYC: U01, U03 ผ่าน · U02 ยังไม่ผ่าน (ไม่มีแถว)
INSERT INTO kyc_records (user_id, id_card_enc, id_card_last4, face_verified, verified_at) VALUES
('a0000000-0000-4000-8000-000000000001', pgp_sym_encrypt('1100100123456', 'ruamkan-dev-key'), '3456', true, '2026-10-01 09:00+07'),
('a0000000-0000-4000-8000-000000000003', pgp_sym_encrypt('1100100654321', 'ruamkan-dev-key'), '4321', true, '2026-09-20 09:00+07');

-- ---------- โครงการ P01–P08, P10 ----------
INSERT INTO projects (id, code, starter_id, title, status, funding_mode, target_amount, duration_hours, urgent, submitted_at, activated_at, ends_at, resubmit_count, frozen, fundraising_state, outcome, closed_at, story_what, story_where, story_need, area_province, lat, lng, medical_enc, address_detail_enc, signature_goal, drone_wanted, suspend_reason, reject_reason) VALUES
('b0000000-0000-4000-8000-000000000001','P01','a0000000-0000-4000-8000-000000000001','ฝายกั้นน้ำบ้านหนองแสง','active','all_or_nothing',50000,720,false,'2026-10-15 09:00+07','2026-10-20 10:00+07','2026-11-19 10:00+07',0,false,'open',NULL,NULL,
  'ฝายเก่าพังจากน้ำหลาก ชาวบ้านไม่มีน้ำทำนา','บ้านหนองแสง หมู่ 3 จังหวัดนครราชสีมา','ต้องการเงิน วัสดุมุงหลังคาศาลา และช่างไฟ','นครราชสีมา',15.0,101.0,NULL,pgp_sym_encrypt('99/1 หมู่ 3 ต.หนองแสง','ruamkan-dev-key'),1000,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000002','P02','a0000000-0000-4000-8000-000000000003','ผ่าตัดด่วนคุณยายจันทร์','active','all_or_nothing',30000,72,true,'2026-11-03 18:00+07','2026-11-04 10:00+07','2026-11-07 10:00+07',0,false,'open',NULL,NULL,
  'คุณยายจันทร์ต้องผ่าตัดด่วน ค่าใช้จ่ายสูง','ต.ศาลา จังหวัดขอนแก่น','ต้องการค่าผ่าตัดภายใน 3 วัน','ขอนแก่น',16.4,102.8,pgp_sym_encrypt('ประวัติรักษา: ผ่าตัดไส้เลื่อน','ruamkan-dev-key'),pgp_sym_encrypt('7 หมู่ 5 ต.ศาลา','ruamkan-dev-key'),NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000003','P03','a0000000-0000-4000-8000-000000000001','ค่าอาหารสัตว์จรจัด','active','flexible',20000,360,false,'2026-10-22 09:00+07','2026-10-25 10:00+07','2026-11-09 10:00+07',0,false,'open',NULL,NULL,
  'สัตว์จรจัดในชุมชนขาดอาหาร','ชุมชนหนองแสง นครราชสีมา','ต้องการเงินค่าอาหารเป็นงวด ๆ','นครราชสีมา',15.02,101.02,NULL,NULL,NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000004','P04','a0000000-0000-4000-8000-000000000002','ซ่อมบ้านลุงสม','pending','all_or_nothing',20001,720,false,'2026-11-03 09:00+07',NULL,NULL,0,false,'open',NULL,NULL,
  'หลังคาบ้านลุงสมรั่วหนักหลังพายุ','บ้านลุงสม จังหวัดสระบุรี','ต้องการเงินซ่อมหลังคา','สระบุรี',14.0,100.0,NULL,pgp_sym_encrypt('55 หมู่ 4 ต.หนองโดน','ruamkan-dev-key'),NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000005','P05','a0000000-0000-4000-8000-000000000003','ซ่อมศาลาชุมชน','rejected','all_or_nothing',15000,720,false,'2026-10-20 09:00+07',NULL,NULL,2,false,'open',NULL,NULL,
  'ศาลากลางชุมชนผุพัง','ต.ศาลา จังหวัดขอนแก่น','ต้องการเงินซ่อมศาลา','ขอนแก่น',16.41,102.81,NULL,NULL,NULL,false,NULL,'เอกสารประกอบไม่ครบ (ส่งใหม่ครบ 2 ครั้งแล้ว)'),
('b0000000-0000-4000-8000-000000000006','P06','a0000000-0000-4000-8000-000000000001','ห้องสมุดชุมชน','closed','all_or_nothing',40000,720,false,'2026-09-25 09:00+07','2026-09-30 10:00+07','2026-10-30 10:00+07',0,false,'ended','failed','2026-10-30 10:00+07',
  'อยากมีห้องสมุดให้เด็กในชุมชน','ชุมชนหนองแสง นครราชสีมา','ต้องการเงินสร้างห้องสมุด','นครราชสีมา',15.03,101.03,NULL,NULL,NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000007','P07','a0000000-0000-4000-8000-000000000003','สะพานไม้หมู่ 5','active','all_or_nothing',30000,720,false,'2026-10-10 09:00+07','2026-10-15 10:00+07','2026-11-14 10:00+07',0,false,'open',NULL,NULL,
  'สะพานไม้ข้ามคลองผุ ชาวบ้านใช้ข้ามไม่ปลอดภัย','หมู่ 5 จังหวัดขอนแก่น','ต้องการเงินสร้างสะพานใหม่','ขอนแก่น',16.42,102.82,NULL,NULL,NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000008','P08','a0000000-0000-4000-8000-000000000001','ซ่อมหลังคาศูนย์เด็กเล็ก','closed','flexible',25000,720,false,'2026-08-01 09:00+07','2026-08-08 10:00+07','2026-09-07 10:00+07',0,false,'ended','success','2026-09-07 10:00+07',
  'หลังคาศูนย์เด็กเล็กรั่ว','ศูนย์เด็กเล็ก ต.หนองแสง','ต้องการเงินซ่อมหลังคา','นครราชสีมา',15.04,101.04,NULL,NULL,NULL,false,NULL,NULL),
('b0000000-0000-4000-8000-000000000010','P10','a0000000-0000-4000-8000-000000000003','ซ่อมรั้วโรงเรียน (ด่วน)','pending','all_or_nothing',10000,72,true,'2026-11-05 10:00+07',NULL,NULL,0,false,'open',NULL,NULL,
  'รั้วโรงเรียนพังหลังพายุ เด็กไม่ปลอดภัย','โรงเรียนบ้านศาลา ขอนแก่น','ต้องการเงินซ่อมรั้วด่วน','ขอนแก่น',16.43,102.83,NULL,NULL,NULL,false,NULL,NULL);

INSERT INTO project_support_types (project_id, type) VALUES
('b0000000-0000-4000-8000-000000000001','money'),('b0000000-0000-4000-8000-000000000001','item'),('b0000000-0000-4000-8000-000000000001','labor'),('b0000000-0000-4000-8000-000000000001','advocacy'),
('b0000000-0000-4000-8000-000000000002','money'),
('b0000000-0000-4000-8000-000000000003','money'),
('b0000000-0000-4000-8000-000000000004','money'),
('b0000000-0000-4000-8000-000000000005','money'),
('b0000000-0000-4000-8000-000000000006','money'),
('b0000000-0000-4000-8000-000000000007','money'),
('b0000000-0000-4000-8000-000000000008','money'),
('b0000000-0000-4000-8000-000000000010','money');

-- P01: สิ่งของ · ทักษะ · ผู้สนับสนุน · สิ่งตอบแทน
INSERT INTO project_items (id, project_id, name, qty_needed, qty_reserved) VALUES
('c0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','กระเบื้องมุงหลังคา',50,49),
('c0000000-0000-4000-8000-000000000002','b0000000-0000-4000-8000-000000000001','ปูน',20,0);
INSERT INTO skill_needs (id, project_id, skill, headcount, work_date) VALUES
('d0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','ช่างไฟ',2,'2026-11-21 09:00+07');
INSERT INTO volunteer_signups (id, need_id, user_id, created_at) VALUES
('d1000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000006','2026-11-01 10:00+07');
INSERT INTO reward_tiers (project_id, tier, min_amount, description) VALUES
('b0000000-0000-4000-8000-000000000001',1,50,'การ์ดขอบคุณจากชุมชน'),
('b0000000-0000-4000-8000-000000000001',2,500,'คลิปความคืบหน้าของโครงการ'),
('b0000000-0000-4000-8000-000000000001',3,2000,'ผลผลิตชุมชนส่งถึงบ้าน'),
('b0000000-0000-4000-8000-000000000008',1,50,'การ์ดขอบคุณจากศูนย์เด็กเล็ก'),
('b0000000-0000-4000-8000-000000000008',2,500,'คลิปความคืบหน้า'),
('b0000000-0000-4000-8000-000000000008',3,2000,'ผลิตผลชุมชน');

-- แผนงวด: โครงการเป้า > 20,000 ต้อง ≥ 2 งวด (BR-10)
INSERT INTO milestones (id, project_id, seq, percent, amount, status, requested_at) VALUES
('e0000000-0000-4000-8000-000000000011','b0000000-0000-4000-8000-000000000001',1,40,20000,'locked',NULL),
('e0000000-0000-4000-8000-000000000012','b0000000-0000-4000-8000-000000000001',2,60,30000,'locked',NULL),
('e0000000-0000-4000-8000-000000000021','b0000000-0000-4000-8000-000000000002',1,40,12000,'locked',NULL),
('e0000000-0000-4000-8000-000000000022','b0000000-0000-4000-8000-000000000002',2,60,18000,'locked',NULL),
('e0000000-0000-4000-8000-000000000071','b0000000-0000-4000-8000-000000000007',1,40,12000,'requested','2026-11-05 14:00+07'),
('e0000000-0000-4000-8000-000000000072','b0000000-0000-4000-8000-000000000007',2,60,18000,'locked',NULL),
('e0000000-0000-4000-8000-000000000041','b0000000-0000-4000-8000-000000000004',1,50,10000.50,'locked',NULL),
('e0000000-0000-4000-8000-000000000042','b0000000-0000-4000-8000-000000000004',2,50,10000.50,'locked',NULL);
-- P07 งวด 1 มีใบเสร็จ + รูป แต่ยังไม่อนุมัติ (E41)
INSERT INTO milestone_evidence (milestone_id, kind, file_url, uploaded_at) VALUES
('e0000000-0000-4000-8000-000000000071','receipt','/img/seed-receipt.svg','2026-11-05 14:00+07'),
('e0000000-0000-4000-8000-000000000071','photo','/img/seed-photo.svg','2026-11-05 14:00+07');

-- ผู้รับรอง P04 (BR-12..15)
INSERT INTO vouchings (project_id, voucher_id, distance_km, status, taken_at, submitted_at, photo_url, note) VALUES
('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000007',4.90,'submitted','2026-11-03 10:00+07','2026-11-03 15:00+07','/img/seed-photo.svg','บ้านเสียหายจริง'),
('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000008',5.00,'taken','2026-11-03 10:00+07',NULL,NULL,NULL);

-- ---------- บริจาค (paid) · ค่าธรรมเนียม 2.5% ปัดครึ่งขึ้น ----------
-- P01: U04 1,000 · U05 500 · รวม 36 ราย 36,500 (35×1,000 + 1×1,500) = 38,000
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note) VALUES
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000004',1000,0,25.00,'promptpay','paid','2026-10-21 10:00+07','2026-10-21 10:01+07','SEED-P01-U04',NULL),
('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000005',500,0,12.50,'promptpay','paid','2026-10-22 10:00+07','2026-10-22 10:01+07','SEED-P01-U05',NULL);
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note)
SELECT 'b0000000-0000-4000-8000-000000000001', NULL, CASE WHEN g = 36 THEN 1500 ELSE 1000 END, 0, CASE WHEN g = 36 THEN 37.50 ELSE 25.00 END, 'promptpay', 'paid',
       '2026-10-25 10:00+07'::timestamptz + (g || ' hours')::interval, '2026-10-25 10:01+07'::timestamptz + (g || ' hours')::interval, 'SEED-P01-AGG-' || g, 'ผู้บริจาครวม 36 ราย (ข้อมูลรวม)'
FROM generate_series(1,36) g;
-- P02: 35,970 (35×1,000 + 970) ค่าธรรมเนียม 899.25
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note)
SELECT 'b0000000-0000-4000-8000-000000000002', NULL, CASE WHEN g = 36 THEN 970 ELSE 1000 END, 0, CASE WHEN g = 36 THEN 24.25 ELSE 25.00 END, 'promptpay', 'paid',
       '2026-11-04 11:00+07'::timestamptz + (g || ' minutes')::interval, '2026-11-04 11:01+07'::timestamptz + (g || ' minutes')::interval, 'SEED-P02-' || g, 'ข้อมูลรวม'
FROM generate_series(1,36) g;
-- P03: 9,999 ค่าธรรมเนียม 249.98
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note) VALUES
('b0000000-0000-4000-8000-000000000003', NULL, 9999, 0, 249.98, 'promptpay','paid','2026-10-30 10:00+07','2026-10-30 10:01+07','SEED-P03-1','ข้อมูลรวม');
-- P06: U04 10,000 · U05 15,000 (ยังไม่มีใครเลือกคืน/กองทุนกลาง)
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref) VALUES
('b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000004',10000,0,250.00,'promptpay','paid','2026-10-05 10:00+07','2026-10-05 10:01+07','SEED-P06-U04'),
('b0000000-0000-4000-8000-000000000006','a0000000-0000-4000-8000-000000000005',15000,0,375.00,'promptpay','paid','2026-10-06 10:00+07','2026-10-06 10:01+07','SEED-P06-U05');
-- P07: 30,000 (30×1,000) ค่าธรรมเนียม 750
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note)
SELECT 'b0000000-0000-4000-8000-000000000007', NULL, 1000, 0, 25.00, 'promptpay', 'paid',
       '2026-10-20 10:00+07'::timestamptz + (g || ' hours')::interval, '2026-10-20 10:01+07'::timestamptz + (g || ' hours')::interval, 'SEED-P07-' || g, 'ข้อมูลรวม'
FROM generate_series(1,30) g;
-- P08: 25,000 (25×1,000) ค่าธรรมเนียม 625
INSERT INTO donations (project_id, donor_id, amount, tip, gateway_fee, method, status, created_at, paid_at, payment_ref, note)
SELECT 'b0000000-0000-4000-8000-000000000008', NULL, 1000, 0, 25.00, 'promptpay', 'paid',
       '2026-08-10 10:00+07'::timestamptz + (g || ' hours')::interval, '2026-08-10 10:01+07'::timestamptz + (g || ' hours')::interval, 'SEED-P08-' || g, 'ข้อมูลรวม'
FROM generate_series(1,25) g;

-- ใบเสร็จของรายการที่จ่ายแล้วทั้งหมด (ธรรมดา ไม่มี e-Donation)
INSERT INTO receipts (donation_id, receipt_no, edonation_sent, issued_at)
SELECT id, 'RC-SEED-' || lpad(row_number() OVER (ORDER BY paid_at, payment_ref)::text, 5, '0'), false, paid_at
FROM donations WHERE status = 'paid';

-- ---------- wallet + ledger (A-25: in = ยอดบริจาคเต็ม · fee แยกรายการ) ----------
INSERT INTO wallets (project_id, kind, balance)
SELECT id, 'project', 0 FROM projects WHERE code IN ('P01','P02','P03','P04','P05','P06','P07','P08','P10');
INSERT INTO wallets (project_id, kind, balance) VALUES (NULL,'central',0),(NULL,'admin_fee',0);

INSERT INTO ledger_entries (wallet_id, kind, amount, donation_id, memo, at)
SELECT w.id, 'in', d.amount, d.id, 'บริจาค', d.paid_at FROM donations d JOIN wallets w ON w.project_id = d.project_id WHERE d.status = 'paid';
INSERT INTO ledger_entries (wallet_id, kind, amount, donation_id, memo, at)
SELECT w.id, 'fee', d.gateway_fee, d.id, 'ค่าธรรมเนียมผู้ให้บริการชำระเงิน', d.paid_at FROM donations d JOIN wallets w ON w.project_id = d.project_id WHERE d.status = 'paid' AND d.gateway_fee > 0;

UPDATE wallets w SET balance = COALESCE((
  SELECT SUM(CASE WHEN kind = 'in' THEN amount ELSE -amount END) FROM ledger_entries l WHERE l.wallet_id = w.id), 0);

-- ---------- ร้องเรียน P07 (4 บัญชี: U04, U05, U06, U14) ----------
INSERT INTO flags (project_id, reporter_id, evidence_url, reason, created_at) VALUES
('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000004','/img/seed-photo.svg','ภาพที่ลงไม่ตรงสถานที่จริง','2026-11-02 10:00+07'),
('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000005','/img/seed-photo.svg','สงสัยว่าใบเสร็จไม่ตรง','2026-11-02 11:00+07'),
('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000006','/img/seed-photo.svg','ไม่พบสะพานตามที่อ้าง','2026-11-03 10:00+07'),
('b0000000-0000-4000-8000-000000000007','a0000000-0000-4000-8000-000000000014','/img/seed-photo.svg','ข้อมูลไม่ตรงกับที่ผู้ใหญ่บ้านบอก','2026-11-04 10:00+07');

-- ---------- สิ่งตอบแทนที่ยังไม่ส่ง P08 (3 รายการ) ----------
INSERT INTO reward_deliveries (project_id, donor_id, tier, description, status) VALUES
('b0000000-0000-4000-8000-000000000008', NULL, 3, 'ผลิตผลชุมชน (ข้าวสาร)', 'pending'),
('b0000000-0000-4000-8000-000000000008', NULL, 3, 'ผลิตผลชุมชน (ผ้าทอ)', 'pending'),
('b0000000-0000-4000-8000-000000000008', NULL, 3, 'ผลิตผลชุมชน (น้ำผึ้ง)', 'pending');

-- ---------- ข้อความแจ้งเตือนตั้งต้นเล็กน้อย ----------
INSERT INTO notifications (user_id, channel, kind, title, body, project_id, created_at) VALUES
('a0000000-0000-4000-8000-000000000004','line','welcome','ยินดีต้อนรับสู่ร่วมกันทำไม','ขอบคุณที่ร่วมเป็นส่วนหนึ่งของชุมชนผู้ช่วยเหลือ',NULL,'2026-11-05 09:00+07');
