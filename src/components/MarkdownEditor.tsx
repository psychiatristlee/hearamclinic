"use client";

import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  thematicBreakPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { forwardRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { floatingToolbarPlugin } from "./FloatingToolbar";

// Escape <text> where text starts with non-ASCII (Korean etc.) — not valid HTML/JSX
function escapeNonHtmlTags(md: string): string {
  return md.replace(/<(\/?)([^\x00-\x7F][^>]*)>/g, "&lt;$1$2&gt;");
}

function unescapeNonHtmlTags(md: string): string {
  return md.replace(/&lt;(\/?)([^\x00-\x7F][^&]*)&gt;/g, "<$1$2>");
}

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

const MarkdownEditorBase = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ markdown, onChange }, ref) => {
    const safeMarkdown = escapeNonHtmlTags(markdown);
    const handleChange = useCallback(
      (value: string) => onChange(unescapeNonHtmlTags(value)),
      [onChange]
    );

    return (
      <MDXEditor
        ref={ref}
        markdown={safeMarkdown}
        onChange={handleChange}
        contentEditableClassName="prose prose-lg max-w-none min-h-[500px] focus:outline-none"
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          imagePlugin({
            imageUploadHandler: async () => "/placeholder.png",
          }),
          tablePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              js: "JavaScript",
              ts: "TypeScript",
              css: "CSS",
              html: "HTML",
              python: "Python",
              "": "Plain Text",
            },
          }),
          markdownShortcutPlugin(),
          diffSourcePlugin({ viewMode: "rich-text" }),
          floatingToolbarPlugin(),
        ]}
      />
    );
  }
);

MarkdownEditorBase.displayName = "MarkdownEditorBase";

const MarkdownEditor = dynamic(
  () => Promise.resolve(MarkdownEditorBase),
  { ssr: false }
) as typeof MarkdownEditorBase;

export type { MDXEditorMethods };
export default MarkdownEditor;
