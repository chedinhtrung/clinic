import type { DragEvent } from "react";

type TrailingWriteAreaProps = {
  onClick: () => void;
  onDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop: (event: DragEvent<HTMLButtonElement>) => void;
};

// The empty tail area behaves like the bottom of a Notion page: click it to continue writing.
export default function TrailingWriteArea({ onClick, onDragOver, onDrop }: TrailingWriteAreaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="block min-h-24 w-full rounded px-1 text-left text-base leading-7 text-transparent outline-none transition hover:bg-[#fbfbfa] focus:bg-[#fbfbfa]"
    >
      Write, or type / for commands
    </button>
  );
}
