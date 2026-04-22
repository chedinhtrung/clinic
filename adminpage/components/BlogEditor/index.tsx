"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBlogLookupData, fetchBlogPostsPage } from "./api";
import BlogPostEditorAside from "./BlogPostEditorAside";
import BlogPostTable from "./BlogPostTable";
import type { BlogCategory, BlogPost, BlogSubcategory, BlogTag, PostLoadStatus } from "./types";
import { BLOG_POST_PAGE_SIZE, createUniqueSlug, FALLBACK_CATEGORY, getTagNames } from "./utils";

function makePendingId(prefix: string, name: string) {
  return `${prefix}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
}

export default function BlogEditor() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postLoadStatus, setPostLoadStatus] = useState<PostLoadStatus>("idle");
  const [filterText, setFilterText] = useState("");
  const [activeFilterText, setActiveFilterText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeSearchText, setActiveSearchText] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<BlogCategory[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<BlogSubcategory[]>([]);
  const [backendTagOptions, setBackendTagOptions] = useState<BlogTag[]>([]);

  useEffect(() => {
    let isCurrentLoad = true;

    async function loadLookupData() {
      const lookupData = await fetchBlogLookupData();
      if (!isCurrentLoad) {
        return;
      }

      setCategoryOptions(lookupData.categories);
      setSubcategoryOptions(lookupData.subcategories);
      setBackendTagOptions(lookupData.tags);
    }

    void loadLookupData();

    return () => {
      isCurrentLoad = false;
    };
  }, []);

  useEffect(() => {
    let isCurrentLoad = true;

    async function loadPostPage() {
      setPostLoadStatus("loading");

      try {
        const response = await fetchBlogPostsPage({
          page: currentPage,
          pageSize: BLOG_POST_PAGE_SIZE,
          searchText: activeSearchText,
          filterText: activeFilterText,
        });

        if (!isCurrentLoad) {
          return;
        }

        setPosts(response.posts);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        setTotalPosts(response.totalPosts);
        setSelectedPostId((currentSelectedPostId) =>
          response.posts.some((post) => post.id === currentSelectedPostId) ? currentSelectedPostId : null
        );
        setPostLoadStatus("idle");
      } catch {
        if (isCurrentLoad) {
          setPostLoadStatus("error");
        }
      }
    }

    void loadPostPage();

    return () => {
      isCurrentLoad = false;
    };
  }, [activeFilterText, activeSearchText, currentPage]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );
  const tagOptions = useMemo(() => {
    const optionsById = new Map<string, BlogTag>();
    [...backendTagOptions, ...getTagNames(posts)].forEach((tag) => optionsById.set(tag.id, tag));
    return Array.from(optionsById.values()).sort((firstTag, secondTag) =>
      firstTag.name.localeCompare(secondTag.name)
    );
  }, [backendTagOptions, posts]);

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
    if (selectedPost) {
      updatePost(selectedPost.id, changes);
    }
  }

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

  function submitPostQuery() {
    setCurrentPage(1);
    setActiveSearchText(searchText.trim());
    setActiveFilterText(filterText.trim());
  }

  function addDraftPost() {
    const createdAt = Date.now();
    const draft: BlogPost = {
      id: `post-${createdAt}`,
      title: "",
      slug: null,
      category: categoryOptions[0] ?? FALLBACK_CATEGORY,
      subcategory: null,
      tags: [],
      status: "Draft",
      updatedAt: new Date().toISOString().slice(0, 10),
      shortDescription: "",
      contentBlocks: [],
    };
    const nextTotalPosts = totalPosts + 1;

    setPosts((currentPosts) => [draft, ...currentPosts].slice(0, BLOG_POST_PAGE_SIZE));
    setTotalPosts(nextTotalPosts);
    setTotalPages(Math.max(1, Math.ceil(nextTotalPosts / BLOG_POST_PAGE_SIZE)));
    setSelectedPostId(draft.id);
  }

  function deleteSelectedPost() {
    if (!selectedPost) {
      return;
    }

    const shouldDelete = window.confirm("Ban co that su muon xoa bai blog nay?");
    if (!shouldDelete) {
      return;
    }

    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== selectedPost.id));
    setSelectedPostId(null);
    setTotalPosts((currentTotalPosts) => Math.max(0, currentTotalPosts - 1));
  }

  function createCategory(name: string) {
    const category = { id: makePendingId("pending-cat", name), name };
    setCategoryOptions((currentOptions) => [...currentOptions, category]);
    return category;
  }

  function createSubcategory(name: string) {
    const subcategory = { id: makePendingId("pending-sub", name), name };
    setSubcategoryOptions((currentOptions) => [...currentOptions, subcategory]);
    return subcategory;
  }

  function createTag(name: string) {
    const tag = { id: makePendingId("pending-tag", name), name };
    setBackendTagOptions((currentOptions) => [...currentOptions, tag]);
    return tag;
  }

  return (
    <main className="relative flex min-w-0 flex-1 overflow-hidden bg-[#fbfbfa] text-[#37352f]">
      <section className="flex min-w-0 flex-1 flex-col px-10 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[#37352f]">Bài viết</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#787774]">
              Tạo, edit và quản lý các bài viết trên trang chedinhnghia.com
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
            <span className="text-xs font-medium text-[#787774]">Filter by category, subcategory, or tags</span>
            <input
              value={filterText}
              onChange={(event) => setFilterText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitPostQuery();
                }
              }}
              onBlur={submitPostQuery}
              placeholder="acl, Y khoa, phuc hoi"
              className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b9b8b4]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-[#787774]">Search by name</span>
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitPostQuery();
                }
              }}
              onBlur={submitPostQuery}
              placeholder="Noi soi khop goi"
              className="mt-2 w-full rounded-md border border-[#e3e2df] bg-white px-3 py-2 text-sm outline-none transition focus:border-[#b9b8b4]"
            />
          </label>
        </div>

        <BlogPostTable
          posts={posts}
          selectedPostId={selectedPostId}
          currentPage={currentPage}
          totalPages={totalPages}
          totalPosts={totalPosts}
          postLoadStatus={postLoadStatus}
          onSelectPost={setSelectedPostId}
          onTitleChange={(postId, title) => updatePost(postId, { title })}
          onPageChange={setCurrentPage}
        />
      </section>

      <BlogPostEditorAside
        post={selectedPost}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
        tagOptions={tagOptions}
        onClose={() => setSelectedPostId(null)}
        onUpdatePost={updateSelectedPost}
        onTogglePublish={toggleSelectedPostPublish}
        onDeletePost={deleteSelectedPost}
        onCreateCategory={createCategory}
        onCreateSubcategory={createSubcategory}
        onCreateTag={createTag}
      />
    </main>
  );
}
