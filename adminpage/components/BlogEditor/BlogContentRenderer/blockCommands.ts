import { Heading1, ImageIcon, LinkIcon, Pilcrow, Video } from "lucide-react";
import type { BlogContentBlock } from "../types";
import type { TextBlock } from "./blockFactories";

export type SlashCommand = {
  type: BlogContentBlock["type"];
  label: string;
  hint: string;
  keywords: string[];
  icon: typeof Pilcrow;
};

export const slashCommands: SlashCommand[] = [
  { type: "paragraph", label: "Text", hint: "Plain paragraph", keywords: ["p", "text", "paragraph"], icon: Pilcrow },
  { type: "heading", label: "Heading", hint: "Section title", keywords: ["h", "heading", "title"], icon: Heading1 },
  { type: "image", label: "Image", hint: "Add image URL", keywords: ["image", "img", "photo"], icon: ImageIcon },
  { type: "youtube", label: "YouTube", hint: "Embed a video", keywords: ["youtube", "video", "yt"], icon: Video },
  { type: "link", label: "Link", hint: "Callout link", keywords: ["link", "url"], icon: LinkIcon },
];

// Match slash commands by label or keyword so shorthand like /img and /h feels natural.
export function getSlashMatches(block: TextBlock) {
  const query = block.text.replace(/^\//, "").trim().toLowerCase();

  return slashCommands.filter((command) => {
    if (!query) {
      return true;
    }

    return command.keywords.some((keyword) => keyword.includes(query)) || command.label.toLowerCase().includes(query);
  });
}
