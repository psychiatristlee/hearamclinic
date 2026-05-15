/**
 * Big 5 / 에니어그램 성격 검사 블로그 2개를 생성하고 각 섹션에 이미지를 추가한다.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/create-personality-blog-posts.ts
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
}

const posts: BlogDraft[] = [
  {
    slug: "big5-personality-test-explained",
    title: "성격을 5가지 차원으로 들여다보다: Big 5 성격 검사 자세히 보기",
    content: `"저는 어떤 사람일까요"라는 질문은 진료실에서도 자주 듣는 말씀입니다. 성격에 대한 호기심은 자기 이해와 직접 연결되며, 내가 왜 어떤 상황에서 특정한 방식으로 반응하는지 단서를 주기 때문입니다. 심리학에서 가장 폭넓게 검증된 성격 모델이 바로 Big 5(Big Five) 성격 모델입니다.

해람검사실에는 이 모델에 기반한 무료 자가 검사가 마련되어 있습니다. 이번 글에서는 Big 5의 다섯 차원이 무엇을 의미하는지, 그리고 검사 결과를 어떻게 활용하시면 좋을지 자세히 살펴보겠습니다.

## Big 5는 어떻게 만들어졌나

Big 5는 1930년대부터 시작된 어휘 가설(lexical hypothesis)의 흐름에서 발전했습니다. 인간이 서로의 성격을 묘사할 때 사용하는 단어들을 모아 분석하면, 그 안에 인간 성격의 본질적인 차원이 드러난다는 가정에서 출발했습니다.

이후 1980년대에 Costa와 McCrae 등의 연구를 거치며, 다양한 문화권과 언어에서 반복적으로 다섯 가지 큰 차원이 안정되게 나타난다는 것이 확인되었습니다. 이 다섯 가지가 개방성(O), 성실성(C), 외향성(E), 친화성(A), 정서 민감성(N)입니다. 영문 머리글자를 따 OCEAN이라고 부르기도 합니다.

오늘날 Big 5는 학계에서 가장 많이 인용되는 성격 모델이며, 임상 심리학, 인사 선발, 사회 심리학 연구에 폭넓게 사용되고 있습니다.

## 다섯 가지 차원이 의미하는 것

개방성은 새로운 경험과 아이디어에 얼마나 열려 있는지를 보여줍니다. 점수가 높으시면 추상적인 사고와 예술적 감수성이 풍부하고, 낮으시면 검증된 방식과 안정성을 선호하시는 경향이 있습니다.

성실성은 계획성과 자기 조절 능력을 보여줍니다. 점수가 높으시면 책임감 있고 체계적이지만, 너무 높으면 완벽주의적 경향이 부담이 될 수 있습니다.

외향성은 사회적 자극에서 에너지를 얻는 정도를 보여줍니다. 외향성이 높다고 해서 더 좋은 것이 아니라, 자신에게 맞는 환경과 페이스를 이해하는 단서가 됩니다.

친화성은 타인에 대한 공감과 협력의 경향을 보여줍니다. 점수가 높으시면 따뜻한 관계를 만드시지만, 너무 높으면 자기 욕구를 뒤로 미루는 경향이 함께 따라올 수 있습니다.

정서 민감성은 감정의 결이 얼마나 쉽게 흔들리는지를 보여줍니다. 높다는 것이 곧 문제를 뜻하지는 않으며, 깊은 공감과 예술적 감수성의 기반이 되기도 합니다. 다만 스트레스 관리에 의식적인 노력이 도움이 됩니다.

## 검사 결과를 어떻게 해석할까요

Big 5의 결과를 보실 때 가장 중요한 것은 좋고 나쁨의 잣대로 보지 않는 것입니다. 각 차원은 양극단 모두 적응적인 측면과 도전적인 측면을 함께 가지고 있습니다. 외향성이 낮다고 해서 사회성이 부족한 것이 아니라, 깊이 있는 한두 명과의 관계를 더 잘 가꾸시는 분일 수 있습니다.

검사 결과는 자기 이해의 출발점입니다. 왜 나는 이런 상황에서 이렇게 반응할까에 대한 단서를 얻으시면, 그에 맞게 일과 관계의 환경을 조율하실 수 있습니다. 또 가까운 사람과 결과를 공유하시면 서로의 차이를 더 잘 이해하시는 데 도움이 됩니다.

다만 결과는 응답 시점의 컨디션, 최근의 스트레스, 인생의 큰 변화에 영향을 받습니다. 시간이 지난 후 다시 해보시면 약간의 변화가 있을 수 있으며, 그 흐름 자체가 본인의 변화 과정을 보여 주는 정보가 됩니다.

## 해람검사실의 Big 5 검사 안내

해람검사실의 Big 5 성격 검사는 [여기](/personality/big5)에서 진행하실 수 있습니다. 40문항의 5점 척도 응답 후, 5축 레이더 차트와 32개 성격 유형 중 본인에게 가장 가까운 유형 하나를 안내해 드립니다.

각 유형에는 캐릭터 일러스트와 함께 강점, 유의할 점, 차원별 해석이 함께 제공됩니다. 결과 화면에서 공유 버튼으로 가까운 사람과 결과를 비교해 보시는 것도 흥미로운 활용법입니다.

본 검사는 자가 점검 도구로, 의학적 진단을 대체하지 않습니다. 다만 본인의 성격적 강점과 성장의 방향을 파악하시고, 일상에서 작은 조정의 단서를 얻으시는 데 도움이 될 수 있습니다.
`,
  },
  {
    slug: "enneagram-personality-test-explained",
    title: "9가지 성격 유형으로 마음의 동기를 만나다: 에니어그램 검사 자세히 보기",
    content: `사람의 성격을 이해하는 방법에는 여러 길이 있습니다. Big 5처럼 차원으로 살펴보는 방식이 있다면, 에니어그램(Enneagram)은 9개의 유형으로 사람을 구분하면서 그 안의 핵심 동기와 두려움을 살피는 방식입니다. 모든 사람의 행동 패턴 뒤에는 무엇을 향하고 무엇을 피하려 하는 마음이 있다는 가정에서 출발합니다.

해람검사실에는 에니어그램 자가 검사가 마련되어 있습니다. 이번 글에서는 9개 유형이 어떻게 정리되었는지, 그리고 검사 결과를 어떻게 활용하시면 좋을지 자세히 안내해 드리겠습니다.

## 에니어그램의 흐름과 9개 유형

에니어그램은 고대의 영적 전통과 20세기의 심리학적 통찰이 만난 모델입니다. 1970년대 들어 오스카 이차조(Oscar Ichazo)와 클라우디오 나란조(Claudio Naranjo) 등의 작업을 통해 현대적인 9가지 유형 체계로 정리되었고, 이후 리소-허드슨(Riso-Hudson) 모델 등을 거치며 대중적으로 확산되었습니다.

9개 유형은 다음과 같이 부릅니다. 1번 개혁가, 2번 조력가, 3번 성취자, 4번 예술가, 5번 탐구자, 6번 충성가, 7번 낙천가, 8번 도전가, 9번 평화주의자입니다. 각 유형은 단순히 행동 양식을 분류하는 것이 아니라, 그 사람이 무의식적으로 추구하는 동기와 회피하려는 두려움을 함께 살핍니다.

## 핵심 동기와 핵심 두려움이 보여 주는 것

에니어그램이 다른 성격 모델과 구별되는 지점은 바로 이 동기와 두려움의 축입니다. 예를 들어 같은 꼼꼼하게 일을 하시는 분이라도, 1번 유형은 옳고 좋은 일을 하기 위한 동기에서, 3번 유형은 유능한 사람으로 인정받기 위한 동기에서 그렇게 하실 수 있습니다.

표면 행동이 비슷해 보여도 그 뒤의 동기가 다르면 같은 상황에서의 반응과 스트레스 패턴도 다릅니다. 그래서 에니어그램은 자기 이해의 깊이를 더하시는 데 유용합니다. 본인이 어떤 상황에서 자주 무거워지는지, 어떤 인정에서 안도감을 느끼시는지를 알아차리시는 단서가 됩니다.

또 에니어그램은 양옆에 있는 두 유형, 곧 날개(wing)의 영향을 함께 봅니다. 예를 들어 9번 평화주의자라도 8번 날개가 강하면 더 추진력 있는 모습이, 1번 날개가 강하면 더 원칙적인 모습이 함께 드러납니다.

## 검사 결과를 어떻게 활용할까요

에니어그램은 본인을 9개 중 하나로 단순히 분류하는 도구가 아닙니다. 본인의 무의식적 패턴을 살피시고, 스트레스 상황과 안정 상황에서 어떤 모습이 나오시는지를 이해하시는 출발점입니다.

또 가까운 사람의 유형을 함께 알면 갈등의 원인을 더 명확히 보실 수 있습니다. 같은 메시지가 다르게 들리는 이유, 어떤 표현이 상대에게 더 닿는지를 짐작하시는 데 도움이 됩니다.

다만 검사 결과는 절대적이지 않습니다. 어린 시절의 환경, 가족 관계, 그리고 인생의 큰 사건들이 같은 사람 안에서 다른 유형의 모습을 끌어내기도 합니다. 시간이 지나서 다시 해보시면 다른 결과가 나올 수도 있고, 그 자체가 본인의 변화 과정을 보여 줍니다.

## 해람검사실의 에니어그램 검사 안내

해람검사실의 에니어그램 성격 검사는 [여기](/personality/enneagram)에서 진행하실 수 있습니다. 36문항의 5점 척도 응답 후, 9개 유형 중 본인의 주 유형과 양옆의 날개 유형을 함께 안내해 드립니다.

결과 화면에서는 9개 유형 점수의 레이더 차트, 본인 유형의 캐릭터 일러스트, 핵심 동기와 두려움, 강점과 유의할 점이 함께 제공됩니다. 친구나 가족과 결과를 공유하시면 서로의 다른 결을 발견하시는 출발점이 될 수 있습니다.

에니어그램은 학술적 타당도에서 Big 5만큼 강한 검증을 받지는 않았으나, 자기 성찰의 도구로 오랫동안 사랑받아 온 모델입니다. 본인의 내적 동기를 살피시는 데 보조적인 거울로 활용하시기를 권합니다.
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

async function ensureCategory(name: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("categories").get();
  const exists = snap.docs.some((d) => (d.data().name as string) === name);
  if (exists) {
    console.log(`카테고리 이미 존재: ${name}`);
    return;
  }
  const order = snap.size; // 마지막에 추가
  await db.collection("categories").add({
    name,
    order,
    createdAt: Timestamp.now(),
  });
  console.log(`카테고리 추가: ${name} (order=${order})`);
}

async function processPost(post: BlogDraft, category: string) {
  console.log(`\n=== ${post.slug} ===`);
  const db = getFirestore();
  const ref = db.collection("posts").doc(post.slug);

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
    categories: [category],
    featuredImage,
    author: "해람정신건강의학과",
    updatedAt: Timestamp.now(),
  });

  console.log(`✓ ${post.slug} 저장 완료`);
}

async function run() {
  const category = "성격";
  await ensureCategory(category);
  for (const post of posts) {
    await processPost(post, category);
  }
  console.log("\n전체 완료");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
