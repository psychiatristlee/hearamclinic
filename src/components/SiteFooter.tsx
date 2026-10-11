import Link from "next/link";
import NaverMap from "@/components/NaverMap";
import { IconArrowUpRight, IconClock, IconMapPin, IconPhone } from "@/components/icons";

const BOOKING_URL = "https://naver.me/Fy2FWU9A";

const footerLinks = [
  { label: "진단서 발급", href: "/clinic/diagnosis-info" },
  { label: "비급여 비용", href: "/clinic/fees" },
  { label: "대리처방", href: "/clinic/prescriptions-info" },
  { label: "진료기록사본", href: "/clinic/medical-records-info" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-purple-100 bg-gradient-to-b from-purple-50/60 to-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 네이버 지도 */}
          <div className="surface overflow-hidden">
            <NaverMap />
          </div>

          {/* 예약 + 클리닉 정보 */}
          <div className="flex flex-col gap-4">
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="surface surface-hover card-lift group block p-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 shrink-0 rounded-xl bg-[#03C75A] text-white flex items-center justify-center shadow-sm">
                  <span className="font-black text-2xl leading-none">N</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900">네이버 예약</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    원하는 시간에 바로 예약하기
                  </p>
                </div>
                <IconArrowUpRight className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-purple-700 transition-colors" />
              </div>
            </a>

            <dl className="surface p-5 text-sm space-y-3">
              <div className="flex gap-3">
                <dt className="sr-only">주소</dt>
                <IconMapPin className="w-5 h-5 shrink-0 text-purple-500" />
                <dd className="text-gray-700">
                  서울특별시 마포구 양화로 178 4층, 7층
                  <span className="block text-gray-500 mt-0.5">
                    홍대입구역 4번 출구 · 스타벅스 홍대공항철도역점 건물
                  </span>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="sr-only">전화</dt>
                <IconPhone className="w-5 h-5 shrink-0 text-purple-500" />
                <dd>
                  <a
                    href="tel:0507-1352-8189"
                    className="font-medium text-gray-900 hover:text-purple-800 hover:underline underline-offset-2"
                  >
                    0507-1352-8189
                  </a>
                </dd>
              </div>
              <div className="flex gap-3">
                <dt className="sr-only">진료 시간</dt>
                <IconClock className="w-5 h-5 shrink-0 text-purple-500" />
                <dd className="text-gray-700">
                  평일 10:00 – 20:00 · 토요일 10:00 – 14:00
                  <span className="block text-gray-500 mt-0.5">일요일 · 공휴일 휴진 · 예약제 운영</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-purple-100/80 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} 해람정신건강의학과</p>
          <nav aria-label="안내 문서" className="flex flex-wrap gap-x-4 gap-y-1">
            {footerLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-purple-800 hover:underline underline-offset-2">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
