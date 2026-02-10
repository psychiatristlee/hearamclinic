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
  toolbarPlugin,
  BoldItalicUnderlineToggles,
  StrikeThroughSupSubToggles,
  BlockTypeSelect,
  CodeToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  UndoRedo,
  Separator,
  DiffSourceToggleWrapper,
  type MDXEditorMethods,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { forwardRef } from "react";
import dynamic from "next/dynamic";

interface MarkdownEditorProps {
  markdown: string;
  onChange: (markdown: string) => void;
}

const MarkdownEditorBase = forwardRef<MDXEditorMethods, MarkdownEditorProps>(
  ({ markdown, onChange }, ref) => {
    return (
      <MDXEditor
        ref={ref}
        markdown={markdown}
        onChange={onChange}
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
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <Separator />
                <BlockTypeSelect />
                <Separator />
                <BoldItalicUnderlineToggles />
                <StrikeThroughSupSubToggles />
                <CodeToggle />
                <Separator />
                <ListsToggle />
                <Separator />
                <CreateLink />
                <InsertImage />
                <InsertTable />
                <InsertThematicBreak />
                <Separator />
                <DiffSourceToggleWrapper>
                  {" "}
                </DiffSourceToggleWrapper>
              </>
            ),
          }),
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
