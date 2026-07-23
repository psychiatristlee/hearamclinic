import SoundaryHandoff from "@/components/SoundaryHandoff";
import { soundaryBatteryUrl } from "@/lib/external-tests";

// 종합 성격 보고서는 soundary.life(해람헬스케어)의 배터리로 이관 — 안내 후 자동 이동
export default function PersonalityReportPage() {
  return (
    <SoundaryHandoff
      targetUrl={soundaryBatteryUrl()}
      testTitle="AI 종합 성격 보고서"
    />
  );
}
