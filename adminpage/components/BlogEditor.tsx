"use client";

import { useMemo, useState } from "react";

type BlogStatus = "Draft" | "Published";

type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  category: string;
  subcategory: string | null;
  tags: string[];
  status: BlogStatus;
  updatedAt: string;
  shortDescription: string;
};

type BackendSearchStatus = "idle" | "searching" | "not-found" | "error";

const mockPosts: BlogPost[] = [
  {
    id: "post-1",
    title: "Noi soi khop goi: khi nao nen thuc hien?",
    slug: "noi-soi-khop-goi-khi-nao-nen-thuc-hien",
    category: "Y khoa",
    subcategory: "Chan thuong the thao",
    tags: ["noi-soi", "dau-goi", "phuc-hoi"],
    status: "Published",
    updatedAt: "2026-04-20",
    shortDescription:
      "Tong quan ngan gon ve chi dinh noi soi khop goi va nhung dau hieu can tham kham som.",
  },
  {
    id: "post-2",
    title: "Phuc hoi sau tai tao day chang cheo truoc",
    slug: null,
    category: "Ca lam sang",
    subcategory: "Bao cao dieu tri",
    tags: ["acl", "the-thao", "vat-ly-tri-lieu"],
    status: "Draft",
    updatedAt: "2026-04-19",
    shortDescription:
      "Ban nhap ve qua trinh theo doi va phuc hoi van dong sau chan thuong ACL.",
  },
  {
    id: "post-3",
    title: "Dau goi khi chay bo: nhung dieu can luu y",
    slug: "dau-goi-khi-chay-bo-nhung-dieu-can-luu-y",
    category: "Y khoa",
    subcategory: "Phuc hoi chuc nang",
    tags: ["dau-goi", "chay-bo"],
    status: "Published",
    updatedAt: "2026-04-18",
    shortDescription:
      "Cac dau hieu thuong gap, cach giam tai tam thoi va thoi diem nen di kham.",
  },
  {
    id: "post-4",
    title: "Cap nhat lich kham va hoat dong chuyen mon thang 4",
    slug: null,
    category: "Tin tuc",
    subcategory: "Thong bao",
    tags: ["lich-kham"],
    status: "Draft",
    updatedAt: "2026-04-17",
    shortDescription:
      "Thong bao lich kham, lich nghi va cac chuong trinh chuyen mon trong thang.",
  },
];

const initialCategoryOptions = ["Y khoa", "Ca lam sang", "Tin tuc", "Bai viet"];
const initialSubcategoryOptions = [
  "Chan thuong the thao",
  "Phuc hoi chuc nang",
  "Bao cao dieu tri",
  "Thong bao",
];

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createUniqueSlug(title: string, existingSlugs: Array<string | null>) {
  const baseSlug = slugify(title) || "untitled";
  const takenSlugs = new Set(existingSlugs.filter((slug): slug is string => Boolean(slug)));

  if (!takenSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

// Temporary backend boundary: replace this with the real database search when the API is ready.
async function searchBackendPostsByName(searchText: string): Promise<BlogPost[]> {
  void searchText;
  return [];
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#787774]">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 min-h-24 w-full resize-none rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition focus:border-[#b9b8b4]"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm text-[#37352f] outline-none transition focus:border-[#b9b8b4]"
        />
      )}
    </label>
  );
}

