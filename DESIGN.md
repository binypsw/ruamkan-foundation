# DESIGN · แพลตฟอร์ม "ร่วมกันทำไม"

อ่านจาก `USER-STORIES.md` และ `REQUIREMENTS.md` · ทุกแผนภาพเป็น Mermaid และ render เป็นภาพที่ `design/<ชื่อ>.png`
รหัส FR/BR/NFR กำกับในแผนภาพเพื่อโยงกลับไปหาข้อกำหนด

---

## 1. System Architecture

```mermaid
%% name: architecture
flowchart LR
  subgraph PC["เครื่องของเรา"]
    BR["เบราว์เซอร์ / PWA บนมือถือ<br/>+ Playwright ตอนทดสอบ"]
  end
  subgraph WEB["Docker: ruamkan-web (พอร์ต 3000)"]
    UI["หน้าเว็บ Next.js App Router"]
    API["API Route Handlers"]
    RULES["lib/rules กฎมูลนิธิ BR-01..36"]
    DBL["lib/db"]
    JOB["งานตั้งเวลา: ปิดโครงการ / คืนเงิน 7 วัน"]
  end
  subgraph DBP["Docker: ruamkan-db (เปิดพอร์ต 5433 บนเครื่อง)"]
    PG[("PostgreSQL 16<br/>ruamkan-db:5432")]
  end
  subgraph EXT["ระบบภายนอก (ตอนทดสอบใช้ตัวจำลอง mock)"]
    PSP["Payment Gateway<br/>PromptPay QR / บัตร"]
    KYC["e-KYC Provider"]
    LINE["LINE OA / LIFF"]
    RD["กรมสรรพากร e-Donation"]
    FS["Object Storage<br/>รูป เสียง วิดีโอ"]
  end
  BR -->|"HTTP :3000"| UI
  UI --> API
  API --> RULES
  RULES --> DBL
  JOB --> RULES
  DBL -->|"ruamkan-net: ruamkan-db:5432"| PG
  API --> PSP
  PSP -.->|"webhook ยืนยันการจ่าย"| API
  API --> KYC
  API --> LINE
  API --> RD
  API --> FS
```

เว็บกับฐานข้อมูลแยกเป็น 2 Docker project ต่อกันผ่าน network `ruamkan-net` เว็บต่อที่ `ruamkan-db:5432` · พอร์ต **5433** เปิดให้เครื่องเราเท่านั้น (ดูข้อมูลตอนทดสอบ)

| ชั้น | อยู่ที่ไหน | หน้าที่ | ทดสอบด้วยอะไร |
|---|---|---|---|
| เบราว์เซอร์/PWA | เครื่องผู้ใช้ | ฟอร์ม ปักหมุด อัดเสียง สแกน QR (FR-09..12, 36, 62) | Playwright (viewport 375px) |
| หน้าเว็บ | ruamkan-web | แสดงโครงการ หลอดความคืบหน้า สถานะ (FR-23..26, 65) | Playwright E2E |
| API | ruamkan-web | รับคำสั่ง ตรวจสิทธิ์ เรียกกฎ ต่อระบบภายนอก (NFR-10) | API test (HTTP) + Playwright |
| lib/rules | ruamkan-web | กฎมูลนิธิ: ยอด เปอร์เซ็นต์ ค่าขอบ BR-01..36 | unit test (ค่าขอบ) |
| งานตั้งเวลา | ruamkan-web | ปิดโครงการ คืนเงิน 7 วัน ปล่อยงานผู้รับรอง (FR-31, 63, BR-15) | unit test + ล็อก "วันนี้" (NFR-18) |
| PostgreSQL | ruamkan-db | เก็บข้อมูล ล็อกยอด กันจองซ้อน (NFR-07, 12) | SQL ตรวจหลังทำรายการ |
| ระบบภายนอก | ผู้ให้บริการ | จ่ายเงิน ยืนยันตัวตน แจ้งเตือน e-Donation | mock ที่ตอบตามสคริปต์ |

ทำที่เบราว์เซอร์: ปักหมุด อัดเสียง/วิดีโอ สแกน QR เช็กอิน · ทำที่เซิร์ฟเวอร์: กฎทุกข้อ คำนวณเงิน ตัดสินผลโครงการ (ห้ามเชื่อค่าจากเบราว์เซอร์)

---

## 2. Use Case

