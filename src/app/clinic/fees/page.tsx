import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "비급여진료비용 안내",
  description:
    "해람정신건강의학과 비급여 진료비용 안내 - 진단서, 진료확인서, 심리검사 등 항목별 비용",
  alternates: { canonical: "https://hearam.kr/clinic/fees" },
  openGraph: {
    title: "비급여진료비용 안내 - 해람정신건강의학과",
    description:
      "해람정신건강의학과 비급여 진료비용 안내 - 진단서, 진료확인서, 심리검사 등 항목별 비용",
    url: "https://hearam.kr/clinic/fees",
    siteName: "해람정신건강의학과",
    locale: "ko_KR",
  },
};

const fees = [
  { name: "진단서", price: "10,000원" },
  { name: "영문진단서", price: "5,000원" },
  { name: "근로능력평가용 진단서", price: "10,000원" },
  { name: "장애진단서", price: "40,000원" },
  { name: "병무용진단서", price: "20,000원" },
  { name: "진료확인서", price: "3,000원" },
  { name: "통원확인서", price: "3,000원" },
  { name: "진료기록사본 (1~5매)", price: "1,000원" },
  { name: "진료기록사본 (6페이지부터)", price: "장당 100원" },
  { name: "주의력검사", price: "100,000원" },
  { name: "정신분석적 정신치료", price: "150,000원" },
  { name: "신경증 우울척도", price: "28,000원" },
];

export default function FeesPage() {
  return (
    <div className="space-y-12">
      {/* 제목 */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          비급여진료비용 안내
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          건강보험이 적용되지 않는 비급여 항목의 비용 안내입니다.
        </p>
      </section>

      {/* 비용 테이블 */}
      <section>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-purple-50">
                <th className="px-6 py-4 text-sm font-semibold text-purple-900">
                  항목
                </th>
                <th className="px-6 py-4 text-sm font-semibold text-purple-900 text-right">
                  비용
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fees.map((fee) => (
                <tr key={fee.name} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-700">{fee.name}</td>
                  <td className="px-6 py-4 text-gray-900 font-medium text-right">
                    {fee.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 안내사항 */}
      <section>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 space-y-2">
          <p className="text-yellow-900 leading-relaxed">
            비급여 항목의 비용은 변동될 수 있으며, 자세한 사항은 내원 시
            문의해 주시기 바랍니다.
          </p>
        </div>
      </section>
    </div>
  );
}
