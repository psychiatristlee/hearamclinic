import Image from "next/image";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "진료기록사본 안내",
  description:
    "진료기록사본 발급 안내, 대리수령 시 필요서류, 동의서 및 위임장 양식 다운로드",
  alternates: { canonical: "https://hearam.kr/clinic/medical-records-info" },
  openGraph: {
    title: "진료기록사본 안내 - 해람정신건강의학과",
    description:
      "진료기록사본 발급 안내, 대리수령 시 필요서류, 동의서 및 위임장 양식 다운로드",
    url: "https://hearam.kr/clinic/medical-records-info",
    siteName: "해람정신건강의학과",
    locale: "ko_KR",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "해람정신건강의학과 로고" }],
  },
};

export default function MedicalRecordsInfoPage() {
  return (
    <div className="space-y-12">
      {/* 제목 */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          진료기록사본 안내
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          모든 진료기록은 직접 내원하셔서 수령하는 것이 원칙입니다.
        </p>
      </section>

      {/* 대리수령 안내 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          대리인 수령 안내
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <p className="text-gray-700 leading-relaxed">
            대리인이 수령할 시, 진단서 및 소견서를 새로 작성하는 것은 어려우나
            이전에 발급했던 적이 있는 진료기록은 진료기록 사본으로 간주하여 발급
            가능합니다.
          </p>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">
              대리수령 가능한 문서
            </h3>
            <ul className="space-y-1.5">
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                진료기록사본
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                진료확인서
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                이전에 처방 받은 기록 (처방전, 과거 진단서 등)
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 필요한 서류 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">필요한 서류</h2>
        <div className="grid gap-6">
          {/* 보호자 내원 시 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4">
              보호자 내원 시
            </h3>
            <ul className="space-y-2">
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                보호자 신분증 사본
                <span className="text-sm text-gray-500">
                  (휴대폰 저장 사진 가능)
                </span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                환자 자필서명 동의서
                <span className="text-sm text-gray-500">(팩스 가능)</span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                가족관계증명서
                <span className="text-sm text-gray-500">
                  (휴대폰 저장 사진 가능)
                </span>
              </li>
            </ul>
          </div>

          {/* 동의를 받은 대리인 내원 시 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-3">
              동의를 받은 대리인 내원 시
            </h3>
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-purple-900 leading-relaxed">
                원칙적으로 형제, 자매는 보호자에 해당하지 않습니다. 부모, 조부모,
                자식, 손자 모두 없는 경우에만 형제, 자매가 가능하며 다른 가족이
                생존해 있다면 형제, 자매의 경우 보호자 요건이 아닌{" "}
                <strong>&lt;동의를 받은 대리인&gt;</strong> 요건으로
                대리수령해야 합니다.
              </p>
            </div>
            <ul className="space-y-2">
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                대리인 신분증 사본
                <span className="text-sm text-gray-500">
                  (휴대폰 저장 사진 가능)
                </span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                환자가 자필서명한 동의서
                <span className="text-sm text-gray-500">(팩스 등 가능)</span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                환자가 자필서명한 위임장
                <span className="text-sm text-gray-500">(팩스 등 가능)</span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                환자의 신분증 사본
                <span className="text-sm text-gray-500">
                  (휴대폰 저장 사진 가능)
                </span>
              </li>
              <li className="text-gray-700 flex gap-2">
                <span className="text-purple-400 flex-shrink-0">·</span>
                가족관계증명서
                <span className="text-sm text-gray-500">
                  (가족을 증명할 때, 기타 서류는 불가합니다)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 환자의 동의를 받은 경우 이미지 */}
      <section>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <Image
            src="/medical-records-info/환자의동의를받은경우.webp"
            alt="환자의 동의를 받은 경우 필요 서류 안내"
            width={800}
            height={600}
            className="w-full h-auto rounded-lg"
          />
        </div>
      </section>

      {/* 두 가지 서류 모두 작성해야 하는 이유 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          가족관계라도 두 가지 서류를 모두 작성해야 하는 이유
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            가족이라고 하더라도 친족이 아닐 수 있고, 친족이 오기로 하셨다가
            친족이 아닌 가족이 내원하시게 된다거나 가족관계증명서를 첨부하지
            못하는 경우도 있기 때문에 아래 두 가지 서류를 모두 작성해서
            내원하시는 것을 권유드립니다.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
            <p className="text-sm text-yellow-900 leading-relaxed">
              동의서만 작성해 오시는 경우 친족임이 확인되지 않으면 서류발급이
              제한될 수 있습니다.
            </p>
            <p className="text-sm text-yellow-900 leading-relaxed">
              저희는 대학병원처럼 원무과가 따로 분리되어 있지 않아 원무행정을 잘
              모르는 직원이 응대하는 경우 다른 원무 업무 처리 이후에 사본발급이
              가능하게 되어 오랜 시간 대기하는 경우가 발생할 수 있으므로
              가급적이면 두 가지 서류 모두를 작성해 주시기 부탁드립니다.
            </p>
          </div>
        </div>
      </section>

      {/* 양식 다운로드 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">양식 다운로드</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/medical-records-info/진료기록열람_및_사본발급_동의서.pdf"
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
              <p className="font-bold text-gray-900">동의서 양식</p>
              <p className="text-sm text-gray-500">
                진료기록 열람 및 사본발급 동의서
              </p>
            </div>
          </a>
          <a
            href="/medical-records-info/진료기록열람_및_사본발급_위임장.pdf"
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
              <p className="font-bold text-gray-900">위임장 양식</p>
              <p className="text-sm text-gray-500">
                진료기록 열람 및 사본발급 위임장
              </p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