```mermaid
%% name: use-case
flowchart LR
  S(["ต้นเรื่อง (ชาวบ้านผู้เดือดร้อน)"])
  H(["ผู้ช่วยเหลือ (ประชาชนทั่วไป)"])
  V(["ผู้รับรองในพื้นที่ (ผู้ใหญ่บ้าน/ครู)"])
  F(["เจ้าหน้าที่มูลนิธิ"])
  W(["ฝ่ายการเงิน (คุณวิภา)"])
  D(["ผู้บริหาร (คุณสมชาย)"])
  X(["ระบบภายนอก: ธนาคาร/LINE/e-KYC"])
  subgraph SYS["ระบบร่วมกันทำไม"]
    U1["ยืนยันตัวตน e-KYC FR-01..03, 67"]
    U2["ตั้งโครงการและเลือกรูปแบบช่วยเหลือ FR-04..08"]
    U3["เล่าเรื่องด้วยเสียง/ฟอร์ม/ปักหมุด FR-09..13"]
    U4["ทำรายการของ/ขอคน/ขอยืม/ขอรายชื่อ FR-14..18"]
    U5["ตั้งสิ่งตอบแทน FR-19, 40"]
    U6["เสนอแผนงวดและส่งใบเสร็จ FR-20, 21"]
    U7["ปิดโครงการพร้อมรูปก่อน-หลัง FR-22"]
    U8["ดู/ค้นหา/กรองโครงการ FR-23..26"]
    U9["บริจาคเงินและจ่าย FR-27..29, 42"]
    U10["เลือกคืนเงินหรือกองทุนกลาง FR-30, 31"]
    U11["จองสิ่งของ FR-32, 33"]
    U12["สมัครอาสาและเช็กอิน FR-34..36"]
    U13["ยืม-คืนและลงชื่อสนับสนุน FR-37, 38"]
    U14["ทำเนียบและสิ่งตอบแทน FR-39..41"]
    U15["ใบเสร็จและ e-Donation FR-43, 44"]
    U16["รับแจ้งเตือน LINE FR-45, 46"]
    U17["แจ้งเบาะแส FR-47"]
    U18["รับงานและส่งผลรับรอง FR-48, 49"]
    U19["ตรวจและอนุมัติโครงการ FR-50..53, 65"]
    U20["ปลดล็อกงวดและจ่ายตรงร้านค้า FR-54, 55"]
    U21["ระงับ/ปลดการเบิกเงิน FR-56, 57"]
    U22["สมุดบัญชีโปร่งใส FR-58"]
    U23["แยกเงินพักรายโครงการ FR-59"]
    U24["ปิดบัง/เข้ารหัสข้อมูล FR-60, 61"]
    U25["ปิดโครงการอัตโนมัติ FR-63, 64"]
    U26["แดชบอร์ดภาพรวม FR-66"]
  end
  S --- U1
  S --- U2
  S --- U3
  S --- U4
  S --- U5
  S --- U6
  S --- U7
  H --- U8
  H --- U9
  H --- U10
  H --- U11
  H --- U12
  H --- U13
  H --- U14
  H --- U15
  H --- U16
  H --- U17
  V --- U18
  F --- U19
  F --- U20
  F --- U21
  W --- U22
  W --- U23
  W --- U24
  W --- U15
  D --- U26
  U9 --- X
  U1 --- X
  U16 --- X
  U25 --- X
```

ครบทุกกลุ่มในบันทึกสัมภาษณ์: ต้นเรื่อง · ผู้ช่วยเหลือ · ผู้รับรอง · เจ้าหน้าที่ · ฝ่ายการเงิน · ผู้บริหาร · ระบบภายนอก

---

## 3. Flowchart

### 3.1 ส่งโครงการและตรวจก่อนเปิด