export default function BlogEditor() {
  // Local cache of posts currently loaded in the admin UI.
  const [posts, setPosts] = useState<BlogPost[]>(mockPosts);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(mockPosts[0]?.id ?? null);
  // Table query controls: tag/category filtering is local; name search can fall back to the backend.
  const [filterText, setFilterText] = useState("");
  const [nameSearchText, setNameSearchText] = useState("");
  const [backendSearchStatus, setBackendSearchStatus] = useState<BackendSearchStatus>("idle");
  // Draft text for the tag composer before a comma commits it into a pill.
  const [tagInputText, setTagInputText] = useState("");
  // Suggestion caches for values that may later come from lookup tables.
  const [categoryOptions, setCategoryOptions] = useState(initialCategoryOptions);
  const [subcategoryOptions, setSubcategoryOptions] = useState(initialSubcategoryOptions);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  const filteredPosts = useMemo(() => {
    const filters = filterText
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const normalizedNameSearch = nameSearchText.trim().toLowerCase();

    return posts.filter((post) => {
      if (normalizedNameSearch && !post.title.toLowerCase().includes(normalizedNameSearch)) {
        return false;
      }

      if (filters.length === 0) {
        return true;
      }

      const searchableFields = [post.category, post.subcategory, ...post.tags]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());

      return filters.every((filter) => searchableFields.some((field) => field.includes(filter)));
    });
  }, [filterText, nameSearchText, posts]);

  // Tag suggestions are derived from loaded posts until a backend tag endpoint exists.
  const tagOptions = useMemo(
    () =>
      Array.from(new Set(posts.flatMap((post) => post.tags))).sort((firstTag, secondTag) =>
        firstTag.localeCompare(secondTag)
      ),
    [posts]
  );

  const suggestedTagOptions = useMemo(() => {
    const normalizedInput = tagInputText.trim().toLowerCase();
    const selectedTags = new Set(selectedPost?.tags.map((tag) => tag.toLowerCase()) ?? []);

    return tagOptions.filter((tag) => {
      const normalizedTag = tag.toLowerCase();
      return !selectedTags.has(normalizedTag) && (!normalizedInput || normalizedTag.includes(normalizedInput));
    });
  }, [selectedPost, tagInputText, tagOptions]);

  const selectedPostPreviewSlug = selectedPost ? slugify(selectedPost.title) : "";
  const selectedPostVisibleSlug = selectedPost?.slug ?? selectedPostPreviewSlug;
  const selectedPostUrl = selectedPostVisibleSlug
    ? `https://blogs.chedinhnghia.com/${selectedPostVisibleSlug}`
    : null;
  const selectedPostHasPermanentSlug = Boolean(selectedPost?.slug);

  // Update a post in the frontend cache and bump its mock last-edited date.
  function updatePost(postId: string, changes: Partial<BlogPost>) {
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              ...changes,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : post
      )
    );
  }

  function updateSelectedPost(changes: Partial<BlogPost>) {
    if (!selectedPost) {
      return;
    }

    updatePost(selectedPost.id, changes);
  }

  // Mock publish flow: the real backend will return the final permanent slug.
  function toggleSelectedPostPublish() {
    if (!selectedPost) {
      return;
    }

    if (selectedPost.status === "Published") {
      updateSelectedPost({ status: "Draft" });
      return;
    }

    updateSelectedPost({
      status: "Published",
      slug: selectedPost.slug ?? createUniqueSlug(selectedPost.title, posts.map((post) => post.slug)),
    });
  }

  // Search locally first; only ask the backend when the current cache has no matching title.
  async function searchPostsByName() {
    const normalizedSearch = nameSearchText.trim().toLowerCase();
    if (!normalizedSearch) {
      setBackendSearchStatus("idle");
      return;
    }

    const localMatch = posts.find((post) => post.title.toLowerCase().includes(normalizedSearch));
    if (localMatch) {
      setSelectedPostId(localMatch.id);
      setBackendSearchStatus("idle");
      return;
    }

    setBackendSearchStatus("searching");

    try {
      const backendPosts = await searchBackendPostsByName(nameSearchText.trim());

      if (backendPosts.length === 0) {
        setBackendSearchStatus("not-found");
        return;
      }

      setPosts((currentPosts) => {
        const currentIds = new Set(currentPosts.map((post) => post.id));
        const newPosts = backendPosts.filter((post) => !currentIds.has(post.id));
        return [...newPosts, ...currentPosts];
      });
      setSelectedPostId(backendPosts[0].id);
      setBackendSearchStatus("idle");
    } catch {
      setBackendSearchStatus("error");
    }
  }

  // Create a frontend-only draft; persistence will happen through the future backend save flow.
  function addDraftPost() {
    const createdAt = Date.now();
    const draft: BlogPost = {
      id: `post-${createdAt}`,
      title: "",
      slug: null,
      category: "Y khoa",
      subcategory: null,
      tags: [],
      status: "Draft",
      updatedAt: new Date().toISOString().slice(0, 10),
      shortDescription: "A short summary for the landing page card.",
    };

    setPosts((currentPosts) => [draft, ...currentPosts]);
    setSelectedPostId(draft.id);
  }

  // Remove the active post from the local cache.
  function deleteSelectedPost() {
    if (!selectedPost) {
      return;
    }

    const shouldDelete = window.confirm("Bạn có thật sự muốn xóa bài blog này?");
    if (!shouldDelete) {
      return;
    }

    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== selectedPost.id));
    setSelectedPostId(null);
  }

  // Category is required, so blank input falls back to the existing category.
  function commitCategory(value: string) {
    const normalizedName = value.trim();
    if (!normalizedName) {
      updateSelectedPost({ category: selectedPost?.category ?? initialCategoryOptions[0] });
      return;
    }

    setCategoryOptions((currentOptions) =>
      currentOptions.some((category) => category.toLowerCase() === normalizedName.toLowerCase())
        ? currentOptions
        : [...currentOptions, normalizedName]
    );
    updateSelectedPost({ category: normalizedName });
  }

  // Subcategory is optional; blank input intentionally stores null.
  function commitSubcategory(value: string) {
    const normalizedName = value.trim();
    if (!normalizedName) {
      updateSelectedPost({ subcategory: null });
      return;
    }

    setSubcategoryOptions((currentOptions) =>
      currentOptions.some((subcategory) => subcategory.toLowerCase() === normalizedName.toLowerCase())
        ? currentOptions
        : [...currentOptions, normalizedName]
    );
    updateSelectedPost({ subcategory: normalizedName });
  }

  // Add a typed or suggested tag while avoiding case-insensitive duplicates.
  function addTag(value: string) {
    const normalizedTag = value.trim();
    if (!selectedPost || !normalizedTag) {
      return;
    }

    const tagExists = selectedPost.tags.some((tag) => tag.toLowerCase() === normalizedTag.toLowerCase());
    if (tagExists) {
      setTagInputText("");
      return;
    }

    updateSelectedPost({ tags: [...selectedPost.tags, normalizedTag] });
    setTagInputText("");
  }

  // Remove one tag pill from the selected post.
  function removeTag(tagToRemove: string) {
    updateSelectedPost({
      tags: selectedPost?.tags.filter((tag) => tag !== tagToRemove) ?? [],
    });
  }

  return (
    <main className="relative flex min-w-0 flex-1 overflow-hidden bg-[#fbfbfa] text-[#37352f]">
      <section className="flex min-w-0 flex-1 flex-col px-10 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#787774]">Blog Workspace</p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[#37352f]">Bài viết</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
              Tạo, edit, quản lý và publish bài viết trên trang chedinhnghia.com
            </p>
          </div>
          <button
            type="button"
            onClick={addDraftPost}
            className="rounded-md bg-[#37352f] px-3 py-2 text-sm font-medium text-white transition hover:bg-black"
          >
            New
          </button>
        </div>

        <div className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-[#787774]">
              Filter by category, subcategory, or tags
            </span>
            <input
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              placeholder="acl, Y khoa, phuc hoi"
              className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b9b8b4]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#787774]">Search by name</span>
            <input
              value={nameSearchText}
              onChange={(event) => {
                setNameSearchText(event.target.value);
                setBackendSearchStatus("idle");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void searchPostsByName();
                }
              }}
              onBlur={() => {
                void searchPostsByName();
              }}
              placeholder="Noi soi khop goi"
              className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b9b8b4]"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden border-y border-[#e3e2df] bg-white">
          <div className="grid grid-cols-[2.4fr_1fr_1fr_1.4fr_0.8fr_0.7fr] border-b border-[#e3e2df] bg-[#f7f6f3] px-3 py-2 text-xs font-medium text-[#787774]">
            <div>Name</div>
            <div>Category</div>
            <div>Subcategory</div>
            <div>Tags</div>
            <div>Status</div>
            <div>Updated</div>
          </div>

          <div className="max-h-[calc(100vh-17rem)] overflow-y-auto">
            {filteredPosts.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[#787774]">
                {backendSearchStatus === "searching" && "Searching database..."}
                {backendSearchStatus === "not-found" && "No matching post found in the database."}
                {backendSearchStatus === "error" && "Database search failed."}
                {backendSearchStatus === "idle" && "No posts match the current filters."}
              </div>
            )}

            {filteredPosts.map((post) => {
              const isSelected = post.id === selectedPostId;

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedPostId(post.id);
                    }
                  }}
                  className={`group grid cursor-pointer grid-cols-[2.4fr_1fr_1fr_1.4fr_0.8fr_0.7fr] items-center border-b border-[#efefed] px-3 py-2 text-left text-sm transition hover:bg-[#f7f6f3] focus:outline-none focus-visible:bg-[#f7f6f3] ${
                    isSelected ? "bg-[#f1f1ef]" : "bg-white"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <input
                      value={post.title}
                      onChange={(event) => updatePost(post.id, { title: event.target.value })}
                      onFocus={() => setSelectedPostId(post.id)}
                      placeholder="Untitled"
                      className="min-w-0 flex-1 truncate bg-transparent px-1 py-1 font-medium text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                    />
                  </div>
                  <div className="truncate text-[#787774]">{post.category}</div>
                  <div className="truncate text-[#787774]">{post.subcategory ?? ""}</div>
                  <div className="flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-[#f1f1ef] px-2 py-0.5 text-xs text-[#5f5e5b]">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        post.status === "Published"
                          ? "bg-[#e4f4eb] text-[#2f7d54]"
                          : "bg-[#f7ead9] text-[#9b6a1f]"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <div className="text-xs text-[#787774]">{post.updatedAt}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {selectedPost && (
        <div
          className="absolute inset-0 z-20 bg-[#37352f]/10 backdrop-blur-[1px]"
          onClick={() => setSelectedPostId(null)}
        />
      )}

      <aside
        className={`absolute bottom-0 right-0 top-0 z-30 flex w-full max-w-[50vw] flex-col border-l border-[#e3e2df] bg-white shadow-[-24px_0_50px_rgba(55,53,47,0.16)] transition-transform duration-300 ${
          selectedPost ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selectedPost && (
          <>
            <div className="flex items-center justify-between gap-4 border-b border-[#e3e2df] px-6 py-4">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase text-[#787774]">Last edited</p>
                <p className="mt-1 text-sm text-[#37352f]">{selectedPost.updatedAt}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#37352f]">Publish</span>
                  <button
                    type="button"
                    aria-pressed={selectedPost.status === "Published"}
                    onClick={toggleSelectedPostPublish}
                    className={`relative h-6 w-11 rounded-full transition ${
                      selectedPost.status === "Published" ? "bg-[#2f7d54]" : "bg-[#d8d2c6]"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                        selectedPost.status === "Published" ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Close editor"
                  onClick={() => setSelectedPostId(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none text-[#787774] transition hover:bg-[#f1f1ef] hover:text-[#37352f]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
              <input
                value={selectedPost.title}
                onChange={(event) => updateSelectedPost({ title: event.target.value })}
                placeholder="Untitled"
                className="w-full bg-transparent text-4xl font-bold tracking-tight text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
              />

              <div className="block">
                <span className="text-xs font-medium text-[#787774]">
                  {selectedPostHasPermanentSlug ? "Post URL" : "Preview URL"}
                </span>
                {selectedPostUrl ? (
                  <a
                    href={selectedPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate rounded-md bg-[#f7f6f3] px-3 py-2 text-sm text-[#2f6f9f] transition hover:bg-[#e9e9e7] hover:text-[#1f4f73]"
                  >
                    {selectedPostUrl}
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
                    value={selectedPost.category}
                    onChange={(event) => updateSelectedPost({ category: event.target.value })}
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
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#787774]">Subcategory</span>
                  <input
                    list="blog-subcategory-options"
                    value={selectedPost.subcategory ?? ""}
                    onChange={(event) => updateSelectedPost({ subcategory: event.target.value })}
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
                      <option key={subcategory} value={subcategory} />
                    ))}
                  </datalist>
                </label>

                <div className="block">
                  <span className="text-xs font-medium text-[#787774]">Tags</span>
                  <div className="mt-2 rounded-md border border-[#e3e2df] bg-white px-2 py-2 transition focus-within:border-[#b9b8b4]">
                    <div className="flex flex-wrap gap-2">
                      {selectedPost.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex max-w-full items-center gap-1 rounded bg-[#f1f1ef] px-2 py-1 text-xs text-[#5f5e5b]"
                        >
                          <span className="truncate">{tag}</span>
                          <button
                            type="button"
                            aria-label={`Remove ${tag}`}
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
                          if (event.key === ",") {
                            event.preventDefault();
                            addTag(event.currentTarget.value);
                          }
                        }}
                        placeholder={selectedPost.tags.length === 0 ? "Type a tag, then comma" : "Add tag"}
                        className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-[#37352f] outline-none placeholder:text-[#b9b8b4]"
                      />
                    </div>
                  </div>
                  {tagInputText.trim() && suggestedTagOptions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {suggestedTagOptions.slice(0, 6).map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTag(tag)}
                          className="rounded bg-[#f7f6f3] px-2 py-1 text-xs text-[#5f5e5b] transition hover:bg-[#e3e2df] hover:text-[#37352f]"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <TextField
                label="Short description"
                value={selectedPost.shortDescription}
                onChange={(shortDescription) => updateSelectedPost({ shortDescription })}
                multiline
              />

              <div className="rounded-md border border-[#f0d3cf] bg-[#fff8f6] p-4">
                <p className="font-medium text-[#8a2f24]">Danger zone</p>
                <p className="mt-1 text-xs leading-5 text-[#9b5a51]">
                  Xóa bài blog trên trang chedinhnghia.com
                </p>
                <button
                  type="button"
                  onClick={deleteSelectedPost}
                  className="mt-4 rounded-md border border-[#d7675b] px-3 py-2 text-sm font-medium text-[#b94034] transition hover:bg-[#d7675b] hover:text-white"
                >
                  Xóa bài blog
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </main>
  );
}
