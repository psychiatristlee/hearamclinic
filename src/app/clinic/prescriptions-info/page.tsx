import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대리처방 서류 안내",
  description:
    "대리처방 안내, 필요 서류, 처방전 대리수령 신청서 다운로드",
  alternates: { canonical: "https://hearam.kr/clinic/prescriptions-info" },
  openGraph: {
    title: "대리처방 서류 안내 - 해람정신건강의학과",
    description: "대리처방 안내, 필요 서류, 처방전 대리수령 신청서 다운로드",
    url: "https://hearam.kr/clinic/prescriptions-info",
    siteName: "해람정신건강의학과",
    locale: "ko_KR",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "해람정신건강의학과 로고" }],
  },
};

export default function PrescriptionsInfoPage() {
  return (
    <div className="space-y-12">
      {/* 제목 */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          대리처방 서류 안내
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          대리처방은 교정시설 입소자 또는 거동이 불가능하여 단기간 내에 병원
          내원이 불가능 할 정도의 상태인 분만 가능합니다.
        </p>
      </section>

      {/* 주의사항 */}
      <section>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-900 leading-relaxed">
            급성 질환 또는 단순 거리 문제로 대리처방은 불가합니다.
          </p>
        </div>
      </section>

      {/* 필요한 서류 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">필요한 서류</h2>
        <div className="grid gap-6">
          {/* 1. 신분증 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  환자와 대리수령자의 신분증 제시
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  환자<span className="text-sm text-gray-500">*</span>와
                  보호자 등(대리수령자)의 신분증(사본도 가능)을 제시해 주세요.
                </p>
                <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                  <p className="text-sm text-purple-900 leading-relaxed">
                    * 환자가 만 17세 미만으로 「주민등록법」 제24조 제1항에 따른
                    주민등록증이 발급되지 아니한 경우에는 제외
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 관계 증명 서류 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  관계를 증명할 수 있는 서류 제시
                </h3>
                <ul className="space-y-2">
                  <li className="text-gray-700 flex gap-2">
                    <span className="text-purple-400 flex-shrink-0">·</span>
                    <span>
                      <strong>친족관계인 경우</strong> — 가족관계증명서,
                      주민등록표 등본 등
                    </span>
                  </li>
                  <li className="text-gray-700 flex gap-2">
                    <span className="text-purple-400 flex-shrink-0">·</span>
                    <span>
                      <strong>노인의료복지시설 종사자인 경우</strong> —
                      재직증명서 등
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. 대리수령 신청서 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  처방전 대리 수령 신청서 작성
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  아래 양식 다운로드에서 &apos;처방전 대리 수령 신청서&apos;를
                  다운받아 작성하신 후, 진료 시 제출하시기 바랍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 양식 다운로드 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">양식 다운로드</h2>
        <a
          href="/prescriptions-info/처방전_대리수령_신청서.hwp"
          download
          className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
        >
          <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold text-gray-900">처방전 대리 수령 신청서</p>
            <p className="text-sm text-gray-500">HWP 파일 다운로드</p>
          </div>
        </a>
      </section>
    </div>
  );
}