```mermaid
%% name: flow-verify
flowchart TD
  A(["ต้นเรื่องกดส่งโครงการ"]) --> B{"ผ่าน e-KYC แล้วไหม FR-02 BR-31"}
  B -->|ไม่| B1["แจ้งให้ยืนยันตัวตนก่อน"]
  B -->|ใช่| C{"ตอบคำถามบังคับครบ และเลือกรูปแบบ ≥ 1 FR-05 FR-13"}
  C -->|ไม่| C1["แจ้งช่องที่ขาด"]
  C -->|ใช่| D{"เป้าเงิน 1,000..500,000 BR-01 BR-02"}
  D -->|ไม่| D1["แจ้งช่วงที่ยอมรับ"]
  D -->|ใช่| E["สถานะ Pending Verification FR-50"]
  E --> F{"ผู้รับรอง ≥ 2 คน BR-12"}
  F -->|ยังไม่ครบ| F1["รอผู้รับรอง · ไม่ตอบ 3 วัน ปล่อยงาน BR-15"]
  F1 --> F
  F -->|ครบ| G{"ผู้รับรองห่าง ≤ 5.0 กม. และไม่ใช่ญาติ BR-13 BR-14"}
  G -->|ไม่| G1["ไม่นับผู้รับรองคนนั้น"]
  G1 --> F
  G -->|ใช่| H{"เจ้าหน้าที่ตรวจเอกสาร ภายใน 3 วันทำการ หรือ 24 ชม. ถ้าด่วน BR-16 BR-17"}
  H -->|อนุมัติ| I(["สถานะ Active · เริ่มนับเวลา BR-04 FR-51"])
  H -->|ปฏิเสธ| J{"ส่งใหม่ไปแล้วกี่ครั้ง BR-18"}
  J -->|น้อยกว่า 2| K["แจ้งเหตุผล · แก้และส่งใหม่ FR-52"]
  K --> E
  J -->|ครบ 2 ครั้ง| L(["ปิดเรื่อง"])
```

### 3.2 บริจาคเงิน

```mermaid
%% name: flow-donate
flowchart TD
  A(["ผู้ช่วยเหลือเลือกจำนวนเงิน"]) --> B{"โครงการ Active และยังไม่ปิดรับ FR-23"}
  B -->|ไม่| B1["แจ้งว่าปิดรับแล้ว"]
  B -->|ใช่| C{"จำนวน ≥ 20 บาท BR-23"}
  C -->|ไม่| C1["แจ้งขั้นต่ำ"]
  C -->|ใช่| D{"ยอดรวมหลังบริจาค ≤ 120% ของเป้า BR-06 FR-64"}
  D -->|เกิน| D1["รับได้ถึงยอดที่เหลือ หรือแจ้งว่าปิดรับ"]
  D -->|ไม่เกิน| E{"ติ๊กทิป 5% ไหม BR-19 FR-42"}
  E -->|ใช่| E1["ทิป = จำนวน × 5% ปัด 2 ตำแหน่ง"]
  E -->|ไม่| F
  E1 --> F["สร้าง PromptPay QR FR-27"]
  F --> G{"ได้รับเงินภายในเวลา FR-28"}
  G -->|ไม่| G1["QR หมดอายุ ไม่บันทึก"]
  G -->|ใช่| H["บันทึกยอด · ค่าธรรมเนียมหักจากโครงการ BR-20"]
  H --> I{"เงินเข้ากองทุนกลางไหม BR-21"}
  I -->|ใช่| I1["ใบเสร็จ + ส่ง e-Donation FR-44"]
  I -->|ไม่| I2["ใบเสร็จธรรมดา FR-43"]
  I1 --> J["ใบเสร็จภายใน 1 วันทำการ BR-22"]
  I2 --> J
  J --> K["ยอดเข้าสมุดบัญชี FR-58 · ชื่อตามความยินยอม BR-25"]
  K --> L{"ยอดถึงระดับสิ่งตอบแทน BR-24"}
  L --> M(["แจ้งผล + สิทธิ์ Tier ที่ได้ FR-40"])
```

### 3.3 ครบกำหนดและสรุปผลโครงการ

```mermaid
%% name: flow-close
flowchart TD
  A(["ครบเวลาโครงการ หรือยอดถึง 120% FR-63"]) --> B{"วิธีรับเงิน"}
  B -->|"ครบเป้าถึงได้"| C{"ยอด ≥ เป้า BR-05"}
  B -->|Flexible| Z["ปิดรับ · เบิกตามงวดที่ผ่านต่อ BR-08"]
  C -->|ใช่| D["สำเร็จ · เข้าขั้นเบิกงวด"]
  C -->|ไม่| E["ไม่สำเร็จ · แจ้งผู้บริจาคทุกคน FR-30"]
  E --> F{"ผู้บริจาคเลือกภายใน 7 วัน BR-07"}
  F -->|คืนเงิน| G["คืนเงิน"]
  F -->|กองทุนกลาง| H["โอนเข้ากองทุนกลาง + e-Donation BR-21"]
  F -->|ไม่เลือก| I["วันที่ 8 คืนเงินอัตโนมัติ FR-31"]
  D --> J{"ต้นเรื่องขอปิดก่อนกำหนด BR-32"}
  J -->|ต้นเรื่องกดเอง| K["ปฏิเสธ · ต้องแจ้งมูลนิธิ"]
  J -->|"มูลนิธิปิด"| L["ปิดโครงการ"]
  D --> M{"อัปโหลดรูป Before + After แล้ว BR-29"}
  M -->|ไม่| M1["ปิดไม่ได้"]
  M -->|ใช่| N(["ปิดโครงการ · แจ้งผู้ช่วยเหลือทุกคน FR-46"])
```

