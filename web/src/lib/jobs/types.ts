/** ผลของงานตั้งเวลาแต่ละงาน (รันผ่าน POST /api/test/run-jobs) · เวลาอ่านจาก lib/clock เท่านั้น */
export interface JobResult {
  name: string;
  affected: number;
  details: string[];
}
