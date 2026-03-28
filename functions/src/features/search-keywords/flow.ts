import {onCall, HttpsError} from "firebase-functions/https";
import {GoogleAuth} from "google-auth-library";
import {verifyEditorAuth} from "../../shared";

const SITE_URL = "https://hearam.kr";
const SEARCH_CONSOLE_API =
  "https://searchconsole.googleapis.com/webmasters/v3";

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export const getSearchKeywords = onCall(
  {
    timeoutSeconds: 30,
    memory: "256MiB",
    region: "asia-northeast3",
  },
  async (request) => {
    verifyEditorAuth(request);

    try {
      const auth = new GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
      });
      const client = await auth.getClient();

      // 최근 28일 데이터 조회
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() - 3); // GSC 데이터는 2-3일 지연
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 28);

      const formatDate = (d: Date) => d.toISOString().split("T")[0];

      const url = `${SEARCH_CONSOLE_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`;

      const response = await client.request<{rows?: SearchAnalyticsRow[]}>({
        url,
        method: "POST",
        data: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          dimensions: ["query"],
          rowLimit: 30,
          type: "web",
        },
      });

      const rows = response.data.rows ?? [];
      const keywords: SearchKeyword[] = rows.map((row) => ({
        query: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 1000) / 10,
        position: Math.round(row.position * 10) / 10,
      }));

      return {keywords};
    } catch (err) {
      console.error("[getSearchKeywords] error:", err);
      throw new HttpsError(
        "internal",
        "검색 키워드를 가져오는 데 실패했습니다.",
      );
    }
  },
);