### 3.4 เบิกเงินตามงวด

```mermaid
%% name: flow-disburse
flowchart TD
  A(["ต้นเรื่องขอเบิกงวด"]) --> B{"ถูกระงับเพราะร้องเรียนอยู่ไหม FR-56"}
  B -->|ใช่| B1["เบิกไม่ได้ · แจ้งเหตุผล"]
  B -->|ไม่| C{"แบบ Flexible ไหม"}
  C -->|ใช่| C1{"ยอดสะสมที่ยังไม่เบิก ≥ 10,000 BR-08"}
  C1 -->|ไม่| C2["ยังขอเบิกไม่ได้"]
  C1 -->|ใช่| D
  C -->|ไม่| D{"งวดนี้เป็นงวดแรกไหม"}
  D -->|ใช่| E{"จำนวน ≤ 40% ของเป้า BR-09"}
  E -->|ไม่| E1["แจ้งเกินสัดส่วน"]
  E -->|ใช่| G
  D -->|ไม่| F{"งวดก่อนมีใบเสร็จ + รูป และเจ้าหน้าที่อนุมัติ BR-11 FR-54"}
  F -->|ไม่| F1["ปลดล็อกไม่ได้"]
  F -->|ใช่| G{"แผนงวดตรงกฎ: เป้า > 20,000 ต้อง ≥ 2 งวด BR-10"}
  G -->|ไม่| G1["ให้ต้นเรื่องแก้แผน"]
  G -->|ใช่| H{"จ่ายตรงร้านค้าไหม FR-55"}
  H -->|ใช่| H1["จ่ายผ่าน QR ร้านค้า บันทึกชื่อร้าน"]
  H -->|ไม่| H2["โอนให้ต้นเรื่อง"]
  H1 --> I["หักจากบัญชีพักของโครงการนี้เท่านั้น BR-34 FR-59"]
  H2 --> I
  I --> J(["ลง Ledger · คงเหลือ = เข้า − ออก − ค่าธรรมเนียม BR-35 FR-58"])
```

### 3.5 ร้องเรียนและระงับเบิก

```mermaid
%% name: flow-flag
flowchart TD
  A(["ผู้ใช้กดแจ้งเบาะแส FR-47"]) --> B{"แนบหลักฐานไหม"}
  B -->|ไม่| B1["ส่งไม่ได้"]
  B -->|ใช่| C["บันทึกคำร้อง"]
  C --> D{"จำนวนบัญชีต่างกันที่ร้องเรียน ≥ 5 BR-28"}
  D -->|ไม่| E["รอตรวจตามปกติ"]
  D -->|ใช่| F["ระงับการเบิกอัตโนมัติ FR-56"]
  F --> G["แจ้งทีมตรวจสอบมูลนิธิ"]
  G --> H{"ผลตรวจ"}
  H -->|ไม่พบความผิด| I["เจ้าหน้าที่ปลดระงับ FR-57"]
  H -->|พบความผิด| J(["ปิดโครงการ · คืนเงินผู้บริจาค"])
  I --> K(["เบิกต่อได้ · บันทึก audit log NFR-09"])
```

### 3.6 คำนวณยอดสุทธิของรายการบริจาค (ลำดับสำคัญ)

