/**
 * 4개의 집중력/주의력 검사 블로그 포스트를 생성하고 각 섹션에 이미지를 추가한다.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/create-attention-blog-posts.ts
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
  console.error("GOOGLE_GENAI_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

const app = initializeApp({
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
}

const posts: BlogDraft[] = [
  {
    slug: "stroop-test-attention",
    title: "색깔과 글자가 충돌할 때, 우리 뇌는 어떻게 반응할까: 스트룹 검사 자세히 보기",
    content: `"빨강"이라는 글자가 파란색으로 쓰여 있을 때, 우리는 잠깐 머뭇거립니다. 글자의 의미와 색깔이 서로 다른 정보를 보내고 있기 때문입니다. 이 작은 머뭇거림을 정량화한 검사가 바로 스트룹 검사(Stroop Test)입니다.

진료실에서 집중력 저하를 호소하시는 분들과 이야기를 나누다 보면, 단순히 주의가 흐트러지는 것이 아니라 여러 정보가 한꺼번에 들어올 때 한 가지에만 집중하기 어렵다고 표현하시는 경우가 많습니다. 스트룹 검사는 바로 이러한 능력을 직접 측정합니다.

## 스트룹 검사는 어디에서 시작되었나

1935년 미국 심리학자 J.R. 스트룹(John Ridley Stroop)이 박사 논문에서 이 효과를 처음 보고했습니다. 색깔이 다른 잉크로 인쇄된 색깔 단어를 읽거나 색깔을 말하는 데 걸리는 시간이, 글자의 의미와 색깔이 일치할 때보다 일치하지 않을 때 훨씬 길어진다는 사실을 발견했습니다. 이를 스트룹 효과(Stroop effect)라고 부릅니다.

이 효과가 왜 중요할까요. 우리 뇌는 글을 읽는 일이 거의 자동화되어 있어서, 의식하지 않아도 글자의 의미가 먼저 떠오릅니다. 그런데 검사에서는 글자 의미 대신 색깔에 주의를 기울여야 하므로, 자동적으로 떠오르는 의미를 의식적으로 억제해야 합니다. 이 억제 능력이 곧 인지적 통제력의 핵심입니다.

## 무엇을 측정하나요

스트룹 검사는 세 가지 능력을 동시에 측정합니다. 첫째, 자동적인 반응을 억제하고 의도한 반응만 선택하는 선택 주의력입니다. 둘째, 갈등하는 정보 사이에서 빠르게 옳은 선택을 하는 처리 속도입니다. 셋째, 짧은 시간 동안 과제 규칙을 잊지 않고 유지하는 작업기억입니다.

신경영상 연구에서는 스트룹 과제를 수행할 때 전대상피질과 배외측 전전두피질이 활발하게 활동한다고 알려져 있습니다. 이 영역들은 ADHD, 강박장애, 우울증, 외상후 스트레스장애에서 활동성이 변화하는 곳이기도 합니다. 그래서 임상에서는 인지 기능의 보조 지표로 활용됩니다.

## 결과를 어떻게 해석할까요

해람검사실의 스트룹 검사는 [여기](/test/stroop)에서 진행하실 수 있습니다. 20문항을 풀면서 정답 수와 평균 반응 속도가 함께 보고됩니다.

정답 수가 높고 평균 반응 속도가 빠르면 인지적 통제력이 좋다고 볼 수 있지만, 이 검사 결과만으로 어떤 진단을 내리는 것은 적절하지 않습니다. 컨디션이 좋지 않거나 잠을 못 주무신 날에는 평소보다 결과가 떨어질 수 있고, 검사를 처음 해보시는 분들은 익숙해진 후에 결과가 나아지는 경우도 흔합니다.

가장 좋은 활용법은 본인의 평소 기준선을 알고 있는 것입니다. 평소 컨디션에서 한 번 측정해 두시고, 집중이 잘 안 된다고 느낄 때 다시 해보시면 변화의 폭을 객관적으로 확인하실 수 있습니다. 결과가 일관되게 평소보다 떨어지고 일상에서도 비슷한 어려움이 반복되시면, 한 번 정신건강의학과 진료를 통해 점검해 보시는 것을 권합니다.
`,
  },
  {
    slug: "selective-attention-test",
    title: "수많은 자극 중에서 목표만 골라내는 능력: 선택 주의력 검사 자세히 보기",
    content: `사람의 뇌는 매 순간 엄청난 양의 시각 정보를 받아들입니다. 출퇴근길의 거리, 회의 중인 사무실, 식당 메뉴판 모두 마찬가지입니다. 그 많은 정보 가운데 지금 나에게 의미 있는 자극만 골라내고 나머지는 흘려보내는 능력이 바로 선택 주의력(selective attention)입니다.

선택 주의력이 잘 작동하지 않으면 어떤 일이 일어날까요. 회의 중에 옆자리의 작은 소리가 신경 쓰여 발표 내용을 놓치거나, 책을 읽는데 페이지의 한 단어에서 다른 곳으로 시선이 자꾸 흘러갑니다. ADHD, 불안장애, 만성 스트레스 상태에서는 이 기능이 약화될 수 있습니다.

## 선택 주의력 검사는 어떻게 진행되나요

선택 주의력 검사는 빠르게 변하는 자극 사이에서 미리 정해진 목표 자극에만 반응하도록 하는 패러다임입니다. 신경심리학에서는 처리 속도, 시각 탐색, 주의 분배 능력을 평가하는 기본 도구 중 하나로 사용됩니다.

해람검사실의 검사는 화면에 일정 간격으로 다양한 자극이 제시되며, 미리 안내된 목표 자극이 나타날 때만 정확하게 반응하도록 구성되어 있습니다. 단순해 보이지만 실제로는 자극이 빠르게 바뀌기 때문에 한순간이라도 주의를 놓치면 목표를 놓치게 됩니다.

## 무엇을 측정하나요

이 검사는 세 가지 측면을 평가합니다. 첫째, 시야에 들어오는 여러 자극 중 목표만 빠르게 식별하는 시각 탐색 능력입니다. 둘째, 일정 시간 동안 같은 수준의 주의를 유지하는 지속 주의력입니다. 셋째, 잘못된 자극에 충동적으로 반응하지 않는 자기 조절 능력입니다.

특히 정답률만큼 중요한 지표는 잘못 누른 횟수입니다. 빠르게 반응하면서 정확도까지 유지하는 것이 핵심이며, 빠르지만 부정확한 패턴이나 정확하지만 느린 패턴 모두 일상의 주의력 문제로 이어질 수 있습니다.

## 결과를 어떻게 해석할까요

해람검사실의 선택 주의력 검사는 [여기](/test/selective-attention)에서 진행하실 수 있습니다.

검사를 마치면 정답 수와 반응 속도가 보고됩니다. 결과가 평소 본인의 기준에서 크게 떨어졌다면 그날의 컨디션, 수면, 카페인 섭취 상태를 먼저 점검해 보시는 것이 좋습니다. 일상생활에서 주의 집중의 어려움이 반복되시면 단일 검사 결과보다는 전반적인 패턴을 함께 살펴보아야 합니다.

선택 주의력은 훈련을 통해 어느 정도 향상될 수 있는 인지 기능입니다. 명상, 규칙적인 운동, 충분한 수면이 도움이 된다는 연구 결과가 많습니다. 다만 일상 기능에 명확한 지장이 있을 정도라면 정신건강의학과 진료를 통해 원인을 점검해 보시기를 권합니다.
`,
  },
  {
    slug: "go-no-go-test-attention",
    title: "반응해야 할 때와 멈춰야 할 때를 구분하는 뇌의 힘: 억제지속 주의력 검사 자세히 보기",
    content: `순간적으로 욱해서 한 말이 자꾸 마음에 걸린다거나, 중요한 회의 중에 갑자기 떠오른 다른 생각이 그대로 입 밖으로 나오는 경험이 반복되시는 분들이 계십니다. 진료실에서 자주 듣는 말씀입니다. 이러한 어려움은 단순한 성격 문제가 아니라 뇌의 한 가지 특정한 기능, 곧 반응 억제(response inhibition)와 관련이 깊습니다.

이 능력을 측정하는 대표적인 검사가 Go/No-Go 검사, 한국어로는 억제지속 주의력 검사입니다. 단순한 형태의 검사이지만 일상의 충동 조절과 가장 직접적으로 연결되는 인지 기능을 살펴봅니다.

## 무엇을 평가하는 검사인가요

Go/No-Go 검사는 화면에 두 종류의 자극이 무작위로 나타날 때, 한쪽 자극(Go)에는 빠르게 반응하고 다른 쪽 자극(No-Go)에는 반응을 멈추도록 하는 과제입니다. 단순해 보이지만 두 가지 능력을 동시에 요구합니다. 빠른 반응과 정확한 억제입니다.

빠르게 반응하기 위해서는 자극이 나타나는 순간 주의가 깨어 있어야 합니다. 동시에 멈춰야 할 자극이 나타났을 때는 이미 시작되려던 반응을 즉시 중단해야 합니다. 이 두 과정이 균형을 이루지 못하면, 너무 빠르지만 자주 잘못 누르거나 너무 신중해서 응답을 놓치게 됩니다.

## 어떤 뇌 영역과 관련이 있나요

신경영상 연구에서는 Go/No-Go 과제를 수행할 때 우측 하전두회와 보조운동영역이 핵심 역할을 한다고 알려져 있습니다. 이 영역들은 충동을 억제하고 행동을 조절하는 기능에 관여합니다.

이 회로의 기능 변화는 ADHD, 강박장애, 알코올 사용 장애, 도박 장애에서 보고되며, 임상에서는 충동 조절 기능을 평가하는 보조 도구로 활용됩니다. 또한 노화나 두부 외상 이후에도 이 기능이 변할 수 있어, 인지 변화를 추적하는 데 사용되기도 합니다.

## 결과를 어떻게 해석할까요

해람검사실의 억제지속 주의력 검사는 [여기](/test/sustained-inhibition)에서 진행하실 수 있습니다.

가장 중요한 두 지표는 잘못 누른 횟수와 평균 반응 속도입니다. 잘못 누른 횟수가 많으면 반응 억제가 약하다는 신호이고, 반응 속도가 너무 느리면 주의가 충분히 깨어 있지 않거나 지나치게 신중한 패턴일 수 있습니다.

이 검사 한 번의 결과로 어떤 진단을 내리는 것은 적절하지 않습니다. 다만 본인이 평소 충동적인 결정으로 어려움을 겪고 계시고 검사 결과에서도 잘못 누른 횟수가 많이 나오신다면, 이는 임상에서 함께 살펴볼 만한 정보가 됩니다. 본인의 평소 패턴을 객관적으로 점검해 보시는 출발점으로 삼으시면 좋습니다.
`,
  },
  {
    slug: "flanker-test-attention",
    title: "주위의 방해 자극을 무시하고 목표에만 집중하기: 간섭선택 주의력 검사 자세히 보기",
    content: `중요한 일을 처리해야 하는데 옆 동료의 통화 소리가 자꾸 신경 쓰여 본인의 일에 집중하기 어려우셨던 경험이 있으실 겁니다. 우리 뇌가 여러 자극 중에서 목표가 되는 자극에만 집중하고, 그 주위의 방해 자극은 무시하는 능력을 간섭 억제(interference suppression)라고 부릅니다.

이를 측정하는 표준 검사가 바로 간섭선택 주의력 검사, 학술 용어로는 Flanker 검사입니다. 이름은 다소 생소할 수 있지만, 일상에서 우리가 가장 자주 부딪히는 인지 부담 중 하나를 단순화해 측정합니다.

## 검사의 기원

Flanker 검사는 1974년 심리학자 에릭센 부부(B.A. & C.W. Eriksen)가 처음 고안했습니다. 화면 가운데에 목표 자극이 있고 그 양옆에 같은 모양의 방해 자극이 배치됩니다. 양옆의 자극이 목표와 같은 방향이면 일치(congruent) 조건, 반대 방향이면 비일치(incongruent) 조건이 됩니다. 일치 조건보다 비일치 조건에서 반응이 느려지는 정도가 곧 간섭의 크기입니다.

이 효과가 신경심리학에서 중요한 이유는 일상에서 우리가 끊임없이 겪는 갈등 상황을 단순화한 것이기 때문입니다. 다른 자극이 끼어들어도 본래 하던 일에 집중을 유지하는 능력이 떨어지면, 일상의 거의 모든 인지 활동이 영향을 받습니다.

## 무엇과 관련이 있나요

Flanker 과제를 수행할 때는 전대상피질과 배외측 전전두피질이 핵심 역할을 합니다. 이 영역들은 갈등을 감지하고 그에 맞게 주의를 재배치하는 기능을 담당합니다. ADHD, 불안장애, 우울증, 외상후 스트레스장애에서 이 회로의 기능이 변화한다는 연구가 다수 보고되고 있습니다.

특히 노년기 인지 기능 평가에서도 자주 사용되는데, Flanker 검사 점수가 일상생활 수행 능력과 상관관계를 보인다는 연구가 있습니다. 즉 단순한 컴퓨터 과제이지만, 실제 생활에서의 집중력과 적지 않은 연관성을 가집니다.

## 결과를 어떻게 해석할까요

해람검사실의 간섭선택 주의력 검사는 [여기](/test/interference-attention)에서 진행하실 수 있습니다. 정답 수와 평균 반응 속도가 함께 보고됩니다.

이 검사에서 본인의 결과를 가장 잘 활용하는 방법은 비교 기준을 가지는 것입니다. 평소 컨디션이 좋을 때 한 번 측정해 두시고, 이후 본인의 변화를 확인하는 도구로 사용하시면 됩니다. 결과가 평소보다 크게 떨어졌고 일상에서도 비슷한 어려움이 있으시다면, 그 배경이 되는 컨디션 요인(수면, 스트레스, 우울감, 갑상선 기능)을 먼저 점검해 보시는 것이 좋습니다.

간섭 억제 능력은 마음챙김 명상, 규칙적인 유산소 운동, 충분한 수면을 통해 일정 부분 향상될 수 있다는 연구가 있습니다. 다만 직장 또는 학업에서 명확한 지장을 받고 계시다면 정신건강의학과 진료를 통해 정밀하게 평가받아 보시기를 권합니다.
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

function makeDownloadUrl(
  bucketName: string,
  storagePath: string,
  token: string,
): string {
  const encoded = encodeURIComponent(storagePath)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27");
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

async function uploadImage(
  buffer: Buffer,
  slug: string,
  index: number,
): Promise<string> {
  const bucket = getStorage().bucket();
  const storagePath = `blog-images/posts/${slug}/section-${index}.png`;
  const file = bucket.file(storagePath);
  const downloadToken = randomUUID();
  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
      metadata: {firebaseStorageDownloadTokens: downloadToken},
    },
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

async function processPost(post: BlogDraft) {
  console.log(`\n=== ${post.slug} ===`);
  const db = getFirestore();
  const ref = db.collection("posts").doc(post.slug);

  // 기존 Storage 이미지 삭제 (재실행 안전성)
  const bucket = getStorage().bucket();
  const [existing] = await bucket.getFiles({prefix: `blog-images/posts/${post.slug}/`});
  for (const f of existing) {
    try {
      await f.delete();
    } catch {
      // ignore
    }
  }

  const sections = splitSections(post.content);
  console.log(`섹션 수: ${sections.length}`);

  const sectionsWithImages: string[] = [];
  let imageIndex = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (
      section.startsWith("## 참고 문헌") ||
      section.startsWith("## 참고 자료")
    ) {
      sectionsWithImages.push(section);
      continue;
    }
    console.log(`  [${i + 1}/${sections.length}] 이미지 생성...`);
    const buf = await generateImage(section);
    if (buf) {
      imageIndex++;
      const url = await uploadImage(buf, post.slug, imageIndex);
      console.log("    ", url);
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
    categories: ["집중력"],
    featuredImage,
    author: "해람정신건강의학과",
    updatedAt: Timestamp.now(),
  });

  console.log(`✓ ${post.slug} 저장 완료`);
}

async function run() {
  for (const post of posts) {
    await processPost(post);
  }
  console.log("\n전체 완료");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
