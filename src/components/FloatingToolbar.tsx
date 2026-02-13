"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  activeEditor$,
  currentBlockType$,
  applyBlockType$,
  openLinkEditDialog$,
  realmPlugin,
  addEditorWrapper$,
  type BlockType,
} from "@mdxeditor/editor";
import { useCellValue, usePublisher } from "@mdxeditor/gurx";
import {
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
  type TextFormatType,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $getNearestNodeOfType } from "@lexical/utils";

type Coords = { x: number; y: number } | null;

function getSelectionCoords(): Coords {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width === 0) return null;
  return {
    x: rect.left + rect.width / 2,
    y: rect.top - 8,
  };
}

/* ── 버튼 컴포넌트들 ── */

function ToolbarButton({
  label,
  icon,
  isActive,
  onMouseDown,
}: {
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onMouseDown(e);
      }}
      className={`px-1.5 py-1.5 text-xs rounded transition-colors ${
        isActive
          ? "bg-purple-100 text-purple-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-0.5" />;
}

/* ── 메인 플로팅 툴바 ── */

function FloatingToolbarUI() {
  const editor = useCellValue(activeEditor$);
  const currentBlockType = useCellValue(currentBlockType$);
  const applyBlockType = usePublisher(applyBlockType$);
  const openLinkDialog = usePublisher(openLinkEditDialog$);
  const [coords, setCoords] = useState<Coords>(null);
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    superscript: false,
    subscript: false,
    code: false,
  });
  const [isList, setIsList] = useState<"ul" | "ol" | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbar = useCallback(() => {
    if (!editor) return;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
        setFormats({
          bold: selection.hasFormat("bold"),
          italic: selection.hasFormat("italic"),
          underline: selection.hasFormat("underline"),
          strikethrough: selection.hasFormat("strikethrough"),
          superscript: selection.hasFormat("superscript"),
          subscript: selection.hasFormat("subscript"),
          code: selection.hasFormat("code"),
        });
        // 리스트 상태 감지
        const anchorNode = selection.anchor.getNode();
        const parentList = $getNearestNodeOfType(anchorNode, ListNode);
        if (parentList && $isListNode(parentList)) {
          setIsList(parentList.getTag() === "ol" ? "ol" : "ul");
        } else {
          setIsList(null);
        }
        requestAnimationFrame(() => {
          setCoords(getSelectionCoords());
        });
      } else {
        setCoords(null);
      }
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const unregister = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterUpdate = editor.registerUpdateListener(() => {
      updateToolbar();
    });

    return () => {
      unregister();
      unregisterUpdate();
    };
  }, [editor, updateToolbar]);

  // 리스트 상태는 updateToolbar에서 함께 추적

  if (!coords || !editor) return null;

  const toolbarWidth = 400;
  const left = Math.max(8, Math.min(coords.x - toolbarWidth / 2, window.innerWidth - toolbarWidth - 8));

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const toggleBlockType = (type: BlockType) => {
    applyBlockType(currentBlockType === type ? "paragraph" : type);
  };

  const toggleList = (type: "ul" | "ol") => {
    if (isList === type) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(
        type === "ul" ? INSERT_UNORDERED_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
        undefined
      );
    }
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "fixed",
        left: `${left}px`,
        top: `${coords.y}px`,
        transform: "translateY(-100%)",
        zIndex: 50,
      }}
      className="flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-lg px-1.5 py-1"
    >
      {/* 블록 타입 */}
      <ToolbarButton
        label="제목 2"
        icon={<span className="font-bold text-[11px]">H2</span>}
        isActive={currentBlockType === "h2"}
        onMouseDown={() => toggleBlockType("h2")}
      />
      <ToolbarButton
        label="제목 3"
        icon={<span className="font-bold text-[11px]">H3</span>}
        isActive={currentBlockType === "h3"}
        onMouseDown={() => toggleBlockType("h3")}
      />
      <ToolbarButton
        label="인용"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        }
        isActive={currentBlockType === "quote"}
        onMouseDown={() => toggleBlockType("quote")}
      />

      <Divider />

      {/* 인라인 서식 */}
      <ToolbarButton
        label="굵게 (Ctrl+B)"
        icon={<span className="font-bold">B</span>}
        isActive={formats.bold}
        onMouseDown={() => formatText("bold")}
      />
      <ToolbarButton
        label="기울임 (Ctrl+I)"
        icon={<span className="italic">I</span>}
        isActive={formats.italic}
        onMouseDown={() => formatText("italic")}
      />
      <ToolbarButton
        label="밑줄 (Ctrl+U)"
        icon={<span className="underline">U</span>}
        isActive={formats.underline}
        onMouseDown={() => formatText("underline")}
      />
      <ToolbarButton
        label="취소선"
        icon={<span className="line-through">S</span>}
        isActive={formats.strikethrough}
        onMouseDown={() => formatText("strikethrough")}
      />
      <ToolbarButton
        label="위첨자"
        icon={<span className="text-[10px]">X<sup>2</sup></span>}
        isActive={formats.superscript}
        onMouseDown={() => formatText("superscript")}
      />
      <ToolbarButton
        label="아래첨자"
        icon={<span className="text-[10px]">X<sub>2</sub></span>}
        isActive={formats.subscript}
        onMouseDown={() => formatText("subscript")}
      />
      <ToolbarButton
        label="코드"
        icon={<span className="font-mono text-[11px]">&lt;&gt;</span>}
        isActive={formats.code}
        onMouseDown={() => formatText("code")}
      />

      <Divider />

      {/* 리스트 */}
      <ToolbarButton
        label="글머리 기호"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        }
        isActive={isList === "ul"}
        onMouseDown={() => toggleList("ul")}
      />
      <ToolbarButton
        label="번호 매기기"
        icon={
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M4.5 6v.75h.75V5.25H4.5v.75zm0 4.5v.75h.75V10.5H4.5v.75zm0 4.5v.75h.75V15H4.5v.75z" />
          </svg>
        }
        isActive={isList === "ol"}
        onMouseDown={() => toggleList("ol")}
      />

      <Divider />

      {/* 링크 */}
      <ToolbarButton
        label="링크"
        icon={
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        }
        onMouseDown={() => openLinkDialog()}
      />
    </div>
  );
}

function FloatingToolbarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingToolbarUI />
    </>
  );
}

export const floatingToolbarPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addEditorWrapper$]: FloatingToolbarWrapper,
    });
  },
});