```mermaid
%% name: flow-price
flowchart TD
  A["ยอดบริจาค เช่น 1,000"] --> B["ทิป 5% ถ้าติ๊ก = 50.00 BR-19"]
  B --> C["ผู้บริจาคจ่ายรวม = 1,050.00"]
  C --> D["ค่าธรรมเนียมผู้ให้บริการ หักจากยอดโครงการ BR-20"]
  D --> E["ยอดเข้าบัญชีพักโครงการ = ยอดบริจาค − ค่าธรรมเนียม BR-35"]
  B --> F["ทิป 50.00 เข้าค่าบริหารมูลนิธิ แยกบัญชี BR-34"]
  A --> G{"ระดับสิ่งตอบแทนดูจาก ยอดบริจาค ไม่รวมทิป BR-24"}
  G -->|"≥ 2,000"| G3["Tier 3"]
  G -->|"500..1,999"| G2["Tier 2"]
  G -->|"50..499"| G1["Tier 1"]
  G -->|"< 50"| G0["ไม่มี Tier"]
```

---

## 4. ERD

ชนิดข้อมูล: เงินและยอดเป็น `NUMERIC(12,2)` (ห้าม float) · จำนวนชิ้น/คน/ครั้งเป็น `INTEGER` · เวลาเป็น `TIMESTAMPTZ` · เปอร์เซ็นต์งวดเป็น `NUMERIC(5,2)`

```mermaid
%% name: erd
erDiagram
  users ||--o{ projects : "ตั้ง (ต้นเรื่อง)"
  users ||--o| kyc_records : "ยืนยันตัวตน"
  users ||--o{ donations : "บริจาค"
  users ||--o{ item_pledges : "จองของ"
  users ||--o{ volunteer_signups : "สมัครอาสา"
  users ||--o{ vouchings : "รับรอง"
  users ||--o{ flags : "ร้องเรียน"
  users ||--o{ signatures : "ลงชื่อ"
  projects ||--o{ project_support_types : "รูปแบบที่ขอ"
  projects ||--o{ project_items : "รายการของ"
  projects ||--o{ skill_needs : "ขอคน"
  projects ||--o{ loan_requests : "ขอยืม"
  projects ||--o{ reward_tiers : "สิ่งตอบแทน"
  projects ||--o{ milestones : "งวดเบิก"
  projects ||--o{ vouchings : "ผู้รับรอง"
  projects ||--o{ reviews : "ผลตรวจ"
  projects ||--o{ donations : "รับเงิน"
  projects ||--o{ flags : "ถูกร้องเรียน"
  projects ||--o{ signatures : "รายชื่อ"
  projects ||--|| wallets : "บัญชีพัก"
  project_items ||--o{ item_pledges : "ถูกจอง"
  skill_needs ||--o{ volunteer_signups : "คนมาช่วย"
  volunteer_signups ||--o| checkins : "เช็กอิน"
  loan_requests ||--o{ loans : "สัญญายืม"
  milestones ||--o{ milestone_evidence : "ใบเสร็จ/รูป"
  milestones ||--o{ disbursements : "จ่ายเงิน"
  donations ||--o| receipts : "ใบเสร็จ"
  wallets ||--o{ ledger_entries : "รายการบัญชี"
  donations ||--o{ ledger_entries : "ก่อรายการ"
  disbursements ||--o{ ledger_entries : "ก่อรายการ"
  users {
    uuid id PK
    text email
    text role "starter helper voucher staff finance exec"
    text display_name
    boolean consent_show_name
    text address_enc "เข้ารหัส"
    geography home_point
  }
  kyc_records {
    uuid user_id PK
    text id_card_enc "เข้ารหัส"
    boolean face_verified
    timestamptz verified_at
  }
  projects {
    uuid id PK
    uuid starter_id FK
    text status "pending active suspended closed rejected"
    text funding_mode "all_or_nothing flexible"
    numeric target_amount "NUMERIC(12,2) 1000..500000"
    integer duration_hours "360 720 72"
    timestamptz activated_at
    timestamptz ends_at
    integer resubmit_count "0..2"
    boolean frozen
  }
  project_support_types {
    uuid project_id FK
    text type "money item labor loan advocacy"
  }
  project_items {
    uuid id PK
    uuid project_id FK
    text name
    integer qty_needed
    integer qty_reserved "CHECK reserved <= needed"
  }
  skill_needs {
    uuid id PK
    uuid project_id FK
    text skill
    integer headcount
    timestamptz work_date
  }
  loan_requests {
    uuid id PK
    uuid project_id FK
    text item_name
    integer days
  }
  loans {
    uuid id PK
    uuid loan_request_id FK
    uuid lender_id FK
    text status "active returned overdue"
    date due_date
  }
  reward_tiers {
    uuid id PK
    uuid project_id FK
    numeric min_amount "NUMERIC(12,2)"
    text description
  }
  milestones {
    uuid id PK
    uuid project_id FK
    integer seq
    numeric percent "NUMERIC(5,2)"
    numeric amount "NUMERIC(12,2)"
    text status "locked requested approved paid"
  }
  milestone_evidence {
    uuid id PK
    uuid milestone_id FK
    text kind "receipt photo"
    text file_url
  }
  disbursements {
    uuid id PK
    uuid milestone_id FK
    numeric amount "NUMERIC(12,2)"
    text payee_type "starter merchant"
    text merchant_name
    timestamptz paid_at
  }
  vouchings {
    uuid id PK
    uuid project_id FK
    uuid voucher_id FK
    numeric distance_km "NUMERIC(5,2)"
    text status "taken submitted released"
    timestamptz taken_at
  }
  reviews {
    uuid id PK
    uuid project_id FK
    uuid staff_id FK
    text decision "approve reject"
    text reason
    timestamptz decided_at
  }
  donations {
    uuid id PK
    uuid project_id FK
    uuid donor_id FK
    numeric amount "NUMERIC(12,2) >= 20"
    numeric tip "NUMERIC(12,2)"
    numeric gateway_fee "NUMERIC(12,2)"
    boolean to_central_fund
    text status "pending paid refunded"
    text refund_choice "refund central none"
  }
  receipts {
    uuid id PK
    uuid donation_id FK
    boolean edonation_sent
    timestamptz issued_at
  }
  item_pledges {
    uuid id PK
    uuid item_id FK
    uuid donor_id FK
    integer qty
    text tracking_no
  }
  volunteer_signups {
    uuid id PK
    uuid need_id FK
    uuid user_id FK
  }
  checkins {
    uuid signup_id PK
    timestamptz at
  }
  signatures {
    uuid project_id FK
    uuid user_id FK
  }
  flags {
    uuid id PK
    uuid project_id FK
    uuid reporter_id FK
    text evidence_url
  }
  wallets {
    uuid id PK
    uuid project_id FK
    numeric balance "NUMERIC(12,2) CHECK >= 0"
  }
  ledger_entries {
    uuid id PK
    uuid wallet_id FK
    text kind "in out fee"
    numeric amount "NUMERIC(12,2)"
    timestamptz at
  }
  audit_log {
    uuid id PK
    uuid actor_id FK
    text action "approve release freeze unfreeze"
    uuid project_id FK
    timestamptz at
  }
```

