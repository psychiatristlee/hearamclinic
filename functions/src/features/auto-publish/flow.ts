import {onCall, HttpsError} from "firebase-functions/https";
import {onSchedule} from "firebase-functions/scheduler";
import {logger} from "firebase-functions";
import {getFirestore, Timestamp, FieldValue} from "firebase-admin/firestore";
import {GoogleGenAI} from "@google/genai";
import {
  apiKey,
  generateBlogText,
  reviewWithGemini,
  splitSections,
  type TopicOutline,
} from "../generate-post/flow";
import {generateImage} from "../generate-image";
import {createGenkitInstance, uploadImage} from "../../shared";

const CONFIG_DOC_PATH = "adminConfig/blogAutoPublish";
const DEFAULT_AUTHOR = "해람정신건강의학과";
const SYSTEM_USER_ID = "auto-publisher";

interface AutoPublishConfig {
  enabled: boolean;
  publishHours: number[];
  // legacy 단일 필드 - fallback용
  publishHour?: number;
  defaultAuthor: string;
  lastPublishedDate?: string;
  publishedHoursToday?: number[];
  lastPublishedAt?: Timestamp;
  lastPublishedSlug?: string;
  lastPublishedTitle?: string;
  lastError?: string;
  lastErrorAt?: Timestamp;
}

interface SuggestedTopic {
  title: string;
  reason: string;
  outline: TopicOutline;
}

// 관리자 권한 확인
function verifyAdminAuth(
  request: {auth?: {token: Record<string, unknown>} | null},
): void {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  }
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "admin 권한이 필요합니다.");
  }
}

// KST 기준 현재 시, 날짜(YYYY-MM-DD) 계산
function getKstNow(): {hour: number; dateStr: string} {
  const now = new Date();
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hour12: false,
    }).format(now),
    10,
  );
  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return {hour, dateStr};
}

