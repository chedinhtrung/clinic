"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";

type PatientNotesEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function PatientNotesEditor({ value, onChange }: PatientNotesEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
        preview="edit"
        height={320}
        visibleDragbar={false}
      />
    </div>
  );
}
