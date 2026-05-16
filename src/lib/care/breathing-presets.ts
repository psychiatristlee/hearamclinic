export interface BreathingStep {
  label: string;
  instruction: string;
  seconds: number;
}

export interface BreathingPreset {
  slug: string;
  emoji: string;
  title: string;
  tagline: string; // 짧은 한 줄 (카드용)
  technique: string; // 학술/공식 명칭
  intro: string;
  steps: BreathingStep[];
  totalSeconds: number;
  afterCare: string;
  /** 추천 상황 (카드 부가 정보) */
  recommendedFor: string[];
}

export const BREATHING_PRESETS: BreathingPreset[] = [
  {
    slug: "4-7-8",
    emoji: "🌙",
    title: "4-7-8 호흡",
    tagline: "긴장을 풀고 잠들기 좋은 호흡",
    technique: "4-7-8 호흡 (Dr. Andrew Weil)",
    intro:
      "4초 들이쉬고 7초 멈춘 후 8초 동안 천천히 내쉬는 호흡입니다. 부교감 신경을 활성화해 마음을 가라앉히는 데 가장 빠른 효과를 보이는 기법 중 하나로, 잠들기 전이나 강한 긴장을 풀어내실 때 권합니다.",
    steps: [
      { label: "준비", instruction: "편안한 자세로 앉으시거나 누우시고, 혀끝을 위 앞니 뒤쪽 잇몸에 가볍게 대 주세요.", seconds: 10 },
      { label: "내쉬기", instruction: "입을 통해 \"후\" 소리를 내며 폐 안 공기를 모두 내쉽니다.", seconds: 4 },
      { label: "들이쉬기", instruction: "입을 닫고 코로 4초 동안 천천히 들이쉬세요.", seconds: 4 },
      { label: "멈추기", instruction: "숨을 7초 동안 부드럽게 멈추어 둡니다.", seconds: 7 },
      { label: "내쉬기", instruction: "입으로 \"후\" 소리를 내며 8초에 걸쳐 길게 내쉬세요.", seconds: 8 },
      { label: "들이쉬기", instruction: "다시 코로 4초 들이쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "7초 동안 멈춥니다.", seconds: 7 },
      { label: "내쉬기", instruction: "8초에 걸쳐 길게 내쉬세요.", seconds: 8 },
      { label: "들이쉬기", instruction: "마지막으로 코로 4초 들이쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "7초 동안 멈춥니다.", seconds: 7 },
      { label: "내쉬기", instruction: "8초에 걸쳐 천천히 내쉬며 마무리합니다.", seconds: 8 },
    ],
    totalSeconds: 79,
    afterCare:
      "잠시 자연스러운 호흡으로 돌아오시고, 가슴과 어깨의 긴장이 풀린 정도를 가만히 알아차려 보세요. 부족하시면 한두 사이클 더 반복하셔도 좋습니다.",
    recommendedFor: ["잠들기 전", "강한 불안", "심박이 빠를 때"],
  },
  {
    slug: "box",
    emoji: "🟦",
    title: "박스 호흡",
    tagline: "네 박자로 균형을 잡는 호흡",
    technique: "박스 호흡 (Box Breathing, 4-4-4-4)",
    intro:
      "들이쉬기 4초, 멈추기 4초, 내쉬기 4초, 멈추기 4초의 네 박자를 반복합니다. 미군 특수부대도 사용하는 평정심 기법으로, 발표·면접 등 긴장된 순간에 빠르게 집중을 회복하는 데 좋습니다.",
    steps: [
      { label: "준비", instruction: "허리를 세우고 어깨에서 힘을 빼주세요.", seconds: 10 },
      { label: "들이쉬기", instruction: "코로 4초 동안 깊고 고르게 들이쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "4초 동안 부드럽게 멈춥니다.", seconds: 4 },
      { label: "내쉬기", instruction: "입이나 코로 4초 동안 일정하게 내쉬세요.", seconds: 4 },
      { label: "멈추기", instruction: "4초 동안 멈춥니다.", seconds: 4 },
      { label: "들이쉬기", instruction: "다시 4초 들이쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "4초 멈춥니다.", seconds: 4 },
      { label: "내쉬기", instruction: "4초 내쉬세요.", seconds: 4 },
      { label: "멈추기", instruction: "4초 멈춥니다.", seconds: 4 },
      { label: "들이쉬기", instruction: "마지막 사이클을 4초 들이쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "4초 멈춥니다.", seconds: 4 },
      { label: "내쉬기", instruction: "4초 내쉽니다.", seconds: 4 },
      { label: "멈추기", instruction: "4초 멈추며 마무리합니다.", seconds: 4 },
    ],
    totalSeconds: 58,
    afterCare:
      "네 박자의 안정된 리듬이 몸에 남아 있는 감각을 잠시 음미해 보세요. 집중력이 필요한 활동을 이어서 하시기에 좋습니다.",
    recommendedFor: ["발표 직전", "집중이 필요할 때", "감정이 격해질 때"],
  },
  {
    slug: "diaphragm",
    emoji: "🌊",
    title: "횡격막 호흡",
    tagline: "배로 깊고 느리게 호흡하기",
    technique: "복식(횡격막) 호흡 (Diaphragmatic Breathing)",
    intro:
      "가슴이 아닌 배를 부풀리며 깊게 호흡하는 기법입니다. 평소 얕은 가슴 호흡으로 굳어진 몸을 풀어 주고, 만성 불안과 과호흡 증상 완화에 도움이 됩니다.",
    steps: [
      { label: "준비", instruction: "한 손은 가슴, 한 손은 배에 두세요. 가슴 손은 거의 움직이지 않게 하시면 됩니다.", seconds: 12 },
      { label: "들이쉬기", instruction: "코로 4초 천천히 들이쉬며 배가 부풀어 오르는 것을 손으로 느껴 보세요.", seconds: 4 },
      { label: "내쉬기", instruction: "입을 살짝 모아 6초에 걸쳐 길게 내쉬며 배가 들어가는 것을 느낍니다.", seconds: 6 },
      { label: "들이쉬기", instruction: "다시 4초 들이쉬며 배를 부풀립니다.", seconds: 4 },
      { label: "내쉬기", instruction: "6초에 걸쳐 천천히 내쉽니다.", seconds: 6 },
      { label: "들이쉬기", instruction: "4초 들이쉽니다.", seconds: 4 },
      { label: "내쉬기", instruction: "6초 내쉽니다.", seconds: 6 },
      { label: "들이쉬기", instruction: "4초 들이쉽니다.", seconds: 4 },
      { label: "내쉬기", instruction: "6초에 걸쳐 천천히 내쉬며 마무리합니다.", seconds: 6 },
    ],
    totalSeconds: 52,
    afterCare:
      "어깨와 목의 긴장이 어느 정도 풀렸는지 살펴보세요. 하루 중 몇 번이고 짬을 내어 반복하시면 만성 긴장을 풀어 주는 좋은 습관이 됩니다.",
    recommendedFor: ["만성 긴장", "가슴 답답함", "과호흡"],
  },
  {
    slug: "coherent",
    emoji: "🍃",
    title: "5-5 호흡",
    tagline: "일정한 리듬으로 균형 잡기",
    technique: "응집 호흡 (Coherent Breathing, 6 breaths/min)",
    intro:
      "5초 들이쉬고 5초 내쉬는 일정한 리듬으로 분당 6회를 유지합니다. 심박변이도(HRV)를 개선하고 자율신경의 균형을 회복시키는 호흡 패턴으로 알려져 있습니다.",
    steps: [
      { label: "준비", instruction: "편안한 자세에서 자연스럽게 호흡합니다.", seconds: 10 },
      { label: "들이쉬기", instruction: "코로 5초 천천히 들이쉽니다.", seconds: 5 },
      { label: "내쉬기", instruction: "5초에 걸쳐 부드럽게 내쉽니다.", seconds: 5 },
      { label: "들이쉬기", instruction: "5초 들이쉽니다.", seconds: 5 },
      { label: "내쉬기", instruction: "5초 내쉽니다.", seconds: 5 },
      { label: "들이쉬기", instruction: "5초 들이쉽니다.", seconds: 5 },
      { label: "내쉬기", instruction: "5초 내쉽니다.", seconds: 5 },
      { label: "들이쉬기", instruction: "5초 들이쉽니다.", seconds: 5 },
      { label: "내쉬기", instruction: "5초 내쉽니다.", seconds: 5 },
      { label: "들이쉬기", instruction: "5초 들이쉽니다.", seconds: 5 },
      { label: "내쉬기", instruction: "5초에 걸쳐 부드럽게 내쉬며 마무리합니다.", seconds: 5 },
    ],
    totalSeconds: 60,
    afterCare:
      "리듬이 몸에 익으면 5분, 10분으로 시간을 늘려 가셔도 좋습니다. 매일 같은 시간에 짧게라도 반복하시는 것이 가장 효과적입니다.",
    recommendedFor: ["일상 습관화", "심박 안정", "감정 평정"],
  },
  {
    slug: "physiological-sigh",
    emoji: "💨",
    title: "한숨 호흡",
    tagline: "두 번 들이쉬고 길게 내쉬기",
    technique: "생리적 한숨 (Physiological Sigh, Huberman)",
    intro:
      "코로 짧게 두 번 들이쉰 뒤 입으로 길게 내쉬는 가장 빠른 긴장 완화 호흡입니다. 폐포를 활짝 열고 이산화탄소를 효율적으로 배출해 한두 사이클만으로도 즉각적인 진정 효과가 나타납니다.",
    steps: [
      { label: "준비", instruction: "편안한 자세를 잡으세요.", seconds: 5 },
      { label: "들이쉬기 1", instruction: "코로 짧게 깊게 들이쉽니다.", seconds: 2 },
      { label: "들이쉬기 2", instruction: "코로 한 번 더 짧게 추가로 들이쉬어 폐를 가득 채웁니다.", seconds: 2 },
      { label: "내쉬기", instruction: "입으로 천천히 길게 내쉬세요.", seconds: 8 },
      { label: "휴식", instruction: "잠시 자연스럽게 호흡합니다.", seconds: 4 },
      { label: "들이쉬기 1", instruction: "코로 짧게 들이쉽니다.", seconds: 2 },
      { label: "들이쉬기 2", instruction: "한 번 더 들이쉽니다.", seconds: 2 },
      { label: "내쉬기", instruction: "입으로 길게 내쉽니다.", seconds: 8 },
      { label: "휴식", instruction: "자연스럽게 호흡합니다.", seconds: 4 },
      { label: "들이쉬기 1", instruction: "코로 짧게 들이쉽니다.", seconds: 2 },
      { label: "들이쉬기 2", instruction: "한 번 더 들이쉽니다.", seconds: 2 },
      { label: "내쉬기", instruction: "입으로 천천히 내쉬며 마무리합니다.", seconds: 8 },
    ],
    totalSeconds: 49,
    afterCare:
      "단 한 사이클로도 효과를 보실 수 있는 응급 호흡입니다. 긴장이 갑자기 올라올 때 언제든 짧게 활용하세요.",
    recommendedFor: ["갑작스러운 긴장", "공황 초기 신호", "즉각적 진정"],
  },
  {
    slug: "alternate-nostril",
    emoji: "🧘",
    title: "교호 호흡",
    tagline: "좌우 콧구멍으로 번갈아 호흡",
    technique: "교호 호흡 (Nadi Shodhana)",
    intro:
      "한쪽 콧구멍을 손가락으로 가볍게 막은 채 번갈아 호흡합니다. 좌우 균형을 잡고 마음을 가라앉히는 전통 요가 호흡 기법으로, 명상 전 준비 호흡으로도 자주 사용됩니다.",
    steps: [
      { label: "준비", instruction: "허리를 세우고 오른손 엄지로 오른쪽 콧구멍을 가볍게 막을 준비를 합니다.", seconds: 10 },
      { label: "왼쪽 들이쉬기", instruction: "오른쪽 콧구멍을 막고 왼쪽 콧구멍으로 4초 들이쉽니다.", seconds: 4 },
      { label: "전환", instruction: "약지로 왼쪽 콧구멍을 막고 오른쪽 콧구멍을 엽니다.", seconds: 2 },
      { label: "오른쪽 내쉬기", instruction: "오른쪽 콧구멍으로 6초 천천히 내쉬세요.", seconds: 6 },
      { label: "오른쪽 들이쉬기", instruction: "그대로 오른쪽 콧구멍으로 4초 들이쉽니다.", seconds: 4 },
      { label: "전환", instruction: "엄지로 오른쪽을 막고 약지를 떼서 왼쪽을 엽니다.", seconds: 2 },
      { label: "왼쪽 내쉬기", instruction: "왼쪽 콧구멍으로 6초 내쉽니다.", seconds: 6 },
      { label: "왼쪽 들이쉬기", instruction: "왼쪽 콧구멍으로 4초 들이쉽니다.", seconds: 4 },
      { label: "전환", instruction: "왼쪽을 막고 오른쪽을 엽니다.", seconds: 2 },
      { label: "오른쪽 내쉬기", instruction: "오른쪽 콧구멍으로 6초 내쉬며 마무리합니다.", seconds: 6 },
    ],
    totalSeconds: 46,
    afterCare:
      "양손을 무릎에 편안히 내려놓고, 좌우의 호흡 감각이 어떻게 다른지 잠시 알아차려 보세요.",
    recommendedFor: ["명상 시작 전", "정신 산만", "균형 회복"],
  },
];

export function findBreathingPreset(slug: string): BreathingPreset | undefined {
  return BREATHING_PRESETS.find((p) => p.slug === slug);
}