// 트렌드 기반 주제 1개 선정 (카테고리 반영)
async function pickTrendingTopic(
  ai: GoogleGenAI,
  category: string,
): Promise<SuggestedTopic> {
  const db = getFirestore();
  const recentPostsSnap = await db.collection("posts")
    .orderBy("date", "desc")
    .limit(50)
    .select("title")
    .get();
  const existingTitles = recentPostsSnap.docs
    .map((d) => d.data().title as string);

  const excludeClause = existingTitles.length > 0 ?
    `\n\n중요: 다음 주제들은 이미 작성되었습니다. 동일하거나 유사한 주제는 절대 제외하고 완전히 다른 새로운 주제를 추천하세요:\n${existingTitles.map((t) => `- ${t}`).join("\n")}` :
    "";

  const sleepHint = category === "수면" ?
    `\n\n[수면 카테고리 가이드 — 다양성 확보]\n같은 주제(예: 수면위생 일반론)가 반복되지 않도록 아래 영역들 중에서 골라 다양하게 다루세요:\n- 불면증의 진단 기준과 종류, 만성 vs 일과성\n- 수면 단계(REM/NREM)와 각 단계의 기능\n- 수면 부족이 우울·불안·집중력에 미치는 영향\n- 일주기 리듬(circadian rhythm), 광 노출, 시간대 관리\n- 폐쇄성 수면무호흡증과 정신건강\n- 코로나·갱년기·산후 등 특정 시기 수면 변화\n- 수면제 종류별 차이와 안전한 사용\n- CBT-I(불면 인지행동치료) 기법\n- 멜라토닌과 빛 노출의 과학적 근거\n- 악몽 장애, 사건수면, 하지불안증후군\n- 청소년·노년기 수면 특성\n- 카페인·알코올·운동 타이밍이 수면에 미치는 영향\n- 수면 추적 기기와 데이터 해석\n- 시차증과 교대 근무 적응` :
    "";

  const categoryClause = category ?
    `\n\n★ 이번 글은 반드시 "${category}" 카테고리에 부합하는 주제여야 합니다. 제목, 인트로, 소제목, 본문 요약 모두 "${category}"와 직접 관련된 내용이어야 합니다. 다른 카테고리와 혼용하지 마세요.${sleepHint}` :
    "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `당신은 정신건강의학과 전문의이자 블로그 운영자입니다.
웹 검색을 통해 현재 사람들이 가장 관심을 갖고 있는 정신건강 관련 주제를 파악하세요.

지금(${new Date().toISOString().split("T")[0]}) 기준으로 최근 뉴스, SNS, 검색 트렌드에서 화제가 되고 있는 정신건강 관련 주제 중 블로그 글로 작성하기 가장 좋은 주제 1개를 골라주세요.

기준:
- 최근 뉴스, SNS, 검색 트렌드에서 화제가 되는 정신건강 관련 주제
- 일반인이 지금 궁금해할 만한 정신건강 정보
- 정신건강의학과 전문의가 설명하면 도움이 될 주제
${categoryClause}
${excludeClause}

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{"title":"블로그 글 제목","reason":"왜 지금 이 주제가 유용한지 한 줄 설명","outline":{"intro":"인트로에서 다룰 내용 요약","sections":[{"heading":"소제목1","summary":"이 섹션에서 다룰 핵심 내용"},{"heading":"소제목2","summary":"이 섹션에서 다룰 핵심 내용"},{"heading":"소제목3","summary":"이 섹션에서 다룰 핵심 내용"}]}}`,
    config: {
      tools: [{googleSearch: {}}],
    },
  });

  const text = (response.text ?? "").trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("주제 추천 결과를 파싱할 수 없습니다.");
  }
  return JSON.parse(jsonMatch[0]) as SuggestedTopic;
}

// 활성화된 카테고리 중 하나를 선택. 최근 발행 빈도가 낮은 카테고리에 가중치 부여.
// 수면 카테고리는 항상 최소 2배 가중치를 가져 꾸준히 노출됨.
async function pickRandomCategory(): Promise<string> {
  const db = getFirestore();
  const [catSnap, recentSnap] = await Promise.all([
    db.collection("categories").get(),
    db
      .collection("posts")
      .orderBy("date", "desc")
      .limit(20)
      .select("categories")
      .get(),
  ]);
  const names = catSnap.docs
    .map((d) => (d.data().name as string) || "")
    .filter((n) => n.trim().length > 0);
  if (names.length === 0) return "";

  // 최근 20개 글에서 각 카테고리 출현 빈도
  const freq: Record<string, number> = {};
  for (const n of names) freq[n] = 0;
  for (const doc of recentSnap.docs) {
    const cats = (doc.data().categories as string[]) || [];
    for (const c of cats) {
      if (freq[c] !== undefined) freq[c] += 1;
    }
  }

  // 가중치: 적게 등장한 카테고리에 더 높은 가중치 (max-freq+1)
  // 수면은 항상 +2 추가 가중치
  const maxFreq = Math.max(...Object.values(freq), 0);
  const weighted: string[] = [];
  for (const n of names) {
    let weight = maxFreq - freq[n] + 1;
    if (n === "수면") weight += 2;
    for (let i = 0; i < weight; i++) weighted.push(n);
  }
  return weighted[Math.floor(Math.random() * weighted.length)];
}

// excerpt 생성
function buildExcerpt(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);
}

// slug 정규화
function toSlug(title: string): string {
  return title
    .replace(/\s+/g, "-")
    .toLowerCase()
    .replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);
}

// 자동 발행 실행 본체
async function runAutoPublish(): Promise<{
  slug: string;
  title: string;
  category: string;
}> {
  const db = getFirestore();
  const ai = new GoogleGenAI({apiKey: apiKey.value()});

  const category = await pickRandomCategory();
  logger.info("[autoPublish] 선택된 카테고리", {category});

  logger.info("[autoPublish] 트렌드 주제 선정 시작");
  const topic = await pickTrendingTopic(ai, category);
  logger.info("[autoPublish] 선정된 주제", {title: topic.title, reason: topic.reason});

  logger.info("[autoPublish] 본문 생성 시작");
  const rawMarkdown = await generateBlogText(
    ai, topic.title, topic.outline, undefined,
  );
  const reviewedMarkdown = await reviewWithGemini(ai, rawMarkdown);
  const cleanedMarkdown = reviewedMarkdown
    .replace(/!\[[^\]]*\]\(https?:\/\/[^)]+\)\n*/g, "")
    .replace(/\n*\*출처:[^*]*\*/g, "")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/(\d+)~(\d+)/g, "$1-$2");

  const titleMatch = cleanedMarkdown.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1] ?? topic.title;
  const bodyContent = cleanedMarkdown.replace(/^#\s+.+\n*/m, "").trimStart();
  const baseSlug = toSlug(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  logger.info("[autoPublish] 이미지 생성 시작", {slug});
  const genkitAi = createGenkitInstance(apiKey.value());
  const sections = splitSections(bodyContent);
  const sectionsWithImages: string[] = [];
  let imageIndex = 0;

  if (sections.length > 0) {
    try {
      const introBuffer = await generateImage(genkitAi, sections[0]);
      if (introBuffer) {
        imageIndex++;
        const introUrl = await uploadImage(
          introBuffer, SYSTEM_USER_ID, slug, imageIndex,
        );
        sectionsWithImages.push(sections[0] + `\n\n![](${introUrl})`);
      } else {
        sectionsWithImages.push(sections[0]);
      }
    } catch (err) {
      logger.error("[autoPublish] 인트로 이미지 생성 실패", err);
      sectionsWithImages.push(sections[0]);
    }
  }

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    if (
      section.startsWith("## 참고 문헌") ||
      section.startsWith("## 참고 자료")
    ) {
      sectionsWithImages.push(section);
      continue;
    }
    try {
      const imageBuffer = await generateImage(genkitAi, section);
      if (imageBuffer) {
        imageIndex++;
        const imageUrl = await uploadImage(
          imageBuffer, SYSTEM_USER_ID, slug, imageIndex,
        );
        sectionsWithImages.push(section + `\n\n![](${imageUrl})`);
      } else {
        sectionsWithImages.push(section);
      }
    } catch (err) {
      logger.error("[autoPublish] 섹션 이미지 생성 실패", err);
      sectionsWithImages.push(section);
    }
  }

  const finalContent = sectionsWithImages.join("\n\n");
  const firstImageMatch = finalContent.match(
    /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/,
  );
  const featuredImage = firstImageMatch?.[0] ?? "";

  const configSnap = await db.doc(CONFIG_DOC_PATH).get();
  const author = (configSnap.data()?.defaultAuthor as string) || DEFAULT_AUTHOR;

  logger.info("[autoPublish] Firestore 저장 시작", {slug, title, category});
  await db.collection("posts").doc(slug).set({
    title,
    slug,
    content: finalContent,
    excerpt: buildExcerpt(finalContent),
    date: FieldValue.serverTimestamp(),
    categories: category ? [category] : [],
    featuredImage,
    author,
    autoPublished: true,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {slug, title, category};
}

// 매시 정각(KST)에 실행 → 설정 확인 후 자동 발행
export const autoPublishBlog = onSchedule(
  {
    schedule: "0 * * * *",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
    secrets: [apiKey],
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async () => {
    const db = getFirestore();
    const configRef = db.doc(CONFIG_DOC_PATH);
    const configSnap = await configRef.get();
    const config = (configSnap.data() || {}) as Partial<AutoPublishConfig>;

    if (!config.enabled) {
      logger.info("[autoPublish] 자동 발행 비활성화 상태, 건너뜀");
      return;
    }

    // publishHours 배열 우선, 없으면 legacy publishHour 사용
    const publishHours = Array.isArray(config.publishHours) &&
      config.publishHours.length > 0 ?
      config.publishHours :
      [typeof config.publishHour === "number" ? config.publishHour : 9];

    const {hour: kstHour, dateStr: todayStr} = getKstNow();

    if (!publishHours.includes(kstHour)) {
      logger.info("[autoPublish] 발행 시각 아님, 건너뜀", {
        kstHour,
        publishHours,
      });
      return;
    }

    // 오늘 해당 시각에 이미 발행했는지 확인
    const publishedHoursToday = config.lastPublishedDate === todayStr &&
      Array.isArray(config.publishedHoursToday) ?
      config.publishedHoursToday :
      [];

    if (publishedHoursToday.includes(kstHour)) {
      logger.info("[autoPublish] 이 시각에 이미 발행됨, 건너뜀", {
        kstHour,
        publishedHoursToday,
      });
      return;
    }

    try {
      const {slug, title, category} = await runAutoPublish();
      await configRef.set({
        lastPublishedDate: todayStr,
        publishedHoursToday: [...publishedHoursToday, kstHour],
        lastPublishedAt: FieldValue.serverTimestamp(),
        lastPublishedSlug: slug,
        lastPublishedTitle: title,
        lastPublishedCategory: category,
        lastError: "",
      }, {merge: true});
      logger.info("[autoPublish] 발행 완료", {slug, title, category});
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("[autoPublish] 발행 실패", err);
      await configRef.set({
        lastError: message,
        lastErrorAt: FieldValue.serverTimestamp(),
      }, {merge: true});
    }
  },
);

// 설정 조회 (editor/admin)
export const getAutoPublishConfig = onCall(
  {
    region: "asia-northeast3",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "인증이 필요합니다.");
    }
    if (
      request.auth.token.admin !== true &&
      request.auth.token.editor !== true
    ) {
      throw new HttpsError(
        "permission-denied",
        "editor 또는 admin 권한이 필요합니다.",
      );
    }

    const db = getFirestore();
    const snap = await db.doc(CONFIG_DOC_PATH).get();
    const data = (snap.data() || {}) as Partial<AutoPublishConfig> & {
      lastPublishedCategory?: string;
    };
    const publishHours = Array.isArray(data.publishHours) &&
      data.publishHours.length > 0 ?
      data.publishHours :
      [typeof data.publishHour === "number" ? data.publishHour : 9];
    return {
      enabled: data.enabled ?? false,
      publishHours,
      defaultAuthor: data.defaultAuthor ?? DEFAULT_AUTHOR,
      lastPublishedDate: data.lastPublishedDate ?? "",
      publishedHoursToday: data.publishedHoursToday ?? [],
      lastPublishedSlug: data.lastPublishedSlug ?? "",
      lastPublishedTitle: data.lastPublishedTitle ?? "",
      lastPublishedCategory: data.lastPublishedCategory ?? "",
      lastPublishedAt: data.lastPublishedAt?.toMillis() ?? null,
      lastError: data.lastError ?? "",
      lastErrorAt: data.lastErrorAt?.toMillis() ?? null,
    };
  },
);

// 설정 업데이트 (admin 전용)
export const updateAutoPublishConfig = onCall(
  {
    region: "asia-northeast3",
  },
  async (request) => {
    verifyAdminAuth(request);

    const enabled = request.data?.enabled;
    const publishHours = request.data?.publishHours;
    const defaultAuthor = request.data?.defaultAuthor;

    const updates: Record<string, unknown> = {};
    if (typeof enabled === "boolean") {
      updates.enabled = enabled;
    }
    if (Array.isArray(publishHours)) {
      if (publishHours.length === 0 || publishHours.length > 6) {
        throw new HttpsError(
          "invalid-argument",
          "하루 발행 개수는 1에서 6 사이여야 합니다.",
        );
      }
      const normalized: number[] = [];
      for (const raw of publishHours) {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0 || n > 23) {
          throw new HttpsError(
            "invalid-argument",
            "각 발행 시간은 0에서 23 사이여야 합니다.",
          );
        }
        const hour = Math.floor(n);
        if (!normalized.includes(hour)) normalized.push(hour);
      }
      normalized.sort((a, b) => a - b);
      updates.publishHours = normalized;
    }
    if (typeof defaultAuthor === "string" && defaultAuthor.trim()) {
      updates.defaultAuthor = defaultAuthor.trim();
    }
    if (Object.keys(updates).length === 0) {
      throw new HttpsError("invalid-argument", "변경할 설정이 없습니다.");
    }

    const db = getFirestore();
    await db.doc(CONFIG_DOC_PATH).set(updates, {merge: true});
    return {ok: true};
  },
);

// 관리자가 수동으로 즉시 발행 (admin 전용)
export const runAutoPublishNow = onCall(
  {
    region: "asia-northeast3",
    secrets: [apiKey],
    timeoutSeconds: 540,
    memory: "1GiB",
  },
  async (request) => {
    verifyAdminAuth(request);
    try {
      const result = await runAutoPublish();
      const db = getFirestore();
      await db.doc(CONFIG_DOC_PATH).set({
        lastPublishedAt: FieldValue.serverTimestamp(),
        lastPublishedSlug: result.slug,
        lastPublishedTitle: result.title,
        lastPublishedCategory: result.category,
        lastError: "",
      }, {merge: true});
      return {
        ok: true,
        slug: result.slug,
        title: result.title,
        category: result.category,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HttpsError("internal", message);
    }
  },
);
