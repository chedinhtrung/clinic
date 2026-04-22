import type { BlogContentBlock } from "../types";
import { getSlashMatches } from "./blockCommands";
import type { TextBlock } from "./blockFactories";

type SlashMenuProps = {
  block: TextBlock;
  onSelect: (type: BlogContentBlock["type"]) => void;
};

// Render the small Notion-style block picker only for the active text block.
export default function SlashMenu({ block, onSelect }: SlashMenuProps) {
  const matches = getSlashMatches(block);

  return (
    <div className="absolute left-10 top-full z-20 mt-1 w-64 rounded-md border border-[#e3e2df] bg-white p-1 shadow-[0_10px_30px_rgba(55,53,47,0.14)]">
      <div className="px-2 py-1.5 text-xs font-medium text-[#787774]">Blocks</div>
      {matches.length === 0 ? (
        <p className="px-2 py-2 text-sm text-[#9b9a97]">No matching block</p>
      ) : (
        matches.map((command) => {
          const Icon = command.icon;

          return (
            <button
              key={command.type}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(command.type)}
              className="flex w-full items-center gap-3 rounded px-2 py-2 text-left transition hover:bg-[#f1f1ef]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded border border-[#e3e2df] text-[#5f5e5b]">
                <Icon size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#37352f]">{command.label}</span>
                <span className="block truncate text-xs text-[#787774]">{command.hint}</span>
              </span>
            </button>
          );
        })
      )}
    </div>
  );
}
