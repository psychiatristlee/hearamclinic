import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "해람정신건강의학과 소개",
  description:
    "서울 마포구 홍대입구역 정신건강의학과 - 의료진 소개, 진료시간, 위치 안내",
  alternates: { canonical: "https://hearam.kr/clinic" },
  openGraph: {
    type: "website",
    title: "해람정신건강의학과 소개",
    description:
      "서울 마포구 홍대입구역 정신건강의학과 - 8인의 전문의, 진료시간, 위치 안내",
    url: "https://hearam.kr/clinic",
    siteName: "해람정신건강의학과",
    locale: "ko_KR",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "해람정신건강의학과 로고" }],
  },
};

const clinicJsonLd = {
  "@context": "https://schema.org",
  "@type": "MedicalBusiness",
  name: "해람정신건강의학과",
  description:
    "서울 마포구 홍대입구역 정신건강의학과 - 우울증, 불안장애, ADHD, 불면증, 공황장애 등 정신건강 전문 진료",
  url: "https://hearam.kr/clinic",
  telephone: "02-498-2024",
  address: {
    "@type": "PostalAddress",
    streetAddress: "양화로 178 4층, 7층",
    addressLocality: "마포구",
    addressRegion: "서울특별시",
    postalCode: "04051",
    addressCountry: "KR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 37.5571,
    longitude: 126.9236,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "20:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "10:00",
      closes: "14:00",
    },
  ],
  medicalSpecialty: "Psychiatric",
  image: "https://hearam.kr/logo.png",
  priceRange: "$$",
};

const doctors = [
  {
    name: "김수영",
    role: "원장",
    photo: "/doctors/kim-sooyoung.webp",
    schedule: "월 · 화 · 목 · 토",
    credentials: [
      "연세대학교 원주의과대학 졸업",
      "가톨릭중앙의료원 정신건강의학과 전공의 수료",
      "정신건강의학과 전문의",
      "전) 오늘정신건강의학과 부원장",
      "한국정신분석학회 심층정신치료 고급과정 수료",
      "대한신경정신의학회 정회원",
      "대한정서인지행동의학회 평생회원",
    ],
  },
  {
    name: "장영진",
    role: "원장",
    photo: "/doctors/jang-youngjin.webp",
    schedule: "월 · 화 · 목 · 금 · 토",
    credentials: [
      "중앙대학교 의과대학 졸업",
      "가톨릭중앙의료원 정신건강의학과 전공의 수료",
      "정신건강의학과 전문의",
      "Netflix 자문의 (솔로지옥3, 피지컬100 2, 흑백요리사)",
      "성인 ADHD 진단·치료 Advanced 과정 수료",
      "심층정신치료 고급과정 이수중",
      "대한불안의학회",
    ],
  },
  {
    name: "김나령",
    role: "원장",
    photo: "/doctors/kim-naryeong.webp",
    schedule: "화 · 수 · 목 · 금 · 토",
    credentials: [
      "연세대학교 원주의과대학 졸업",
      "연세대 원주세브란스병원 정신건강의학과 전공의 수료",
      "정신건강의학과 전문의",
      "전) 해상병원 진료원장",
      "한국정신분석학회 정신치료 단기과정 수료",
      "심층정신치료 고급과정 이수중",
    ],
  },
  {
    name: "류재현",
    role: "원장",
    photo: "/doctors/ryu-jaehyun.webp",
    schedule: "월 · 수 · 목 · 금 · 토",
    credentials: [
      "중앙대학교 의과대학 졸업",
      "중앙대학교 대학원 정신과학 석사",
      "서울아산병원 인턴 및 전공의 수료",
      "서울대학교병원 정신건강의학과 전임의",
      "정신건강의학과 전문의",
      "전) 서울송정신건강의학과 진료원장",
      "2022년 대한조현병학회 최우수 논문상",
      "심층정신치료 고급과정 이수중",
    ],
  },
  {
    name: "노현재",
    role: "원장",
    photo: "/doctors/no-hyunjae.webp",
    schedule: "월 · 화 · 수 · 금",
    credentials: [
      "정신건강의학과 전문의",
      "수면의학인증의",
      "EMDR, ACT 인지치료 과정 수료",
      "국군대전병원, 국군원주병원 근무",
      "남수단 재건지원단",
      "코로나19 통합심리지원단",
      "Johns Hopkins, Wesleyan, Yale 국제교육 수료",
      "의료전문직업성교육 출간",
    ],
  },
  {
    name: "송민호",
    role: "원장",
    photo: "/doctors/song-minho.webp",
    schedule: "월 · 화 · 수 · 목",
    credentials: [
      "원광대학교 의과대학 졸업",
      "서울아산병원 인턴 및 정신건강의학과 전공의 수료",
      "정신건강의학과 전문의",
      "2022년 대한조울우울병학회 최우수 논문상",
      "심층정신치료 고급과정 이수중",
    ],
  },
  {
    name: "김혜영",
    role: "원장",
    photo: "/doctors/kim-hyeyoung.webp",
    schedule: "월 · 화 · 수 · 금",
    credentials: [
      "서울대학교 의과대학 졸업",
      "서울대학교병원 전공의 및 전임의 수료",
      "정신건강의학과 전문의 · 지도전문의",
      "전) 인하대학교병원 정신건강의학과 조교수",
      "심층정신치료 고급훈련과정 졸업",
    ],
  },
  {
    name: "이정석",
    role: "원장",
    photo: "/doctors/lee-jungsok.webp",
    schedule: "월 · 수 · 목 · 금 · 토",
    credentials: [
      "충남대학교 의과대학 졸업",
      "정신건강의학과 전문의",
      "산림청 디지털 헬스케어 연구개발과제 책임자",
      "ACT, EMDR 과정 수료",
    ],
  },
];

