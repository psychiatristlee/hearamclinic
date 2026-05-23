/**
 * 블로그가 없는 검사들에 대한 안내 블로그 5종 + 섹션별 이미지 생성.
 *
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/create-test-info-blogs.ts
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
  {
    slug: "disc-behavioral-test-explained",
    title: "주도·사교·안정·신중, 네 가지 행동 양식으로 나를 만나기: DISC 검사 안내",
    category: "성격",
    content: `같은 회의에 들어가도 누군가는 결정을 빠르게 내리고, 누군가는 분위기를 부드럽게 만들며, 누군가는 한 발 물러나 조용히 듣고, 누군가는 자료를 꼼꼼히 확인하죠. 우리가 일상에서 보이는 이런 차이를 네 가지 행동 양식으로 살펴보는 도구가 바로 DISC 검사입니다.

해람검사실에도 DISC 자가 검사가 준비되어 있는데요. 이번 글에서는 DISC가 어떤 모델인지, 네 유형의 결은 어떻게 다른지, 그리고 결과를 어떻게 살펴보시면 좋을지 안내해 드릴게요.

## DISC는 어떻게 시작되었나

DISC는 1920년대 미국 심리학자 윌리엄 마스턴(William Marston)의 행동 이론에서 출발했어요. 그는 사람이 환경을 어떻게 인식하고 어떻게 반응하는지를 두 축으로 보았는데요. 환경을 우호적으로 보는지 적대적으로 보는지, 그리고 능동적으로 움직이는지 수동적으로 움직이는지가 그 두 축이었지요.

이 두 축이 만드는 네 칸이 바로 D(Dominance), I(Influence), S(Steadiness), C(Conscientiousness)라는 네 가지 행동 양식이 됩니다. 학술적인 성격 모델이라기보다는 직장과 관계 안에서의 행동 패턴을 빠르게 읽는 데 유용한 실용적 틀이라고 보시면 적절할 거예요.

## 네 가지 유형의 결

**D, 주도형**은 도전을 마다하지 않고 결정을 빠르게 내리며 결과를 만드시는 분들이에요. 추진력이 강하고 솔직하지만, 빠른 속도 때문에 디테일이나 상대의 감정을 놓치실 수 있죠.

**I, 사교형**은 사람들과의 만남에서 에너지를 얻고 분위기를 따뜻하게 만드시는 분들입니다. 낙관적이고 설득력이 있지만, 한 가지에 깊이 집중하거나 차분히 마무리하시는 일이 가장 큰 숙제로 남는답니다.

**S, 안정형**은 인내심 있게 사람과 일을 가꾸시고, 변치 않는 신뢰감을 주시는 분들이에요. 협력과 조화를 중요하게 여기시지만, 본인의 의견을 분명히 표현하시거나 갑작스러운 변화에 적응하시는 부분이 어려우실 수 있어요.

**C, 신중형**은 자료와 사실을 충분히 분석하시고 완성도 있는 결과를 만드시는 분들입니다. 정확하고 체계적이지만, 완벽주의 때문에 본인을 압박하시거나 결정이 느려지실 수 있죠.

## 결과를 어떻게 활용하면 좋을까요

DISC 결과는 본인을 한 가지 유형으로 묶는 라벨이 아니에요. 본인이 자연스럽게 보이는 행동 패턴을 빠르게 알아차리시는 거울로 활용하시면 좋아요. 보통 주 유형 하나와 보조 유형 하나가 함께 나오는데요. 두 유형의 조합이 본인의 결을 더 풍부하게 설명해 줍니다.

특히 직장이나 가까운 관계에서 갈등이 생길 때 DISC가 도움이 되는데요. 같은 메시지를 D 유형은 결과 중심으로 듣고 I 유형은 감정 중심으로 듣거든요. 상대의 결을 짐작하시면 같은 이야기를 어떻게 전달해야 닿을지가 분명해지지요.

다만 DISC는 행동 양식을 보는 도구라, 깊은 내면의 동기까지는 다루지 않아요. 더 깊이 본인을 살피고 싶으시다면 Big 5나 에니어그램 같은 검사와 함께 보시는 걸 권해 드릴게요.

## 해람검사실의 DISC 검사 안내

해람검사실의 DISC 행동 유형 검사는 [여기](/personality/disc)에서 진행하실 수 있어요. 24문항을 5점 척도로 응답하시면 4-5분 안에 마치실 수 있답니다.

결과 화면에서는 4축 다이아몬드 차트로 네 유형의 점수를 한눈에 보실 수 있고요. 본인의 주 유형 캐릭터 일러스트와 함께 강점·도전·관계·일·성장 방향까지 자세히 안내해 드려요.

본 검사는 자가 점검 도구이며 의학적 진단을 대체하지는 않습니다. 다만 본인의 행동 패턴을 객관적으로 살펴보시고, 일상의 작은 조정 단서를 얻으시는 데 도움이 될 거예요.
`,
  },
  {
    slug: "gad7-anxiety-screening-explained",
    title: "불안의 무게를 객관적으로 가늠하기: GAD-7 자가 검사 안내",
    category: "정신과 설명서",
    content: `진료실에서 "요즘 불안한 것 같은데, 이게 진료를 받아야 할 정도인지 모르겠어요"라는 말씀을 많이 들어요. 마음의 일이라 눈으로 보이지 않고, 다른 사람과 비교하기도 어려우니 자연스러운 망설임이지요.

이럴 때 본인의 불안 정도를 짧은 시간에 객관적으로 가늠하실 수 있는 도구가 GAD-7입니다. 정식 명칭은 일반화된 불안 장애 척도(Generalized Anxiety Disorder 7-item Scale)인데요. 이번 글에서는 이 검사가 무엇이고 어떻게 활용하시면 좋은지 안내해 드릴게요.

## GAD-7은 어떤 검사인가요

GAD-7은 2006년 컬럼비아 대학교의 스피처(Robert L. Spitzer) 박사 연구팀이 개발한 7문항짜리 자가 보고형 척도예요. 미국·유럽·한국 등 다양한 문화권에서 신뢰도와 타당도가 검증되어, 1차 진료와 정신건강의학과 모두에서 가장 널리 쓰이는 불안 선별 도구가 되었지요.

7개 문항은 지난 2주 동안 다음과 같은 증상이 얼마나 자주 있었는지를 묻습니다. 불안하거나 초조했나요. 걱정을 멈추거나 통제하기 어려웠나요. 여러 가지 일에 대해 지나치게 걱정했나요. 긴장을 풀기 어려웠나요. 안절부절못해 한자리에 가만히 있기 힘들었나요. 쉽게 짜증이 났나요. 마치 무언가 나쁜 일이 일어날 것 같은 두려움이 있었나요. 각 문항은 0점(전혀)에서 3점(거의 매일)으로, 총점은 0에서 21점 사이입니다.

## 점수는 어떻게 해석하나요

점수 구간은 일반적으로 다음과 같이 해석되는데요. 0-4점은 정상 범위, 5-9점은 가벼운 불안, 10-14점은 중등도 불안, 15-21점은 심한 불안으로 봐요. 보통 10점 이상이면 일반화된 불안장애의 가능성이 높다고 보고 추가 평가를 권하지요.

다만 GAD-7 점수가 그대로 진단이 되지는 않아요. 사람마다 같은 점수라도 일상에 미치는 영향이 다르거든요. 어떤 분은 10점이어도 잘 기능하시고, 어떤 분은 8점인데도 일상이 많이 힘드실 수 있어요. 그래서 점수는 본인의 상태를 다른 사람과 의사에게 객관적으로 전달하는 출발점 정도로 보시면 좋습니다.

또 한 가지 기억하실 부분은요. GAD-7은 일반화된 불안에 초점이 맞춰져 있어서, 공황장애나 사회불안장애, 강박장애 같은 다른 불안 관련 문제는 따로 점검이 필요할 수 있어요.

## 어떨 때 이 검사를 해보시면 좋을까요

먼저 본인이 요즘 평소보다 자주 긴장하거나 걱정에 휩싸이신다고 느낄 때 좋은 출발점이 됩니다. 또 진료를 받을지 고민이 되실 때 짧은 자가 검사로 본인의 상태를 가늠해 보시면 결정이 한결 명확해지지요.

이미 치료를 받고 계신 분이라면 변화를 추적하는 데도 유용해요. 한 달이나 두 달 간격으로 같은 검사를 해보시면 점수가 어떻게 변했는지 객관적으로 보실 수 있거든요. 약물치료나 인지행동치료의 효과를 본인이 직접 확인하시는 한 가지 방법이 됩니다.

다만 검사 결과가 무거우시다면 혼자 고민하지 마시고, 가까운 정신건강의학과 진료를 받아 보시기를 권해 드려요. 불안은 비교적 잘 치료되는 영역인데, 적절한 시점에 도움을 받으시면 회복이 한결 빨라진답니다.

## 해람검사실의 GAD-7 검사 안내

해람검사실의 GAD-7 검사는 [여기](/test/gad7)에서 진행하실 수 있어요. 7문항 5점 척도로 1분이면 충분히 마치실 수 있답니다.

결과 화면에서는 본인의 총점과 함께 점수 구간별 해석을 함께 안내해 드려요. 로그인하시면 결과가 본인 계정에 저장되어, 시간이 흐른 뒤 다시 검사하시면서 변화를 확인하실 수도 있답니다.

본 검사는 자가 선별 도구이며 의학적 진단을 대체하지는 않아요. 결과가 마음에 걸리시거나 일상에 분명한 어려움이 있으시다면 진료실 문을 두드려 주세요.
`,
  },
  {
    slug: "audit-alcohol-screening-explained",
    title: "내 음주, 어디쯤 와 있을까요? AUDIT 자가 검사 안내",
    category: "정신과 설명서",
    content: `"술을 즐기는 정도라고 생각했는데, 가끔 정말 괜찮은 건가 싶을 때가 있어요." 진료실에서 종종 듣게 되는 말씀이에요. 음주는 사회 전반에 자연스럽게 녹아 있어서, 본인의 음주가 어디쯤 와 있는지 가늠하기가 의외로 어렵지요.

이럴 때 본인의 음주 패턴을 객관적으로 점검하실 수 있는 도구가 AUDIT 검사입니다. 정식 명칭은 알코올 사용장애 선별검사(Alcohol Use Disorders Identification Test)예요.

## AUDIT은 어떻게 만들어졌나요

AUDIT은 1989년 세계보건기구(WHO)가 다국적 협력 연구를 통해 개발한 표준 도구예요. 의료기관에서 위험 음주를 조기에 발견하기 위해 만들어졌고요. 한국을 포함한 전 세계에서 가장 널리 사용되는 알코올 선별 검사입니다.

10개 문항으로 구성되어 있는데요. 음주 빈도, 한 번에 마시는 양, 한 자리에서 많이 마시는 경우, 음주 통제의 어려움, 음주 때문에 일·약속을 놓친 경험, 해장 음주, 죄책감, 기억 단절(블랙아웃), 본인 또는 다른 사람의 신체 부상, 가족이나 의료진의 음주에 대한 우려까지 폭넓게 묻지요. 각 문항은 0-4점이고 총점은 0-40점 사이예요.

## 점수는 어떻게 해석할까요

점수 구간은 다음과 같이 해석되는데요. 0-7점은 정상 음주, 8-15점은 위험 음주, 16-19점은 유해 음주, 20점 이상은 알코올 사용장애의 가능성으로 봐요. WHO는 8점 이상을 진료가 권장되는 시점으로 제시했지요.

여기서 주의 깊게 보실 부분이 있어요. AUDIT의 앞 세 문항(음주 빈도·양·과음 패턴)은 음주의 "양"을 보고, 가운데 세 문항은 "의존성"을, 뒤 네 문항은 "음주로 인한 결과"를 봅니다. 같은 8점이라도 어느 구간에서 점수가 모였는지에 따라 의미가 달라져요. 양만 많고 다른 영역은 깨끗하면 위험 음주 단계, 의존성 점수가 높으면 신체적 의존이 형성됐을 가능성이 있지요.

또 한 가지, 한국인은 신체적으로 알코올 분해 효소가 약한 경우가 많아서 같은 양을 마셔도 더 큰 영향을 받을 수 있어요. 점수와 함께 본인의 신체 반응(다음 날 피로감, 두통, 기억 단절 등)도 함께 살펴보시는 게 좋답니다.

## 어떨 때 이 검사를 해보시면 좋을까요

먼저 본인의 음주 패턴이 점점 늘어나고 있다고 느끼실 때, 또는 가까운 사람이 음주를 걱정하실 때 한 번쯤 점검해 보시는 출발점이 됩니다. 술자리가 늘었거나 평일에도 마시게 되었거나 다음 날 일에 영향을 주는 일이 잦아지셨다면 더욱 의미가 있어요.

또 우울이나 불안 때문에 술을 자주 찾게 되시는 분들도 한 번쯤 살펴보시면 좋아요. 마음의 어려움과 음주는 서로를 악화시키는 관계라서요. 어느 한쪽이 해결되어야 다른 쪽도 풀리는 경우가 많거든요.

검사 결과가 8점을 넘으셨다면 가까운 정신건강의학과나 알코올 전문 의료기관에서 추가 평가를 받아 보시는 게 좋아요. 알코올 사용 문제는 조기에 다루실수록 회복이 수월하답니다.

## 해람검사실의 AUDIT 검사 안내

해람검사실의 AUDIT 검사는 [여기](/test/audit)에서 진행하실 수 있어요. 10문항이라 2분 내외면 충분히 마치실 수 있답니다.

결과 화면에서는 본인의 총점과 음주 위험 단계 해석을 함께 안내해 드려요. 로그인하시면 결과가 본인 계정에 저장되어 시간이 흐른 뒤 다시 검사하시면서 변화를 확인하실 수도 있고요.

음주에 대한 자기 점검은 부끄러운 일이 아니에요. 오히려 본인을 돌보시는 분이 하는 일이지요. 검사 결과가 마음에 걸리시면 언제든 진료실 문을 두드려 주세요.
`,
  },
  {
    slug: "mdq-bipolar-screening-explained",
    title: "기분의 진폭을 살펴보다: 양극성 장애 선별검사 MDQ 안내",
    category: "정신과 설명서",
    content: `"우울할 때는 정말 깊이 가라앉는데, 또 어떤 시기에는 잠도 안 자고 며칠씩 활기차게 일을 벌이게 돼요." 진료실에서 이런 말씀을 들으면 단순한 우울이 아니라 기분의 진폭, 즉 양극성 장애(조울증)의 가능성을 함께 살피게 되지요.

본인의 기분 변화 패턴을 짧은 시간에 점검해 보시는 도구가 MDQ 검사입니다. 정식 명칭은 기분장애 질문지(Mood Disorder Questionnaire)예요.

## MDQ는 어떤 검사인가요

MDQ는 2000년 미국 텍사스 의과대학의 허쉬펠드(Robert Hirschfeld) 박사 연구팀이 양극성 장애를 일차 진료에서 빠르게 선별하기 위해 개발한 자가 보고형 척도예요. 우울증으로 진료를 받으시는 분들 중 상당수가 사실은 양극성 장애의 우울 시기에 와 있는 경우가 많은데요. 단극성 우울과 양극성 우울은 치료 접근이 다르기 때문에 구분이 중요하답니다.

검사는 세 부분으로 구성되어 있어요. 첫째 부분은 13개 문항으로, 평생에 한 번이라도 다음과 같은 시기가 있었는지를 묻습니다. 평소보다 기분이 좋거나 들떠 있었는지, 평소보다 짜증이 많았는지, 자신감이 평소와 달랐는지, 잠을 평소보다 훨씬 적게 자도 피곤하지 않았는지, 말이 평소보다 많거나 빨랐는지, 생각이 너무 빨라 따라가기 힘들었는지, 주의가 산만했는지, 평소보다 더 활동적이었는지, 평소보다 더 사교적이었는지, 평소보다 성적 욕구가 많았는지, 평소답지 않은 무모한 행동(과소비·과한 모험 등)을 했는지, 무모한 결정으로 문제가 생겼는지 등이지요.

둘째 부분은 이런 증상들이 같은 시기에 함께 있었는지를 묻고, 셋째 부분은 그 시기에 가족·일·법적 문제 등이 얼마나 심각했는지를 묻습니다.

## 점수는 어떻게 해석하나요

첫째 부분에서 7개 이상에 "예"라고 답하시고, 둘째 부분에서 "동시에 있었다"라고 답하시고, 셋째 부분에서 "중등도 이상의 문제"라고 답하셨다면 양극성 장애의 가능성을 의심해 볼 수 있어요. 한국 연구에서는 7개 기준 대신 5개에서 6개 정도로 더 민감하게 보기도 합니다.

다만 MDQ 양성이 곧 양극성 장애 진단이 되지는 않아요. 양극성 장애 진단은 증상의 패턴, 지속 기간, 일상 기능 영향, 가족력, 다른 원인 배제 등을 종합적으로 살펴서 내리거든요. 정신과 진료에서는 MDQ 결과를 출발점으로, 본인과 가족의 이야기를 함께 들어보면서 신중하게 판단하지요.

## 어떨 때 이 검사를 해보시면 좋을까요

먼저 본인이 우울증 치료를 받고 계시는데도 약 효과가 잘 나지 않거나, 약을 시작한 뒤 갑자기 들뜨고 잠이 줄어드는 변화가 있으시다면 한 번 살펴보시는 게 좋아요. 양극성 우울에 단극성 우울 약을 쓰면 오히려 조증으로 전환될 수 있기 때문이지요.

또 가족 중에 양극성 장애 진단을 받으신 분이 계시거나, 본인의 기분이 한 달이나 두 달 단위로 크게 오르내린다고 느끼시는 경우에도 점검해 보시면 도움이 됩니다.

다만 결과 해석은 신중하게 부탁드릴게요. MDQ는 선별 도구이지 진단 도구가 아니랍니다. 양성이 나오시면 반드시 정신건강의학과 진료를 통해 정밀한 평가를 받아 보시는 게 좋아요. 양극성 장애는 적절한 치료로 안정되게 관리되는 영역이거든요.

## 해람검사실의 MDQ 검사 안내

해람검사실의 MDQ 검사는 [여기](/test/mdq)에서 진행하실 수 있어요. 13문항 + 부가 질문이라 3-4분이면 마치실 수 있답니다.

결과 화면에서는 본인의 응답 합계와 양극성 장애 가능성에 대한 해석을 함께 안내해 드려요. 로그인하시면 결과가 본인 계정에 저장됩니다.

기분의 진폭이 본인을 자주 흔든다고 느끼신다면 혼자 안고 가지 마시고 진료실에서 함께 살펴보시기를 권해 드려요. 마음의 무게가 한결 가벼워질 거예요.
`,
  },
  {
    slug: "pcl5-ptsd-screening-explained",
    title: "지나간 사건이 지금도 나를 흔든다면: PTSD 자가 검사 PCL-5 안내",
    category: "정신과 설명서",
    content: `사고나 폭력, 갑작스러운 상실 같은 사건을 겪으신 뒤에도 시간이 지나면 마음이 차차 회복되시는 경우가 많아요. 그런데 어떤 분들은 그 사건이 지금도 본인을 흔든다고 느끼시지요. 갑자기 떠오르는 장면, 비슷한 자극을 만났을 때 올라오는 긴장, 잠들기 어려움, 사람을 피하게 되는 마음. 이런 변화가 한 달 이상 지속되고 일상에 영향을 주신다면 외상후 스트레스 장애(PTSD)를 의심해 봐야 합니다.

본인의 PTSD 증상 정도를 객관적으로 가늠해 보시는 도구가 PCL-5 검사예요. 정식 명칭은 PTSD Checklist for DSM-5(PCL-5)랍니다.

## PCL-5는 어떤 검사인가요

PCL-5는 미국 보훈부(VA)의 PTSD 국가 센터가 2013년에 개정한 자가 보고형 척도예요. DSM-5(미국 정신질환 진단 및 통계 편람 5판)의 PTSD 진단 기준을 그대로 반영한 20문항으로, 임상 현장과 연구 모두에서 가장 신뢰도가 높은 PTSD 선별 도구로 자리잡았지요.

20문항은 PTSD의 네 가지 핵심 증상군을 모두 다룹니다. 첫째는 재경험인데요. 사건이 자꾸 떠오르거나 악몽으로 나타나거나 비슷한 상황에서 다시 그곳에 있는 듯한 느낌이 드는 증상이지요. 둘째는 회피로, 사건을 떠올리게 하는 생각·감정·장소·사람을 피하게 되는 변화입니다. 셋째는 인지와 기분의 부정적 변화로, 사건의 중요한 부분을 기억하기 어렵거나 자신·세상에 대한 부정적 신념이 생기거나 즐거움을 느끼기 어려워지는 부분이에요. 넷째는 각성과 반응성의 변화로, 쉽게 놀라거나 화가 나거나 잠들기 어려운 증상이지요.

각 문항은 0점(전혀)에서 4점(매우 심함)까지로, 총점은 0에서 80점 사이입니다.

## 점수는 어떻게 해석하나요

PCL-5는 두 가지 방식으로 해석되는데요. 첫째는 총점 방식으로, 일반적으로 33점 이상이면 PTSD 가능성이 높다고 봅니다. 한국 임상 연구에서는 30점 전후를 의미 있는 기준선으로 보기도 하지요.

둘째는 증상 패턴 방식이에요. 네 가지 증상군 각각에서 진단 기준에 해당하는 문항이 일정 수 이상 2점("중간 정도") 이상으로 표시되면 PTSD 진단 기준을 충족할 가능성이 있다고 봅니다. 이 방식이 DSM-5 진단 기준에 더 가깝지요.

다만 점수가 곧 진단은 아니에요. PTSD 진단은 외상 사건의 성격, 증상이 1개월 이상 지속되었는지, 일상 기능에 어떤 영향을 주는지, 다른 정신 건강 문제와의 관계 등을 종합적으로 살피셔야 합니다. PCL-5는 그 출발점이 되는 거울 정도로 보시면 적절해요.

## 어떨 때 이 검사를 해보시면 좋을까요

먼저 본인이 한 달 이상 전에 겪은 외상 사건이 지금도 자주 떠오르신다면 살펴보시면 좋아요. 사고, 폭력, 학대, 갑작스러운 상실, 자연재해, 의료 트라우마 등 무엇이든 본인에게 충격적이었던 사건이라면 다 포함됩니다.

또 사건 이후 본인이 사람을 피하시거나, 잠들기 어려우시거나, 쉽게 놀라시거나, 일상에서 이전처럼 즐거움을 느끼기 어려워지셨다면 점검해 볼 가치가 있어요. 본인이 변했다고 느끼시는 신호가 있다면요.

PCL-5 점수가 높게 나오시거나 일상에 분명한 어려움이 있으시면 가능하면 빨리 정신건강의학과나 트라우마 전문 치료자와 상의해 보시기를 권해 드릴게요. PTSD는 시간이 지나면 자연히 좋아질 거라는 기대가 있을 수 있지만, 적절한 치료(EMDR, 인지처리치료, 약물치료 등)를 받으시면 회복이 훨씬 수월해진답니다.

## 해람검사실의 PCL-5 검사 안내

해람검사실의 PCL-5 검사는 [여기](/test/pcl5)에서 진행하실 수 있어요. 20문항 5점 척도로 3-4분이면 충분히 마치실 수 있답니다.

결과 화면에서는 본인의 총점과 PTSD 증상 심각도 해석을 함께 안내해 드려요. 로그인하시면 결과가 본인 계정에 저장되어, 시간이 흐른 뒤 다시 확인하실 수 있답니다.

지나간 사건의 무게를 혼자 안고 가지 마세요. 본인을 위해 한 발 내딛는 일이 회복의 시작이 된답니다.
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

function makeDownloadUrl(bucketName: string, storagePath: string, token: string): string {
  const encoded = encodeURIComponent(storagePath)
    .replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/!/g, "%21").replace(/'/g, "%27");
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

async function uploadImage(buffer: Buffer, slug: string, index: number): Promise<string> {
  const bucket = getStorage().bucket();
  const storagePath = `blog-images/posts/${slug}/section-${index}.png`;
  const file = bucket.file(storagePath);
  const downloadToken = randomUUID();
  await file.save(buffer, {
    metadata: {contentType: "image/png", metadata: {firebaseStorageDownloadTokens: downloadToken}},
  });
  return makeDownloadUrl(bucket.name, storagePath, downloadToken);
}

function buildExcerpt(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);
}

async function ensureCategory(name: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("categories").get();
  const exists = snap.docs.some((d) => (d.data().name as string) === name);
  if (exists) return;
  const order = snap.size;
  await db.collection("categories").add({name, order, createdAt: Timestamp.now()});
  console.log(`카테고리 추가: ${name}`);
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

  const sectionsWithImages: string[] = [];
  let imageIndex = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.startsWith("## 참고 문헌") || section.startsWith("## 참고 자료")) {
      sectionsWithImages.push(section);
      continue;
    }
    console.log(`  [${i + 1}/${sections.length}] 이미지 생성...`);
    const buf = await generateImage(section);
    if (buf) {
      imageIndex++;
      const url = await uploadImage(buf, post.slug, imageIndex);
      console.log(`    ✓ ${url.slice(0, 80)}...`);
      sectionsWithImages.push(section + `\n\n![](${url})`);
    } else {
      console.warn("    실패, 이미지 없이 진행");
      sectionsWithImages.push(section);
    }
  }

  const finalContent = sectionsWithImages.join("\n\n");
  const firstImageMatch = finalContent.match(
    /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/,
  );
  const featuredImage = firstImageMatch?.[0] ?? "";

  await ref.set({
    title: post.title,
    slug: post.slug,
    content: finalContent,
    excerpt: buildExcerpt(finalContent),
    date: Timestamp.now(),
    categories: [post.category],
    featuredImage,
    author: "해람정신건강의학과",
    updatedAt: Timestamp.now(),
  });

  console.log(`✓ ${post.slug} 저장 완료`);
}

async function run() {
  for (const post of posts) {
    await ensureCategory(post.category);
  }
  for (const post of posts) {
    await processPost(post);
  }
  console.log("\n전체 완료");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
