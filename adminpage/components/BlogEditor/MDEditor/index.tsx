"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const Editor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <Editor
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        preview="edit"
        height={420}
        visibleDragbar={false}
      />
    </div>
  );
}
