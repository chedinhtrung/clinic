"use client";

import { useMemo, useState } from "react";
import BlogContentRenderer from "./BlogContentRenderer";
import type { BlogAutosaveStatus, BlogCategory, BlogPost, BlogSubcategory, BlogTag } from "./types";
import { formatBlogUpdatedAt, isPublishedStatus, slugify } from "./utils";

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#787774]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-2 min-h-24 w-full resize-none rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition placeholder:text-[#b9b8b4] focus:border-[#b9b8b4]"
        />
      )}
    </label>
  );
}

type BlogPostEditorAsideProps = {
  post: BlogPost | null;
  autosaveStatus: BlogAutosaveStatus;
  autosavedAt: string | null;
  categoryOptions: BlogCategory[];
  subcategoryOptions: BlogSubcategory[];
  tagOptions: BlogTag[];
  onClose: () => void;
  onUpdatePost: (changes: Partial<BlogPost>) => void;
  onTogglePublish: () => void;
  onDeletePost: () => void;
  onCreateCategory: (name: string) => BlogCategory;
  onCreateSubcategory: (name: string) => BlogSubcategory;
  onCreateTag: (name: string) => BlogTag;
};

export default function BlogPostEditorAside({
  post,
  autosaveStatus,
  autosavedAt,
  categoryOptions,
  subcategoryOptions,
  tagOptions,
  onClose,
  onUpdatePost,
  onTogglePublish,
  onDeletePost,
  onCreateCategory,
  onCreateSubcategory,
  onCreateTag,
}: BlogPostEditorAsideProps) {
  const [tagInputText, setTagInputText] = useState("");
  const previewSlug = post ? slugify(post.title) : "";
  const visibleSlug = post?.slug ?? previewSlug;
  const postUrl = visibleSlug ? `https://blogs.chedinhnghia.com/${visibleSlug}` : null;
  const hasPermanentSlug = Boolean(post?.slug);
  const autosaveLabel =
    autosaveStatus === "saving"
      ? "Saving..."
      : autosaveStatus === "saved"
        ? `Saved ${autosavedAt ? new Date(autosavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}`
        : autosaveStatus === "error"
          ? "Save failed"
          : "Not saved yet";

  const suggestedTagOptions = useMemo(() => {
    const normalizedInput = tagInputText.trim().toLowerCase();
    const selectedTags = new Set(post?.tags.map((tag) => tag.id) ?? []);

    return tagOptions.filter((tag) => {
      const normalizedTag = tag.name.toLowerCase();
      return !selectedTags.has(tag.id) && (!normalizedInput || normalizedTag.includes(normalizedInput));
    });
  }, [post, tagInputText, tagOptions]);

  function commitCategory(value: string) {
    if (!post) {
      return;
    }

    const normalizedName = value.trim();
    if (!normalizedName) {
      onUpdatePost({ category: post.category });
      return;
    }

    const category =
      categoryOptions.find((option) => option.name.toLowerCase() === normalizedName.toLowerCase()) ??
      onCreateCategory(normalizedName);
    onUpdatePost({ category });
  }

  function commitSubcategory(value: string) {
    const normalizedName = value.trim();
    if (!normalizedName) {
      onUpdatePost({ subcategory: null });
      return;
    }

    const subcategory =
      subcategoryOptions.find((option) => option.name.toLowerCase() === normalizedName.toLowerCase()) ??
      onCreateSubcategory(normalizedName);
    onUpdatePost({ subcategory });
  }

  function addTag(value: string) {
    if (!post) {
      return;
    }

    const normalizedName = value.trim();
    if (!normalizedName) {
      return;
    }

    const tag =
      tagOptions.find((option) => option.name.toLowerCase() === normalizedName.toLowerCase()) ??
      onCreateTag(normalizedName);
    const tagExists = post.tags.some((currentTag) => currentTag.id === tag.id);
    setTagInputText("");

    if (!tagExists) {
      onUpdatePost({ tags: [...post.tags, tag] });
    }
  }

  function removeTag(tagToRemove: BlogTag) {
    onUpdatePost({ tags: post?.tags.filter((tag) => tag.id !== tagToRemove.id) ?? [] });
  }

  return (
    <>
      {post && <div className="absolute inset-0 z-20 bg-[#37352f]/10 backdrop-blur-[1px]" onClick={onClose} />}

      <aside
        className={`absolute bottom-0 right-0 top-0 z-30 flex w-full max-w-[70vw] flex-col border-l border-[#e3e2df] bg-white shadow-[-24px_0_50px_rgba(55,53,47,0.16)] transition-transform duration-300 ${
          post ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {post && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-[#e3e2df] px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-[#787774]">Last edited</p>
                <p className="mt-1 text-sm text-[#37352f]">{formatBlogUpdatedAt(post.updatedAt)}</p>
                <p
                  className={`mt-1 text-xs ${
                    autosaveStatus === "error" ? "text-[#b94034]" : "text-[#787774]"
                  }`}
                >
                  {autosaveLabel}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#37352f]">Publish</span>
                  <button
                    type="button"
                    aria-pressed={isPublishedStatus(post.status)}
                    onClick={onTogglePublish}
                    className={`relative h-6 w-11 rounded-full transition ${
                      isPublishedStatus(post.status) ? "bg-[#2f7d54]" : "bg-[#d8d2c6]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        isPublishedStatus(post.status) ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close editor"
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none text-[#787774] transition hover:bg-[#f1f1ef] hover:text-[#37352f]"
                >
                  x
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <input
                value={post.title}
                onChange={(event) => onUpdatePost({ title: event.target.value })}
                placeholder="Untitled"
                className="w-full bg-transparent text-4xl font-bold tracking-tight text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
              />

              <div className="block">
                <span className="text-xs font-medium text-[#787774]">
                  {hasPermanentSlug ? "Post URL" : "Preview URL"}
                </span>
                {postUrl ? (
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate rounded-md bg-[#f7f6f3] px-3 py-2 text-sm text-[#2f6f9f] transition hover:bg-[#e9e9e7] hover:text-[#1f4f73]"
                  >
                    {postUrl}
                  </a>
                ) : (
                  <div className="mt-2 rounded-md bg-[#f7f6f3] px-3 py-2 text-sm text-[#787774]">
                    Add a title to preview the public URL.
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
                <label className="block">
                  <span className="text-xs font-medium text-[#787774]">Category</span>
                  <input
                    list="blog-category-options"
                    value={post.category.name}
                    onChange={(event) => onUpdatePost({ category: { ...post.category, name: event.target.value } })}
                    onBlur={(event) => commitCategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitCategory(event.currentTarget.value);
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition focus:border-[#b9b8b4]"
                  />
                  <datalist id="blog-category-options">
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.name} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#787774]">Subcategory</span>
                  <input
                    list="blog-subcategory-options"
                    value={post.subcategory?.name ?? ""}
                    onChange={(event) =>
                      onUpdatePost({
                        subcategory: event.target.value
                          ? { id: post.subcategory?.id ?? `pending-sub-${Date.now()}`, name: event.target.value }
                          : null,
                      })
                    }
                    onBlur={(event) => commitSubcategory(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitSubcategory(event.currentTarget.value);
                      }
                    }}
                    className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition focus:border-[#b9b8b4]"
                  />
                  <datalist id="blog-subcategory-options">
                    {subcategoryOptions.map((subcategory) => (
                      <option key={subcategory.id} value={subcategory.name} />
                    ))}
                  </datalist>
                </label>

                <div className="block">
                  <span className="text-xs font-medium text-[#787774]">Tags</span>
                  <div className="mt-2 rounded-md border border-[#e3e2df] bg-white px-2 py-2 transition focus-within:border-[#b9b8b4]">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex max-w-full items-center gap-1 rounded bg-[#f1f1ef] px-2 py-1 text-xs text-[#5f5e5b]"
                        >
                          <span className="truncate">{tag.name}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${tag.name}`}
                            onClick={() => removeTag(tag)}
                            className="rounded px-1 text-[#787774] transition hover:bg-[#e3e2df] hover:text-[#37352f]"
                          >
                            x
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInputText}
                        onChange={(event) => setTagInputText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addTag(event.currentTarget.value);
                          }
                        }}
                        placeholder={post.tags.length === 0 ? "Type a tag, then press Enter" : "Add tag and press Enter"}
                        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                      />
                    </div>
                  </div>
                  {tagInputText.trim() && suggestedTagOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedTagOptions.slice(0, 6).map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => addTag(tag.name)}
                          className="rounded bg-[#f7f6f3] px-2 py-1 text-xs text-[#5f5e5b] transition hover:bg-[#e3e2df] hover:text-[#37352f]"
                        >
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <TextField
                label="Short description"
                value={post.shortDescription}
                onChange={(shortDescription) => onUpdatePost({ shortDescription })}
                placeholder="Short summary for the landing page card"
                multiline
              />

              <TextField
                label="Cover image"
                value={post.coverImageUrl ?? ""}
                onChange={(coverImageUrl) =>
                  onUpdatePost({ coverImageUrl: coverImageUrl.trim() ? coverImageUrl : null })
                }
                placeholder="https://.../cover-image.jpg"
              />

              {post.coverImageUrl ? (
                <div className="overflow-hidden rounded-md border border-[#e3e2df] bg-[#f7f6f3]">
                  <img
                    src={post.coverImageUrl}
                    alt={post.title || "Blog cover preview"}
                    className="h-48 w-full object-cover"
                  />
                </div>
              ) : null}

              <section className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-[#787774]">Content</p>
                </div>
                <BlogContentRenderer
                  blocks={post.contentBlocks}
                  editable
                  onChange={(contentBlocks) => onUpdatePost({ contentBlocks })}
                />
              </section>

              <div className="rounded-md border border-[#f0d3cf] bg-[#fff8f6] p-4">
                <p className="font-medium text-[#8a2f24]">Danger zone</p>
                <p className="mt-1 text-xs leading-5 text-[#9b5a51]">Xóa bài viết trên trang chedinhnghia.com</p>
                <button
                  type="button"
                  onClick={onDeletePost}
                  className="mt-4 rounded-md border border-[#d7675b] px-3 py-2 text-sm font-medium text-[#b94034] transition hover:bg-[#d7675b] hover:text-white"
                >
                  Xóa bài
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
