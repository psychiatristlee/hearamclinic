import { EnneaType } from "./questions";

export interface EnneagramType {
  number: EnneaType;
  name: string; // 한국어 이름
  englishName: string;
  tagline: string;
  coreMotivation: string;
  coreFear: string;
  summary: string;
  strengths: string[];
  challenges: string[];
}

export const TYPES: Record<EnneaType, EnneagramType> = {
  1: {
    number: 1,
    name: "개혁가",
    englishName: "The Reformer",
    tagline: "원칙과 정의로 더 나은 세상을 만드는 사람",
    coreMotivation: "옳고 좋은 일을 하고, 자기 자신과 세상을 더 나은 모습으로 가꾸려는 동기",
    coreFear: "결함이 있거나, 잘못되거나, 타락할까 봐 두려워하는 마음",
    summary:
      "분명한 가치관과 도덕적 기준으로 자신을 세우시고, 일에서 완성도를 끝까지 추구하시는 유형입니다. 책임감이 강해 주변에 신뢰를 주시지만, 본인에게 가장 엄격하기 때문에 가끔 스스로를 너무 다그치실 수 있습니다.",
    strengths: ["원칙을 지키는 책임감", "세부 사항을 놓치지 않는 꼼꼼함", "더 나은 방향에 대한 분명한 비전"],
    challenges: ["완벽함에 대한 압박과 자기 비판", "다른 사람을 향한 비판적인 시선", "긴장과 분노를 안으로 삭이는 경향"],
  },
  2: {
    number: 2,
    name: "조력가",
    englishName: "The Helper",
    tagline: "사람의 마음을 따뜻하게 데우는 든든한 동반자",
    coreMotivation: "사랑받고 인정받기 위해 다른 사람에게 필요한 존재가 되고자 하는 동기",
    coreFear: "사랑받지 못하거나 가치 없는 사람으로 여겨질까 봐 두려워하는 마음",
    summary:
      "사람의 감정에 섬세하게 반응하시고, 도움이 필요할 때 가장 먼저 손을 내미시는 유형입니다. 따뜻한 마음으로 관계를 가꾸시지만, 본인의 욕구를 뒤로 미루다가 정작 자신이 지치실 수 있습니다.",
    strengths: ["깊은 공감과 따뜻한 배려", "관계를 부드럽게 만드는 능력", "타인의 필요를 빠르게 알아챔"],
    challenges: ["자기 욕구를 인정하기 어려워함", "거절을 어려워해 과부하가 누적됨", "도움이 인정받지 못할 때 서운함"],
  },
  3: {
    number: 3,
    name: "성취자",
    englishName: "The Achiever",
    tagline: "목표를 향해 효율적으로 달리는 추진가",
    coreMotivation: "가치 있는 사람으로 인정받기 위해 성공하고자 하는 동기",
    coreFear: "가치 없거나 무능한 사람으로 비춰질까 봐 두려워하는 마음",
    summary:
      "분명한 목표를 세우고 빠르게 성과를 만들어 내시는 유형입니다. 적응력이 뛰어나고 자신을 효과적으로 표현하시지만, 결과에만 집중하다 보면 자신의 진짜 감정이 무엇인지 놓치실 수 있습니다.",
    strengths: ["뛰어난 추진력과 실행력", "상황에 맞춘 빠른 적응", "자기 표현과 동기 부여 능력"],
    challenges: ["성과가 곧 자기 가치라고 느낄 위험", "감정과 휴식을 미루는 경향", "이미지에 신경을 많이 씀"],
  },
  4: {
    number: 4,
    name: "예술가",
    englishName: "The Individualist",
    tagline: "감정의 깊이로 자기만의 색을 그려내는 사람",
    coreMotivation: "자기만의 정체성과 의미를 찾고 표현하려는 동기",
    coreFear: "정체성이 없거나 평범하게 사라질까 봐 두려워하는 마음",
    summary:
      "감정의 결을 섬세하게 느끼시고, 그 안에서 자기만의 의미를 찾아 표현하시는 유형입니다. 깊이 있는 감수성과 진정성이 강점이지만, 부족함과 결핍감에 자주 머무르실 수 있습니다.",
    strengths: ["풍부한 감수성과 창의성", "진정성 있는 자기 표현", "타인의 깊은 감정을 이해하는 능력"],
    challenges: ["우울감과 자기 연민에 빠지기 쉬움", "감정 기복이 큰 편", "비교와 결핍의 시선"],
  },
  5: {
    number: 5,
    name: "탐구자",
    englishName: "The Investigator",
    tagline: "고요한 몰입으로 깊이 있는 통찰을 만드는 사람",
    coreMotivation: "유능하고 자립적인 존재가 되어 세상을 이해하려는 동기",
    coreFear: "무능하거나 압도당하거나 자원이 부족할까 봐 두려워하는 마음",
    summary:
      "관심 분야를 깊이 파고드시고, 사색과 분석을 통해 고유한 통찰을 만드시는 유형입니다. 자립적이고 객관적이지만, 감정과 사람으로부터 거리를 두는 경향이 있어 친밀한 관계가 어려울 수 있습니다.",
    strengths: ["깊이 있는 사고와 통찰력", "객관성과 자립성", "복잡한 정보를 다루는 능력"],
    challenges: ["감정 표현과 친밀감의 어려움", "에너지 보존을 위해 관계에서 후퇴", "지적 자원에 대한 불안"],
  },
  6: {
    number: 6,
    name: "충성가",
    englishName: "The Loyalist",
    tagline: "신뢰와 안전을 지키는 책임감 있는 동반자",
    coreMotivation: "안전과 지지를 얻기 위해 신뢰할 수 있는 관계와 시스템을 추구하는 동기",
    coreFear: "지지 없이 혼자 위험에 노출될까 봐 두려워하는 마음",
    summary:
      "위험과 변수를 미리 점검하시고, 신뢰하는 관계 안에서 깊이 헌신하시는 유형입니다. 책임감이 강하지만, 의심과 걱정으로 결정이 늦어지거나 마음이 흔들리실 수 있습니다.",
    strengths: ["뛰어난 위험 감지와 준비성", "신뢰 관계에 대한 헌신", "팀의 안전망 역할"],
    challenges: ["걱정과 의심이 많은 편", "결정에 시간이 오래 걸림", "권위에 대한 양가감정"],
  },
  7: {
    number: 7,
    name: "낙천가",
    englishName: "The Enthusiast",
    tagline: "가능성과 즐거움으로 세상을 채우는 모험가",
    coreMotivation: "행복과 만족을 얻기 위해 다양한 경험과 자극을 추구하는 동기",
    coreFear: "고통, 결핍, 권태에 갇힐까 봐 두려워하는 마음",
    summary:
      "새로운 경험과 가능성에 열려 있으시고, 어디에서든 즐거움을 찾으시는 유형입니다. 활기와 다재다능함이 매력이지만, 부정적인 감정과 깊이 있는 마무리를 회피하실 수 있습니다.",
    strengths: ["밝은 에너지와 회복력", "다재다능한 호기심", "기회를 빠르게 알아보는 직관"],
    challenges: ["불편한 감정의 회피", "한 가지에 집중하는 데 어려움", "충동적인 결정과 산만함"],
  },
  8: {
    number: 8,
    name: "도전가",
    englishName: "The Challenger",
    tagline: "강한 의지로 자기와 사람들을 지키는 보호자",
    coreMotivation: "통제력과 영향력을 가지고 자기 자신과 가까운 사람을 보호하려는 동기",
    coreFear: "통제당하거나 약자로 휘둘릴까 봐 두려워하는 마음",
    summary:
      "분명한 의지와 추진력으로 자기 길을 만드시고, 약한 사람을 지키려는 강한 책임감을 가진 유형입니다. 진솔하고 결단력 있지만, 부드러움을 보이는 데 어려움을 느끼실 수 있습니다.",
    strengths: ["강한 추진력과 결단력", "정의를 지키려는 의지", "어려운 상황에서의 리더십"],
    challenges: ["부드러움과 취약함을 드러내기 어려움", "직접적인 표현이 사람을 압박할 수 있음", "분노 조절"],
  },
  9: {
    number: 9,
    name: "평화주의자",
    englishName: "The Peacemaker",
    tagline: "조화와 평온으로 사람들을 이어주는 사람",
    coreMotivation: "내적·외적 평화와 조화를 유지하려는 동기",
    coreFear: "갈등으로 단절되거나 본인을 잃어버릴까 봐 두려워하는 마음",
    summary:
      "갈등을 부드럽게 풀어내시고, 다양한 입장을 균형 있게 이해하시는 유형입니다. 따뜻한 안정감을 주시지만, 본인의 의견과 욕구를 표현하지 않다가 무기력해지실 수 있습니다.",
    strengths: ["조화롭고 수용적인 태도", "다양한 입장을 통합하는 시야", "변치 않는 안정감"],
    challenges: ["자기 의견을 표현하기 어려움", "결정을 미루는 경향", "수동성과 무기력"],
  },
};

// 캐릭터 이미지 URL (Firebase Storage 공개 객체)
export function characterImageUrl(num: EnneaType): string {
  return `https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fenneagram%2Ftype-${num}.png?alt=media`;
}
