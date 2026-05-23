/**
 * 성격 검사 SEO 유입 타겟 블로그 5종 + 이미지 생성.
 *
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/create-personality-seo-blogs.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {randomUUID} from "crypto";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

const PROJECT_ID = "hearamclinic-ef507";
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENAI_API_KEY 필요");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});

const ai = genkit({
  plugins: [googleAI({apiKey})],
  promptDir: "./lib/features",
});

interface BlogDraft {
  slug: string;
  title: string;
  content: string;
  category: string;
}

const posts: BlogDraft[] = [
  // 1) 우산 키워드: 무료 성격 검사 모음/추천
  {
    slug: "free-personality-test-recommendations-2026",
    title: "무료 성격 검사 추천 5선: Big 5·에니어그램·애착·DISC, 무엇이 다를까?",
    category: "성격",
    content: `요즘 MBTI가 다시 유행이 되면서 "MBTI 말고 다른 성격 검사도 해보고 싶다"는 분들이 많아지셨어요. 무료로 받을 수 있는 성격 검사가 워낙 많다 보니 어떤 걸 골라야 할지 막막하실 텐데요. 이 글에서는 정신건강의학과 진료실 관점에서 신뢰할 만한 무료 성격 검사 4가지와 각각이 어떤 결을 다루는지 정리해 드릴게요.

## MBTI 말고 다른 성격 검사가 필요한 이유

MBTI는 빠르고 직관적이라 매력이 있지만 학술적 신뢰도와 재검사 안정성이 낮다는 지적이 꾸준해요. 같은 사람이 시기를 달리해서 검사하면 결과가 자주 바뀌고, 16개 유형이 너무 단순한 이분법으로 사람을 묶는다는 한계가 있지요.

그래서 학계와 임상에서는 Big 5(빅5), 에니어그램, 애착 유형, DISC 같은 다른 모델을 더 자주 활용한답니다. 모델마다 보는 결이 다르기 때문에 한 가지로 본인을 단정하지 마시고 여러 각도에서 살펴보시는 게 좋아요.

## Big 5 성격 검사 — 가장 과학적으로 검증된 모델

Big 5는 1980년대 이후 학계에서 가장 폭넓게 검증된 성격 모델이에요. 개방성(O), 성실성(C), 외향성(E), 친화성(A), 정서 민감성(N)의 다섯 차원으로 사람을 살피지요. 각 차원은 0에서 100까지 연속적인 점수라서 "내향형 vs 외향형" 같은 이분법이 아니라 "외향성이 어느 정도인지"를 알려 줍니다.

각 차원의 높낮이 조합으로 32유형이 나오는데, 본인이 어떤 유형에 가까운지 + 5축 레이더 차트로 한눈에 보실 수 있답니다. 가장 신뢰할 만한 무료 성격 검사를 찾으시는 분께 가장 먼저 추천드려요.

[해람정신건강의학과 무료 Big 5 검사 바로가기](/personality/big5)

## 에니어그램 — 핵심 동기와 두려움 분석

에니어그램은 1번 개혁가부터 9번 평화주의자까지 9개 유형으로 사람을 보는 모델이에요. Big 5와 다른 점은 "왜 이렇게 행동하는가"라는 마음 깊은 곳의 동기와 두려움까지 살핀다는 거예요.

같은 꼼꼼한 사람이라도 1번은 "옳음을 지키려는 동기"에서 그렇게 하고, 3번은 "유능하게 보이려는 동기"에서 그렇게 하지요. 표면 행동은 비슷해도 마음의 동력이 다르면 스트레스 패턴도 달라집니다. 본인의 깊은 동기를 들여다보고 싶으신 분께 좋아요.

[해람정신건강의학과 무료 에니어그램 검사 바로가기](/personality/enneagram)

## 애착 유형 검사 — 관계 패턴의 거울

연애나 가까운 관계에서 본인이 어떤 패턴을 반복하시는지 궁금하셨다면 성인 애착 유형 검사를 추천드려요. 어린 시절의 양육 경험이 어른이 된 후의 관계 방식에 영향을 준다는 것이 정설인데, 그 방식을 4가지 유형으로 정리한 게 애착 유형 모델이에요.

불안과 회피라는 두 축으로 안정형·헌신형(불안)·자립형(회피)·양가형(혼란) 4가지를 살피지요. 이별을 자꾸 같은 방식으로 반복하시거나 가까워질수록 답답해지신다면 한 번 점검해 보시면 좋답니다.

[해람정신건강의학과 무료 애착 유형 검사 바로가기](/personality/attachment)

## DISC — 직장과 팀 관계 분석

DISC는 직장과 팀 안에서의 행동 양식을 빠르게 보는 모델이에요. 주도형(D), 사교형(I), 안정형(S), 신중형(C) 4가지로 본인이 어떤 결로 일하시는지를 알려 주지요.

같은 미팅에 들어가도 D는 결정을 빠르게 내리고, I는 분위기를 띄우며, S는 한 발 물러나 듣고, C는 자료를 꼼꼼히 챙기는 식으로 행동이 달라요. 이 차이를 알면 팀 안에서의 갈등을 한결 부드럽게 풀 수 있답니다.

[해람정신건강의학과 무료 DISC 검사 바로가기](/personality/disc)

## 4가지를 한 번에 받는 AI 종합 보고서

네 가지 검사를 다 받기가 부담스러우시거나, 통합된 한 장의 프로필을 원하시면 해람검사실의 종합 성격 보고서를 추천드려요. 4가지 검사를 순차로 안내해 드리고, 모두 마치시면 AI가 결과를 통합 분석해 한 사람의 다면적 프로필로 정리해 드립니다.

검사들이 서로 어떻게 일치하고 보완되는지, 강점과 성장의 방향, 관계와 일의 패턴까지 한 번에 보실 수 있어요.

[AI 종합 성격 보고서 시작하기](/personality/report)

## 마치며

성격 검사는 본인을 한 가지 유형으로 단정하는 라벨이 아니라 본인을 더 잘 이해하시는 거울이에요. 한 가지 검사로만 본인을 결론짓지 마시고 여러 각도에서 살펴보시면 마음의 결이 한결 분명해진답니다. 모두 무료이고 가입 없이도 검사를 받으실 수 있으니 편하게 진행해 보세요.
`,
  },

  // 2) Big 5 키워드
  {
    slug: "big5-personality-test-free-online",
    title: "Big 5 성격 검사 무료로 받는 법: 5요인 모델 완전 가이드",
    category: "성격",
    content: `Big 5(빅5) 성격 검사는 심리학계에서 가장 신뢰받는 성격 모델이에요. 학술 논문 수천 편에서 검증된 모델이라 임상과 연구 모두에서 표준으로 자리잡았지요. 이 글에서는 Big 5가 무엇이고, 무료로 어디서 받으실 수 있는지, 결과를 어떻게 해석하시면 좋은지 안내해 드릴게요.

## Big 5 모델, 왜 5가지 차원인가요

Big 5의 출발은 의외로 1930년대 어휘 가설에서 시작됐어요. 사람이 서로의 성격을 묘사할 때 쓰는 단어들을 모아 통계적으로 분석하면 본질적인 성격 차원이 드러난다는 발상이었지요. 1980년대 코스타와 매크레이 박사 등의 연구를 거치며 다섯 가지 큰 차원이 어느 문화권에서나 안정적으로 나타나는 게 확인됐답니다.

다섯 차원은 다음과 같아요. **개방성(Openness)**은 새로운 경험과 추상적 사고에 얼마나 열려 있는지, **성실성(Conscientiousness)**은 계획성과 자기 조절 능력, **외향성(Extraversion)**은 사회적 자극에서 에너지를 얻는 정도, **친화성(Agreeableness)**은 타인에 대한 공감과 협력의 경향, **정서 민감성(Neuroticism)**은 감정의 결이 얼마나 쉽게 흔들리는지를 봐요. 영문 머리글자를 따 OCEAN이라고 부르기도 하지요.

## MBTI와 무엇이 다른가요

가장 큰 차이는 **연속적인 점수**라는 점이에요. MBTI는 외향형 아니면 내향형이라는 이분법인 반면, Big 5는 외향성이 0에서 100까지의 점수로 나옵니다. 그래서 "내향성 25점인 외향인"이나 "외향성 65점인 외향인"처럼 같은 범주 안에서도 정도를 구분할 수 있어요.

또 재검사 안정성이 훨씬 높답니다. 같은 사람을 몇 달 뒤 다시 검사해도 점수가 거의 비슷하게 나오지요. 학계가 Big 5를 표준으로 삼은 이유 중 하나예요.

## 무료 Big 5 검사, 어디서 받을 수 있나요

해람정신건강의학과 검사실에서 무료로 받으실 수 있어요. 가입이나 결제 없이 바로 검사 가능하고, 약 6분 안에 마치실 수 있답니다.

검사 결과로는 5차원의 레이더 차트, 차원별 백분위 점수, 32유형 중 본인 유형, 캐릭터 일러스트, 강점과 성장 방향까지 자세한 해석을 받으실 수 있어요. 로그인하시면 결과가 본인 계정에 저장되어 다음에 다시 검사하실 때 점수 변화 추세도 보실 수 있답니다.

[해람검사실의 무료 Big 5 성격 검사 바로가기](/personality/big5)

## 차원별 결과는 어떻게 해석할까요

가장 중요한 건 좋고 나쁨의 잣대로 보지 않는 거예요. 각 차원은 양극단 모두 적응적인 면과 도전적인 면을 함께 가지고 있어요. 외향성이 낮다고 사회성이 부족한 게 아니라 깊이 있는 한두 명과의 관계를 더 잘 가꾸시는 분일 수 있고, 정서 민감성이 높다고 약한 게 아니라 깊은 공감과 예술적 감수성의 기반이 되기도 한답니다.

또 한 가지 알아두시면 좋은 점은 컨디션·스트레스·인생의 큰 변화가 점수에 어느 정도 영향을 준다는 거예요. 다만 큰 흐름은 시간이 지나도 비교적 안정적이라, 한 번 받아 보시면 본인의 평소 결을 가늠하시는 좋은 기준선이 됩니다.

## 결과를 어떻게 활용하시면 좋을까요

자기 이해의 출발점으로 활용하시는 게 가장 좋아요. "내가 왜 이런 상황에서 이렇게 반응할까"라는 단서를 얻으시면 일과 관계의 환경을 본인에게 맞게 조율하실 수 있답니다.

가까운 사람과 결과를 공유해서 서로의 차이를 이해하시는 것도 큰 도움이 돼요. 예를 들어 성실성 점수가 다른 두 사람이 함께 살거나 일할 때, 그 차이를 알면 갈등이 한결 부드럽게 풀리거든요.

본 검사는 자가 점검 도구이며 의학적 진단을 대체하지는 않아요. 다만 본인의 성격적 강점과 성장 방향을 살피시는 데 충분히 도움이 될 거예요.
`,
  },

  // 3) 에니어그램 키워드
  {
    slug: "enneagram-test-free-9types-guide",
    title: "에니어그램 9가지 유형 무료 검사: 내 유형 빠르게 찾는 법",
    category: "성격",
    content: `에니어그램은 사람의 성격을 9가지 유형으로 나누어 살피는 모델이에요. MBTI가 행동 양식을 보는 반면 에니어그램은 그 사람의 마음 깊은 곳의 핵심 동기와 두려움까지 함께 살피지요. 이 글에서는 9가지 유형이 어떻게 다르고, 무료로 본인 유형을 어디서 빠르게 확인하실 수 있는지 안내해 드릴게요.

## 에니어그램, 어떤 모델인가요

에니어그램은 고대의 영적 전통과 20세기의 심리학적 통찰이 만난 모델이에요. 1970년대 들어 오스카 이차조와 클라우디오 나란조 등의 작업을 통해 현대적인 9가지 유형 체계로 정리되었지요.

다른 성격 모델과 가장 다른 점은 **동기와 두려움**이라는 마음의 뿌리를 본다는 거예요. 같은 꼼꼼한 사람이라도 1번은 "옳게 하고 싶어서", 3번은 "유능해 보이고 싶어서", 6번은 "실수로 문제가 생길까 봐" 꼼꼼해요. 표면이 비슷해도 동력이 다르면 스트레스 상황과 회복 패턴이 달라집니다.

## 9가지 유형 한눈에 보기

각 유형의 한 줄 요약은 다음과 같아요.

▶ **1번 개혁가** — 옳고 좋은 일을 추구하는 원칙주의자
▶ **2번 조력가** — 사랑받기 위해 누군가에게 필요한 존재가 되려 함
▶ **3번 성취자** — 가치 있는 사람으로 인정받기 위해 성공을 추구
▶ **4번 예술가** — 자기만의 정체성과 의미를 찾고 표현
▶ **5번 탐구자** — 유능하고 자립적인 존재가 되려 깊이 탐구
▶ **6번 충성가** — 안전과 지지를 얻기 위해 신뢰 관계를 추구
▶ **7번 낙천가** — 행복과 만족을 위해 다양한 경험을 추구
▶ **8번 도전가** — 통제력으로 자신과 가까운 사람을 보호
▶ **9번 평화주의자** — 내적·외적 평화와 조화를 유지

본인이 어느 쪽에 가까운지 감이 오시나요. 한두 유형이 떠오르신다면 검사로 확인해 보시면 좋아요.

## 무료 에니어그램 검사, 빠르게 받는 법

해람정신건강의학과 검사실에서 무료 에니어그램 검사를 받으실 수 있어요. 36문항이라 5분이면 충분히 마치실 수 있답니다.

결과로는 본인의 주 유형과 양옆의 날개(wing) 유형, 9축 레이더 차트, 유형별 캐릭터 일러스트, 핵심 동기와 두려움, 강점과 성장의 방향, 스트레스 상황과 안정 상황의 결까지 자세히 안내해 드려요. 학술적 타당도는 Big 5만큼은 아니지만 자기 성찰 도구로는 오랫동안 사랑받아 온 모델이에요.

[해람검사실의 무료 에니어그램 검사 바로가기](/personality/enneagram)

## 날개(Wing)는 무엇인가요

에니어그램이 다른 성격 모델과 또 하나 다른 점은 양옆에 있는 두 유형, 곧 날개의 영향을 함께 본다는 거예요. 예를 들어 같은 9번 평화주의자라도 8번 날개가 강하면 더 추진력 있는 모습이, 1번 날개가 강하면 더 원칙적인 모습이 함께 드러나지요.

날개를 알면 본인의 미묘한 결을 더 잘 이해하실 수 있어요. 해람검사실의 검사 결과에는 주 유형 + 날개 유형이 함께 표시된답니다.

## 결과를 어떻게 활용하시면 좋을까요

에니어그램 결과는 본인을 9개 중 하나로 단순히 분류하는 도구가 아니에요. 본인의 무의식적 패턴을 살피시고 스트레스 상황과 안정 상황에서 어떤 모습이 나오시는지 이해하시는 출발점이지요.

또 가까운 사람의 유형을 함께 알면 갈등의 원인이 더 명확해집니다. 같은 메시지가 다르게 들리는 이유, 어떤 표현이 상대에게 더 닿는지를 짐작하시는 데 도움이 되거든요.

다만 결과는 절대적이지 않아요. 어린 시절의 환경, 가족 관계, 인생의 큰 사건이 같은 사람 안에서 다른 유형의 모습을 끌어내기도 한답니다. 시간이 지나서 다시 해보시면 다른 결과가 나올 수도 있고, 그 자체가 본인의 변화를 보여 주는 정보가 되지요.
`,
  },

  // 4) 애착 유형 키워드
  {
    slug: "adult-attachment-style-test-free",
    title: "성인 애착 유형 검사 무료: 내 연애 패턴이 항상 비슷한 이유",
    category: "성격",
    content: `"왜 나는 매번 비슷한 사람을 만나고, 매번 비슷한 이유로 끝날까." 진료실에서 자주 듣게 되는 말씀이에요. 우리가 가까운 관계에서 반복하는 패턴의 뿌리를 살피는 도구가 바로 성인 애착 유형 검사예요. 이 글에서는 네 가지 애착 유형이 무엇이고 무료로 어디서 받으실 수 있는지 안내해 드릴게요.

## 애착 이론이란

애착 이론은 1950년대 영국 정신과의사 존 볼비(John Bowlby)가 어린이 발달 연구에서 시작했어요. 처음 양육자와의 관계 경험이 어른이 된 후의 가까운 관계에서도 비슷한 방식으로 반복된다는 발견이지요.

성인 애착 연구에서는 두 가지 축을 봅니다. **불안(Anxiety)**은 가까운 사람에게 거절·유기당할까 봐 두려워하는 정도, **회피(Avoidance)**는 친밀함과 의존을 불편해하는 정도예요. 이 두 축의 조합으로 4가지 유형이 나오지요.

## 4가지 애착 유형

▶ **안정형 (Secure)** — 낮은 불안 + 낮은 회피
가까움과 자립을 모두 편하게 다루시는 분이에요. 신뢰가 쌓이는 관계를 자연스럽게 이어 가지요. 인구의 약 50-60%가 이 유형이에요.

▶ **헌신형 (Anxious)** — 높은 불안 + 낮은 회피
깊은 사랑에 진심을 다하시지만 사랑받지 못할까 봐 자주 마음이 흔들리시는 분이에요. 답장이 늦거나 분위기가 미묘하게 바뀌면 곧장 "내가 무엇을 잘못했나" 싶어지지요. 인구의 약 15-20%예요.

▶ **자립형 (Avoidant)** — 낮은 불안 + 높은 회피
혼자만의 시간과 자립성을 중요하게 여기시고 깊은 친밀함이 부담스러우신 분이에요. 차분하고 흔들림이 적지만 약한 모습을 보이거나 도움을 요청하시는 게 어려우십니다. 인구의 약 20-25%예요.

▶ **양가형 (Disorganized/Fearful-Avoidant)** — 높은 불안 + 높은 회피
가까워지고 싶은 마음과 멀어지고 싶은 마음이 함께 흐르는 분이에요. 다가가면 두려워서 물러서고, 물러서면 외로워서 다시 다가가시는 패턴이 반복되지요. 인구의 약 5-10%로 가장 적어요.

## 무료 애착 유형 검사

해람정신건강의학과 검사실에서 무료로 받으실 수 있어요. 24문항이라 약 4분 만에 마치실 수 있답니다.

결과로는 본인의 애착 유형, 불안과 회피 점수의 2D 사분면 위치, 유형별 캐릭터 일러스트, 관계 안에서의 모습, 갈등 시 패턴, 자기 위로 방식, 성장의 방향까지 안내해 드려요.

[해람검사실의 무료 애착 유형 검사 바로가기](/personality/attachment)

## 결과를 어떻게 활용하시면 좋을까요

가장 큰 통찰은 "내가 왜 이렇게 반응하는지"를 이해하실 수 있다는 거예요. 본인이 헌신형이라면 답장이 늦을 때 떠오르는 두려움이 사실이 아니라 어린 시절의 경험이 만든 패턴이라는 걸 알아차리실 수 있지요. 자립형이라면 가까워질 때 답답해지는 게 본인의 약함이 아니라 마음의 보호 메커니즘이라는 걸 이해하실 수 있고요.

또 한 가지 중요한 점은 애착 유형이 평생 고정된 게 아니라는 거예요. 안정된 관계 안에서 새로운 경험을 쌓으시면 점차 안정형 쪽으로 변화하실 수 있답니다. 이를 학술적으로 **획득된 안정형(earned secure)**이라고 부르지요.

본인이 비안정 유형이라고 자책하지 마시고, 본인을 이해하시는 거울로 활용하세요. 필요하시면 정신건강의학과나 심리 상담을 통해 더 깊이 살펴보실 수도 있답니다.
`,
  },

  // 5) DISC 키워드
  {
    slug: "disc-test-free-workplace-personality",
    title: "DISC 성격 검사 무료: 직장에서 내 행동 양식 4가지로 파악하기",
    category: "성격",
    content: `DISC는 직장과 팀 안에서의 행동 양식을 빠르게 파악하는 데 가장 널리 쓰이는 성격 모델이에요. MBTI나 Big 5보다 학술적 깊이는 덜하지만 직장 관계와 협업에 바로 적용하기 좋은 실용 도구지요. 이 글에서는 DISC 4가지 유형과 무료 검사 방법을 안내해 드릴게요.

## DISC, 어떻게 시작됐나요

DISC는 1920년대 미국 심리학자 윌리엄 마스턴(William Marston)의 행동 이론에서 출발했어요. 그는 사람이 환경을 우호적으로 보는지 적대적으로 보는지, 그리고 능동적으로 반응하는지 수동적으로 반응하는지의 두 축이 행동의 차이를 만든다고 봤어요.

이 두 축이 만드는 네 칸이 D(Dominance), I(Influence), S(Steadiness), C(Conscientiousness)라는 네 가지 행동 양식이지요. 학술적 성격 모델이라기보다 직장과 관계 안에서의 행동 패턴을 빠르게 읽는 데 유용한 실용적 틀이라고 보시면 적절해요.

## 4가지 DISC 유형

▶ **D 주도형 (Dominance)** — 결단력과 추진력으로 결과를 만드는 사람
도전을 마다하지 않고 결정을 빠르게 내리시며 결과를 만드시는 분이에요. 추진력이 강하지만 빠른 속도 때문에 디테일이나 상대의 감정을 놓치실 수 있지요. 경영, 영업, 창업, 응급 의료 같은 빠른 결정이 핵심인 자리에서 빛납니다.

▶ **I 사교형 (Influence)** — 활기와 매력으로 사람을 움직이는 사람
사람들과의 만남에서 에너지를 얻으시고 분위기를 따뜻하게 만드시는 분이에요. 낙관적이고 설득력이 있지만, 한 가지에 깊이 집중하시거나 차분히 마무리하시는 게 어려우실 수 있어요. 마케팅, 영업, 강의, 미디어 같은 사람 중심의 일과 잘 맞아요.

▶ **S 안정형 (Steadiness)** — 꾸준한 신뢰로 사람과 일을 가꾸는 사람
인내심 있게 사람과 일을 가꾸시고 변치 않는 신뢰감을 주시는 분이에요. 협력과 조화를 중요하게 여기시지만 본인 의견을 분명히 표현하시거나 갑작스러운 변화에 적응하시는 부분이 어려우실 수 있지요. HR, 상담, 교육, 행정 같은 관계 기반 일에서 빛납니다.

▶ **C 신중형 (Conscientiousness)** — 정확함과 분석력으로 완성도를 추구하는 사람
자료와 사실을 충분히 분석하시고 완성도 있는 결과를 만드시는 분이에요. 정확하고 체계적이지만 완벽주의 때문에 본인을 압박하시거나 결정이 느려지실 수 있지요. 연구, 회계, 법무, 엔지니어링처럼 디테일과 체계가 중요한 일과 잘 맞아요.

## 무료 DISC 검사 받기

해람정신건강의학과 검사실에서 무료로 받으실 수 있어요. 24문항으로 약 4-5분 안에 마치실 수 있답니다.

결과로는 본인의 주 유형 + 보조 유형, 4축 다이아몬드 차트, 유형별 캐릭터 일러스트, 강점과 도전, 관계 안에서의 모습, 잘 맞는 일과 환경, 다른 유형과 함께할 때의 조합 팁, 성장의 방향까지 자세히 안내해 드려요.

[해람검사실의 무료 DISC 검사 바로가기](/personality/disc)

## 직장에서 DISC를 어떻게 활용하시면 좋을까요

본인의 유형을 아는 것도 좋지만, **상대의 유형을 짐작하는 게** 더 큰 변화를 만들어요. 같은 미팅에 들어가도 D 동료는 결정을 빠르게 원하고, I 동료는 분위기를 살피며, S 동료는 안정성을 우선하고, C 동료는 자료를 보고 싶어 하거든요.

상대의 결을 알면 같은 이야기를 어떻게 전달해야 닿을지가 분명해져요. D에게는 결론부터, I에게는 비전과 함께, S에게는 안정성을 보장하면서, C에게는 근거를 갖춰서 이야기하는 식이지요.

또 팀 구성에서도 도움이 됩니다. D가 너무 많으면 추진력은 좋지만 디테일이 약해지고, C만 모이면 분석은 깊지만 결정이 느려져요. 네 유형이 적절히 섞일 때 가장 균형 있는 팀이 만들어지지요.

## 마치며

DISC는 학술적 깊이보다는 실용성이 강점인 검사예요. 본인의 행동 양식을 빠르게 파악하시고 직장 관계와 협업에 바로 적용하시는 데 좋은 도구지요. 더 깊이 본인의 성격을 살피시고 싶으시다면 Big 5나 에니어그램 같은 검사와 함께 보시면 한결 다층적인 자기 이해가 가능해진답니다.
`,
  },
];

function splitSections(markdown: string): string[] {
  const lines = markdown.split("\n");
  const sections: string[] = [];
  let current = "";
  for (const line of lines) {
    if (line.startsWith("## ") && current.trim()) {
      sections.push(current.trim());
      current = line + "\n";
    } else {
      current += line + "\n";
    }
  }
  if (current.trim()) sections.push(current.trim());
  return sections;
}

async function generateImage(sectionText: string): Promise<Buffer | null> {
  try {
    const prompt = ai.prompt("generate-image/generateImage");
    const response = await prompt({sectionText: sectionText.slice(0, 500)});
    if (response.media?.url) {
      const m = response.media.url.match(/^data:[^;]+;base64,(.+)$/);
      if (m) return Buffer.from(m[1], "base64");
    }
    return null;
  } catch (err) {
    console.error("이미지 생성 실패:", err);
    return null;
  }
}

function makeDownloadUrl(b: string, p: string, t: string): string {
  const e = encodeURIComponent(p)
    .replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/!/g, "%21").replace(/'/g, "%27");
  return `https://firebasestorage.googleapis.com/v0/b/${b}/o/${e}?alt=media&token=${t}`;
}

async function uploadImage(buf: Buffer, slug: string, idx: number): Promise<string> {
  const bucket = getStorage().bucket();
  const path = `blog-images/posts/${slug}/section-${idx}.png`;
  const file = bucket.file(path);
  const token = randomUUID();
  await file.save(buf, {metadata: {contentType: "image/png", metadata: {firebaseStorageDownloadTokens: token}}});
  return makeDownloadUrl(bucket.name, path, token);
}

function buildExcerpt(c: string): string {
  return c.replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ").trim().slice(0, 200);
}

async function ensureCategory(name: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("categories").get();
  if (snap.docs.some((d) => (d.data().name as string) === name)) return;
  await db.collection("categories").add({name, order: snap.size, createdAt: Timestamp.now()});
}

async function processPost(post: BlogDraft) {
  console.log(`\n=== ${post.slug} ===`);
  const db = getFirestore();
  const ref = db.collection("posts").doc(post.slug);
  const bucket = getStorage().bucket();
  const [existing] = await bucket.getFiles({prefix: `blog-images/posts/${post.slug}/`});
  for (const f of existing) {
    try { await f.delete(); } catch { /* ignore */ }
  }
  const sections = splitSections(post.content);
  console.log(`섹션 수: ${sections.length}`);
  const withImages: string[] = [];
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    if (s.startsWith("## 참고")) { withImages.push(s); continue; }
    console.log(`  [${i + 1}/${sections.length}] 이미지...`);
    const buf = await generateImage(s);
    if (buf) {
      idx++;
      const url = await uploadImage(buf, post.slug, idx);
      console.log(`    ✓`);
      withImages.push(s + `\n\n![](${url})`);
    } else {
      console.warn("    실패");
      withImages.push(s);
    }
  }
  const final = withImages.join("\n\n");
  const m = final.match(/https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/);
  const featuredImage = m?.[0] ?? "";
  await ref.set({
    title: post.title,
    slug: post.slug,
    content: final,
    excerpt: buildExcerpt(final),
    date: Timestamp.now(),
    categories: [post.category],
    featuredImage,
    author: "해람정신건강의학과",
    updatedAt: Timestamp.now(),
  });
  console.log(`✓ ${post.slug} 저장`);
}

async function run() {
  for (const p of posts) await ensureCategory(p.category);
  for (const p of posts) await processPost(p);
  console.log("\n전체 완료");
}

run().catch((err) => { console.error(err); process.exit(1); });
