import { GripVertical, Trash2 } from "lucide-react";
import type { DragEvent } from "react";
import type { BlogContentBlock } from "../types";
import { slashCommands } from "./blockCommands";

type BlockHandleProps = {
  block: BlogContentBlock;
  blockIndex: number;
  isOpen: boolean;
  canDelete: boolean;
  onOpenChange: (blockId: string | null) => void;
  onTurnInto: (type: BlogContentBlock["type"]) => void;
  onDelete: () => void;
  onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
};

// The handle is the only per-block chrome: click for options, drag for reordering.
export default function BlockHandle({
  block,
  blockIndex,
  isOpen,
  canDelete,
  onOpenChange,
  onTurnInto,
  onDelete,
  onDragStart,
  onDragEnd,
}: BlockHandleProps) {
  return (
    <div className="absolute -left-8 top-1.5 flex opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
      <button
        type="button"
        aria-label="Block options"
        draggable
        onClick={() => onOpenChange(isOpen ? null : block.id)}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex h-7 w-7 cursor-grab items-center justify-center rounded text-[#9b9a97] transition hover:bg-[#f1f1ef] hover:text-[#37352f] active:cursor-grabbing"
      >
        <GripVertical size={16} />
      </button>
      {isOpen && (
        <div className="absolute left-8 top-0 z-30 w-48 rounded-md border border-[#e3e2df] bg-white p-1 shadow-[0_10px_30px_rgba(55,53,47,0.14)]">
          {slashCommands.map((command) => {
            const Icon = command.icon;
            return (
              <button
                key={command.type}
                type="button"
                onClick={() => onTurnInto(command.type)}
                className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#37352f] transition hover:bg-[#f1f1ef]"
              >
                <Icon size={15} /> Turn into {command.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={onDelete}
            disabled={!canDelete}
            className="flex w-full items-center gap-2 rounded px-2 py-2 text-sm text-[#9b5a51] transition hover:bg-[#fff1ef] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 size={15} /> Delete
          </button>
          {blockIndex === 0 && <div className="mt-1 border-t border-[#f1f1ef] px-2 py-1 text-xs text-[#9b9a97]">Drag handle to reorder</div>}
        </div>
      )}
    </div>
  );
}
