"use client";

import { useEffect, useRef, useState } from "react";
import {
  callChat,
  savePracticeSession,
  type ChatMessage,
} from "@/lib/care";
import CareTabsNav from "@/components/care/CareTabsNav";

const INTRO_MESSAGE: ChatMessage = {
  role: "model",
  text:
    "안녕하세요. 저는 해람 동행이에요. 정식 상담사나 의사는 아니지만, 마음에 떠오르는 이야기를 함께 들어 드릴 수 있어요. 인지행동치료(CBT)와 수용전념치료(ACT)의 결로 부드럽게 안내해 드릴게요.\n\n오늘은 어떤 마음으로 오셨나요?",
};

export default function CounselorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [crisisVisible, setCrisisVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    const userMessage: ChatMessage = { role: "user", text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      // 시스템 인트로는 history에서 제외 (모델이 같은 인트로를 재생성하지 않게)
      const historyForApi = nextMessages.filter(
        (m, i) => !(i === 0 && m.role === "model" && m === INTRO_MESSAGE),
      );
      // 마지막 user 메시지는 별도 인자
      const sendHistory = historyForApi.slice(0, -1);
      const data = await callChat(text, sendHistory);

      const reply: ChatMessage = { role: "model", text: data.reply };
      setMessages((prev) => [...prev, reply]);

      if (data.crisisDetected) {
        setCrisisVisible(true);
      }

      // 세션 저장 (로그인 시)
      savePracticeSession(
        "chat",
        { message: text },
        { reply: data.reply, crisisDetected: data.crisisDetected },
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "답변 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleReset() {
    setMessages([INTRO_MESSAGE]);
    setCrisisVisible(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CareTabsNav />
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-purple-900 mb-1">💬 해람 동행</h1>
        <p className="text-sm text-gray-600">
          CBT와 ACT의 결로 마음을 함께 살피는 자가 돌봄 챗봇
        </p>
      </div>

      {crisisVisible && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-bold text-red-900 mb-2">
            지금 도움이 필요하실 수 있어요
          </h3>
          <ul className="text-sm text-red-900 space-y-1">
            <li>• 자살예방상담전화 <strong>1393</strong> (24시간)</li>
            <li>• 정신건강 위기 상담전화 <strong>1577-0199</strong> (24시간)</li>
            <li>• 응급 시 <strong>119</strong></li>
          </ul>
          <p className="text-xs text-red-700 mt-2">
            저는 의료 전문가가 아닙니다. 위 전화는 훈련받은 분들이 함께해 주십니다.
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl flex flex-col" style={{ minHeight: "60vh" }}>
        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-md"
                    : "bg-purple-50 text-gray-800 rounded-bl-md"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-purple-50 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="마음에 떠오르는 이야기를 적어 주세요 (Enter로 전송, Shift+Enter로 줄바꿈)"
              rows={2}
              disabled={loading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm resize-none disabled:bg-gray-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-medium rounded-lg transition self-end"
            >
              보내기
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">
              본 대화는 진단·치료를 대체하지 않습니다.
            </p>
            <button
              onClick={handleReset}
              className="text-xs text-purple-600 hover:underline"
            >
              새 대화 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