**กลไกในฐานข้อมูลที่รับกฎของร้าน**

| กฎ | กลไก |
|---|---|
| สิ่งของจองเกินที่ขาดไม่ได้ BR-26, NFR-12 | `CHECK (qty_reserved <= qty_needed)` + `UPDATE ... WHERE qty_reserved + :qty <= qty_needed` ใน transaction เดียว |
| 1 บัญชีลงชื่อ 1 ครั้งต่อโครงการ BR-27 | `UNIQUE (project_id, user_id)` ใน `signatures` |
| ยอดบริจาครวมไม่เกิน 120% BR-06 | ล็อกแถว `projects` (`SELECT ... FOR UPDATE`) ตอนบันทึกยอด แล้วเทียบ `SUM(donations.amount)` |
| บัญชีพักไม่ติดลบ BR-34 | `CHECK (balance >= 0)` ใน `wallets` และห้ามจ่ายข้าม `wallet_id` |
| Ledger ห้ามแก้ย้อนหลัง FR-58 NFR-07 | `ledger_entries` เพิ่มอย่างเดียว (ไม่มี UPDATE/DELETE) ยอด `balance` ต้องเท่ากับ `SUM` |
| ส่งใหม่ไม่เกิน 2 ครั้ง BR-18 | `CHECK (resubmit_count BETWEEN 0 AND 2)` |
| งวดแรก ≤ 40% BR-09 | `CHECK` ผ่านฟังก์ชันตรวจตอนเพิ่ม `milestones` (seq = 1) |
| ข้อมูลอ่อนไหวเข้ารหัส NFR-05 | คอลัมน์ `*_enc` ใช้ `pgcrypto` เข้ารหัสก่อนบันทึก |

---

## 5. Sequence

### 5.1 ผู้ช่วยเหลือบริจาคผ่าน PromptPay

