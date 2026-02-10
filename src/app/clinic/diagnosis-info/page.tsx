import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "진단서 발급 안내",
  description:
    "진단서 발급 절차 및 유의사항 안내. 진단서 발급 권한, 발급 일정, 초진 당일 발급 제한 등.",
  alternates: { canonical: "https://hearam.kr/clinic/diagnosis-info" },
  openGraph: {
    title: "진단서 발급 안내 - 해람정신건강의학과",
    description:
      "진단서 발급 절차 및 유의사항 안내. 진단서 발급 권한, 발급 일정, 초진 당일 발급 제한 등.",
    url: "https://hearam.kr/clinic/diagnosis-info",
    siteName: "해람정신건강의학과",
    locale: "ko_KR",
  },
};

const blogPosts = [
  {
    href: "https://blog.naver.com/hearimclinic/223174283961",
    title: "정신과 진단서 바로 발급받고 싶은데 왜 안된다는 건가요?",
    description:
      "안녕하세요 홍대 해람 정신과 원장 입니다 월요일 아침만 되면 진단서를 바로 발급해줄 수 없느냐는 수 많은 문의가...",
    image:
      "https://blogthumb.pstatic.net/MjAyMzA4MDNfNTMg/MDAxNjkxMDc0NTAyNjg0.RnVh_EhXN7i7r7JNhSprnhBQnRI4S9jdEsW6xIihkysg.-M-KcOy6ZO4DdtNupC9RoX9_GIqzypLZ3S32b9dJ3bIg.JPEG.hearimclinic/7BA56E9F-1EFD-4CBF-BC6C-33A599497458_1_105_c.jpeg?type=w2",
  },
  {
    href: "https://blog.naver.com/hearimclinic/223179599073",
    title: "정신과 진단서 내용에 원인과 판단을 써줄 수 없는 이유는 무엇일까요?",
    description:
      "안녕하세요 홍대 해람 정신과 원장입니다 지난 포스팅에서는 정신과 진단서가 바로 못나오는 이유에 대해서...",
    image:
      "https://blogthumb.pstatic.net/MjAyMzA4MDlfODAg/MDAxNjkxNTgzNDczMTcx.qc84Z2etGwbtrIl0j7fqd5k3bo_6kUzeR0OB2_t2xc8g.OHy6-AoQg0ew7axosZ2oLSLNYdawdmdDmRgcXRRHJ3Mg.PNG.hearimclinic/drlee2976_a_medical_document_that_is_lying_on_the_wood_table_2afb04e7-7f51-4.png?type=w2",
  },
];

export default function DiagnosisInfoPage() {
  return (
    <div className="space-y-12">
      {/* 제목 */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          진단서 발급 안내
        </h1>
      </section>

      {/* 안내 사항 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          발급 전 확인사항
        </h2>
        <div className="grid gap-6">
          {/* 1. 발급 권한 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                1
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  진단서 발급 권한
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  진단서 발급은 진료하고 계신 선생님의 고유 권한으로 발급됩니다.
                  <strong className="text-purple-900">
                    {" "}
                    저희 의원 명의로 발급되지 않습니다.
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* 2. 발급 일정 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                2
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  발급 일정 확정
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  진단서 발급을 위해서는 진료 후 선생님과 상의하셔서 발급 가능한
                  일자를 확정하신 후 발급받으시는 것을 추천드립니다.
                </p>
              </div>
            </div>
          </div>

          {/* 3. 초진 당일 발급 제한 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center flex-shrink-0">
                3
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  초진 당일 발급 제한
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  초진 당일에 정신과 진단이 들어간 진단서 발급은 어렵습니다.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                  <p className="text-yellow-900 text-sm leading-relaxed">
                    진단서 발급 자체는 가능하나, 정신과 진단이 나오지 않고 단순
                    검진 코드가 나갈 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 블로그 참고 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          진단서 발급이 까다로운 이유
        </h2>
        <p className="text-gray-600 mb-6">
          자세한 내용은 저희 네이버 블로그 포스팅을 참고해 주세요.
        </p>
        <div className="grid gap-4">
          {blogPosts.map((post) => (
            <a
              key={post.href}
              href={post.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col sm:flex-row hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className="sm:w-52 sm:h-auto h-48 relative flex-shrink-0">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="p-5 flex flex-col justify-center min-w-0">
                <p className="text-xs text-purple-600 font-medium mb-1">
                  네이버 블로그
                </p>
                <h3 className="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {post.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