export default function ClinicPage() {
  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(clinicJsonLd) }}
      />
      {/* 클리닉 소개 */}
      <section className="text-center">
        <h1 className="text-3xl font-bold text-purple-900 mb-4">
          해람정신건강의학과
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          충분한 상담이 이루어질 수 있도록 예약제로 운영하고 있습니다.
        </p>
      </section>

      {/* 진료 시간 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">진료 시간</h2>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50 w-32">
                  평일
                </td>
                <td className="px-6 py-4 text-gray-700">
                  오전 10:00 ~ 오후 8:00
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">
                  토요일
                </td>
                <td className="px-6 py-4 text-gray-700">
                  오전 10:00 ~ 오후 2:00
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">
                  휴진
                </td>
                <td className="px-6 py-4 text-gray-500">
                  일요일 · 공휴일 · 대체공휴일
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 의료진 소개 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">의료진 소개</h2>
        <div className="grid gap-6">
          {doctors.map((doc) => (
            <div
              key={doc.name}
              className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col sm:flex-row gap-6"
            >
              {/* 사진 */}
              <div className="flex-shrink-0 flex flex-col items-center sm:items-start">
                {doc.photo ? (
                  <Image
                    src={doc.photo}
                    alt={`${doc.name} ${doc.role}`}
                    width={140}
                    height={140}
                    className="rounded-xl object-cover w-[140px] h-[140px]"
                  />
                ) : (
                  <div className="w-[140px] h-[140px] rounded-xl bg-purple-50 flex items-center justify-center">
                    <span className="text-4xl text-purple-300">👤</span>
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {doc.name}
                  </h3>
                  <span className="text-sm text-purple-600 font-medium">
                    {doc.role}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3">
                  진료일: {doc.schedule}
                </p>
                <ul className="space-y-1">
                  {doc.credentials.map((cred, i) => (
                    <li key={i} className="text-sm text-gray-600 flex gap-2">
                      <span className="text-purple-400 flex-shrink-0">·</span>
                      {cred}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 안내사항 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">안내사항</h2>
        <div className="grid gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">주차 안내</h3>
            <ul className="text-sm text-gray-600 leading-relaxed space-y-1.5">
              <li>건물 내 기계식 주차장이 있습니다.</li>
              <li>승용차량 이외는 주차가 불가합니다. (SUV, RV, 승합차량 불가)</li>
              <li>기계식 주차장 앞에 주차하시고 들어오시면 안 됩니다. 관리인이 안 보이더라도 대기 후 주차하셔야 합니다. (건물 내 다른 분들 출차가 불가능합니다)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 안내 페이지 바로가기 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">안내 바로가기</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/clinic/diagnosis-info"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
          >
            <h3 className="font-bold text-gray-900 mb-1">진단서 발급</h3>
            <p className="text-sm text-gray-500">
              진단서 발급에 관한 안내사항
            </p>
          </Link>
          <Link
            href="/clinic/fees"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
          >
            <h3 className="font-bold text-gray-900 mb-1">비급여진료비용 안내</h3>
            <p className="text-sm text-gray-500">
              진단서, 심리검사 등 비급여 항목별 비용
            </p>
          </Link>
          <Link
            href="/clinic/prescriptions-info"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
          >
            <h3 className="font-bold text-gray-900 mb-1">대리처방 서류 안내</h3>
            <p className="text-sm text-gray-500">
              대리처방 시 필요 서류 및 양식 다운로드
            </p>
          </Link>
          <Link
            href="/clinic/medical-records-info"
            className="bg-white border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
          >
            <h3 className="font-bold text-gray-900 mb-1">진료기록사본 안내</h3>
            <p className="text-sm text-gray-500">
              진료기록 발급 안내 및 동의서·위임장 양식
            </p>
          </Link>
        </div>
      </section>

      {/* 위치 */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">오시는 길</h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="font-medium text-gray-900 mb-2">
            서울특별시 마포구 양화로 178 4층, 7층
          </p>
          <p className="text-sm text-gray-600">
            홍대입구역 4번 출구 · 스타벅스 홍대공항철도역점 건물
          </p>
        </div>
      </section>
    </div>
  );
}