```mermaid
%% name: seq-donate
sequenceDiagram
  actor U as ผู้ช่วยเหลือ
  participant B as เบราว์เซอร์
  participant W as web
  participant A as API
  participant D as db
  participant P as Payment Gateway
  U->>B: เลือก 1,000 บาท ติ๊กทิป 5%
  B->>W: GET /projects/id
  W->>A: ดึงโครงการ
  A->>D: SELECT project + ยอดรวม
  D-->>A: Active ยอด 38,000 จาก 50,000
  A-->>B: หลอดความคืบหน้า
  B->>A: POST /donations amount 1000 tip true
  A->>D: BEGIN · SELECT projects FOR UPDATE
  A->>A: ตรวจ BR-23 BR-06 คำนวณ tip 50.00
  A->>D: INSERT donations pending
  A->>P: สร้าง Dynamic QR 1,050.00
  P-->>A: QR
  A-->>B: แสดง QR
  U->>P: สแกนจ่าย
  P-->>A: webhook paid fee 25.00
  A->>D: UPDATE donations paid · INSERT ledger in 1,000.00 และ fee 25.00 (คงเหลือ 975.00)
  A->>D: INSERT receipts · COMMIT
  A-->>B: 200 ยอดโครงการเพิ่ม
  A-->>U: LINE ใบเสร็จ + Tier 2 (FR-40, 45)
```

### 5.2 อนุมัติและปลดล็อกงวดเบิกเงิน

```mermaid
%% name: seq-disburse
sequenceDiagram
  actor S as ต้นเรื่อง
  participant B as เบราว์เซอร์
  participant A as API
  participant D as db
  actor F as เจ้าหน้าที่
  participant P as Payment Gateway
  S->>B: อัปโหลดใบเสร็จ + รูปงวด 1
  B->>A: POST /milestones/1/evidence
  A->>D: INSERT milestone_evidence · UPDATE milestones requested
  A-->>F: แจ้งงานรอตรวจ
  F->>A: POST /milestones/1/approve
  A->>D: ตรวจ frozen = false และสิทธิ์ staff NFR-10
  A->>A: ตรวจ BR-09 BR-11
  A->>D: BEGIN · UPDATE wallets balance − 20,000 (CHECK balance >= 0)
  A->>P: จ่ายผ่าน QR ร้านวัสดุ
  P-->>A: สำเร็จ
  A->>D: INSERT disbursements · INSERT ledger out · INSERT audit_log · COMMIT
  A-->>S: LINE งวด 1 จ่ายแล้ว
```

### 5.3 สองคนจองสิ่งของชิ้นสุดท้ายพร้อมกัน

```mermaid
%% name: seq-race
sequenceDiagram
  actor A1 as คุณ A
  actor A2 as คุณ B
  participant API as API
  participant DB as db
  Note over DB: กระเบื้อง ต้องการ 50 จองแล้ว 49 ขาด 1 แผ่น
  par พร้อมกัน
    A1->>API: POST /pledges qty 1
  and
    A2->>API: POST /pledges qty 1
  end
  API->>DB: A: BEGIN · UPDATE project_items SET reserved = 50 WHERE reserved + 1 <= 50
  API->>DB: B: BEGIN · UPDATE ... WHERE reserved + 1 <= 50 (รอ lock ของ A)
  DB-->>API: A: 1 แถว · INSERT item_pledges · COMMIT
  DB-->>API: B: 0 แถว (reserved = 50 แล้ว) · ROLLBACK
  API-->>A1: 201 ใบปะหน้า + tracking
  API-->>A2: 409 ของถูกจองครบแล้ว (FR-32, BR-26)
```

---

## 6. คำถามที่ได้จากการออกแบบ

| รหัส | คำถาม | เกี่ยวกับ |
|---|---|---|
| D-01 | ทิป 5% เข้า "ค่าบริหารมูลนิธิ" บัญชีแยกใช่ไหม และเข้าโครงการหรือไม่ (ตอนนี้ออกแบบแยก) | FR-42, BR-19, FR-59 |
| D-02 | ผู้บริจาคจ่ายแล้วแต่ยอดจะเกิน 120% ตอนจ่าย (QR ที่ออกก่อนหน้า) คืนส่วนเกินหรือรับเต็ม | BR-06, FR-64 |
| D-03 | โครงการ Flexible ครบเวลาแล้วเงินที่ยังไม่เบิก (เหลือสะสมไม่ถึง 10,000) เบิกได้อย่างไร | BR-08 |
| D-04 | ผู้บริจาคที่เลือก "กองทุนกลาง" ได้ e-Donation แต่เงินจากโครงการที่ไม่ถึงเป้าเป็นเงินพักของโครงการ ย้ายบัญชีตอนไหน | BR-07, BR-21 |
| D-05 | งวดที่ถูกระงับ (ร้องเรียน) เวลาของโครงการเดินต่อไหม โดยเฉพาะเคส 72 ชม. | BR-04, BR-28 |
| D-06 | ผู้รับรองต้องผ่านการยืนยันตัวตนไหม และถ้าผู้รับรองคนที่ 2 ถูกถอนทีหลังอนุมัติ โครงการยังเปิดได้ไหม | BR-12 |
| D-07 | ผู้ช่วยเหลือบริจาคแบบไม่ล็อกอินได้ไหม (ผลต่อใบเสร็จและ e-Donation ที่ต้องมีชื่อ/เลขภาษี) | FR-43, FR-44 |
| D-08 | ผู้บริจาคเปลี่ยนใจขอคืนเงินก่อนโครงการจบได้ไหม | FR-30 |
| D-09 | สิ่งของที่จองแล้วไม่ส่งภายในกี่วัน ระบบปล่อยโควตาคืน | BR-26, FR-32 |
| D-10 | จุดไหนที่มูลนิธิใช้ "ผลตรวจ" ย้อนกลับ Active เป็น Suspended นอกจากร้องเรียน | FR-56 |
| D-11 | ราคาค่าธรรมเนียม PSP ต่างกันตามวิธีจ่าย (QR / บัตร) แสดงตามจริงทุกรายการใช่ไหม | BR-20, FR-58 |
| D-12 | ข้อมูลผู้รับรองและใบเสร็จของต้นเรื่องเก็บนานแค่ไหน ตาม PDPA | FR-61, NFR-05 |

**สมมติฐานในการออกแบบ**

| รหัส | สมมติฐาน |
|---|---|
| DA-01 | ทิป 5% แยกเข้าบัญชีค่าบริหาร ไม่นับเป็นยอดโครงการ และไม่นับระดับ Tier (ดู D-01) |
| DA-02 | ระดับสิ่งตอบแทนคิดจากยอดบริจาคไม่รวมทิป |
| DA-03 | ยอดที่จะเกิน 120% ระบบรับเท่าที่เหลือแล้วคืนส่วนที่เกิน |
| DA-04 | ใช้ตัวจำลอง (mock) ของ Payment Gateway, e-KYC, LINE, e-Donation ตอนทดสอบ |
| DA-05 | การปิดโครงการและคืนเงินใช้งานตั้งเวลาในเว็บเอง ไม่ใช้ตัวจัดคิวภายนอกในเฟสแรก |

---

## 7. สรุปแผนภาพและความครอบคลุม

| แผนภาพ | จำนวน | ไฟล์ภาพ |
|---|---|---|
| System Architecture | 1 | `design/architecture.png` |
| Use Case | 1 | `design/use-case.png` |
| Flowchart | 6 | `design/flow-verify.png` `flow-donate.png` `flow-close.png` `flow-disburse.png` `flow-flag.png` `flow-price.png` |
| ERD | 1 (24 ตาราง) | `design/erd.png` |
| Sequence | 3 | `design/seq-donate.png` `seq-disburse.png` `seq-race.png` |
| **รวม** | **12** | render ผ่านด้วย mermaid-cli 12/12 |

| ข้อกำหนด | ทั้งหมด | อยู่ในแผนภาพ | ยังไม่อยู่ในแผนภาพใดเลย |
|---|---|---|---|
| FR | 67 | 67 | ไม่มี |
| BR | 36 | 36 | ไม่มี |
| NFR | 19 | 6 | NFR-01, 02, 03, 04, 06, 08, 11, 13, 14, 15, 16, 17, 19 (เป็นคุณสมบัติรวม วัดตอนทดสอบ ไม่ใช่ขั้นตอนในแผนภาพ) |

ตรวจด้วยสคริปต์ที่อ่านรหัส `FR-xx` `BR-xx` `NFR-xx` จาก DESIGN.md เทียบกับตารางใน REQUIREMENTS.md
