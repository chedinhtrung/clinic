"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { autosaveBlogPost, createDraftBlogPost, deleteBlogPost, fetchBlogLookupData, fetchBlogPostsPage } from "./api";
import BlogPostEditorAside from "./BlogPostEditorAside";
import BlogPostTable from "./BlogPostTable";
import type { BlogAutosaveStatus, BlogCategory, BlogPost, BlogSubcategory, BlogTag, PostLoadStatus } from "./types";
import { BLOG_POST_PAGE_SIZE, getTagNames, isPublishedStatus } from "./utils";

export default function BlogEditor() {
  // Post list and pagination state drive the table on the left side of the admin view.
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [postLoadStatus, setPostLoadStatus] = useState<PostLoadStatus>("idle");

  // Draft query state lets users type freely before the table request is committed.
  const [filterText, setFilterText] = useState("");
  const [activeFilterText, setActiveFilterText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activeSearchText, setActiveSearchText] = useState("");

  // Lookup option state backs editable category, subcategory, and tag controls.
  const [categoryOptions, setCategoryOptions] = useState<BlogCategory[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<BlogSubcategory[]>([]);
  const [backendTagOptions, setBackendTagOptions] = useState<BlogTag[]>([]);

  // Autosave UI state is intentionally small: status text plus the last successful save timestamp.
  const [autosaveStatus, setAutosaveStatus] = useState<BlogAutosaveStatus>("idle");
  const [autosavedAt, setAutosavedAt] = useState<string | null>(null);

  // Autosave refs coordinate debouncing, stale response protection, and "only save after real edits" tracking.
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveSequenceRef = useRef(0);
  const loadedPostIdsRef = useRef<Set<string>>(new Set());
  const dirtyPostIdsRef = useRef<Set<string>>(new Set());

  // Load static lookup values once. The current mock API mirrors the future backend contract.
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

  // Load the current table page whenever committed search/filter/page inputs change.
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

  // Resolve the selected post from the current page data instead of duplicating editable post state.
  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId]
  );

  // Merge backend tags with tags already visible on the current page so newly created tags stay selectable.
  const tagOptions = useMemo(() => {
    const optionsById = new Map<string, BlogTag>();
    [...backendTagOptions, ...getTagNames(posts)].forEach((tag) => optionsById.set(tag.id, tag));
    return Array.from(optionsById.values()).sort((firstTag, secondTag) =>
      firstTag.name.localeCompare(secondTag.name)
    );
  }, [backendTagOptions, posts]);

  // Save dirty selected posts after a short pause. Sequence numbers prevent old responses from winning races.
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    if (!selectedPost) {
      return;
    }

    if (!loadedPostIdsRef.current.has(selectedPost.id)) {
      loadedPostIdsRef.current.add(selectedPost.id);
      return;
    }

    if (!dirtyPostIdsRef.current.has(selectedPost.id)) {
      return;
    }

    const saveSequence = autosaveSequenceRef.current + 1;
    autosaveSequenceRef.current = saveSequence;

    // Mock backend autosave is debounced so normal typing produces one save for the latest post state.
    autosaveTimerRef.current = setTimeout(() => {
      void autosaveBlogPost(selectedPost)
        .then(({ savedAt, post }) => {
          if (autosaveSequenceRef.current !== saveSequence) {
            return;
          }

          setPosts((currentPosts) => currentPosts.map((currentPost) => (currentPost.id === post.id ? post : currentPost)));
          setAutosaveStatus("saved");
          setAutosavedAt(savedAt);
          dirtyPostIdsRef.current.delete(post.id);
          loadedPostIdsRef.current.add(post.id);
        })
        .catch(() => {
          if (autosaveSequenceRef.current === saveSequence) {
            setAutosaveStatus("error");
          }
        });
    }, 900);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [selectedPost]);

  // Apply a partial post update locally and mark the selected post dirty for autosave.
  function updatePost(postId: string, changes: Partial<BlogPost>) {
    dirtyPostIdsRef.current.add(postId);
    setAutosaveStatus("saving");

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              ...changes,
              updatedAt: new Date().toISOString(),
            }
          : post
      )
    );
  }

  // Convenience wrapper used by the aside, where every edit targets the currently open post.
  function updateSelectedPost(changes: Partial<BlogPost>) {
    if (selectedPost) {
      updatePost(selectedPost.id, changes);
    }
  }

  // Selecting a post resets visible autosave state; actual saves still wait for a later edit.
  function selectPostForEditing(postId: string | null) {
    setSelectedPostId(postId);
    setAutosaveStatus("idle");
    setAutosavedAt(null);
  }

  // Publishing is a domain-state change. The backend decides which persisted
  // fields that implies, such as slug, public URL, and published timestamp.
  function toggleSelectedPostPublish() {
    if (!selectedPost) {
      return;
    }

    if (isPublishedStatus(selectedPost.status)) {
      updateSelectedPost({ status: "draft" });
      return;
    }

    updateSelectedPost({ status: "published" });
  }

  // Commit typed table filters and reset pagination so new searches start from the first page.
  function submitPostQuery() {
    setCurrentPage(1);
    setActiveSearchText(searchText.trim());
    setActiveFilterText(filterText.trim());
  }

  // Create a local draft row and open it immediately. The mock backend save will run after edits.
  async function addDraftPost() {
    const draft = await createDraftBlogPost();
    const nextTotalPosts = totalPosts + 1;

    loadedPostIdsRef.current.add(draft.id);
    setPosts((currentPosts) => [draft, ...currentPosts].slice(0, BLOG_POST_PAGE_SIZE));
    setTotalPosts(nextTotalPosts);
    setTotalPages(Math.max(1, Math.ceil(nextTotalPosts / BLOG_POST_PAGE_SIZE)));
    selectPostForEditing(draft.id);
  }

  // Remove the selected post from local state after confirmation.
  async function deleteSelectedPost() {
    if (!selectedPost) {
      return;
    }

    const shouldDelete = window.confirm("Bạn có thật sự muốn xóa bài này?");
    if (!shouldDelete) {
      return;
    }

    await deleteBlogPost(selectedPost.id);
    dirtyPostIdsRef.current.delete(selectedPost.id);
    loadedPostIdsRef.current.delete(selectedPost.id);
    setPosts((currentPosts) => currentPosts.filter((post) => post.id !== selectedPost.id));
    selectPostForEditing(null);
    setTotalPosts((currentTotalPosts) => Math.max(0, currentTotalPosts - 1));
  }

  // Create a subcategory option and return it so the aside can immediately select it.
  function createSubcategory(name: string) {
    const subcategory = { id: `pending-sub-${Date.now()}`, name };
    setSubcategoryOptions((currentOptions) => [...currentOptions, subcategory]);
    return subcategory;
  }

  // Create a tag option and return it so the tag picker can immediately attach it.
  function createTag(name: string) {
    const tag = { id: `pending-tag-${Date.now()}`, name };
    setBackendTagOptions((currentOptions) => [...currentOptions, tag]);
    return tag;
  }

  return (
    <main className="relative flex min-w-0 flex-1 bg-[#fbfbfa] text-[#37352f]">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-10 py-8 max-h-[100vh]">
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
          onSelectPost={selectPostForEditing}
          onTitleChange={(postId, title) => updatePost(postId, { title })}
          onPageChange={setCurrentPage}
        />
      </section>

      <BlogPostEditorAside
        post={selectedPost}
        autosaveStatus={autosaveStatus}
        autosavedAt={autosavedAt}
        categoryOptions={categoryOptions}
        subcategoryOptions={subcategoryOptions}
        tagOptions={tagOptions}
        onClose={() => selectPostForEditing(null)}
        onUpdatePost={updateSelectedPost}
        onTogglePublish={toggleSelectedPostPublish}
        onDeletePost={deleteSelectedPost}
        onCreateSubcategory={createSubcategory}
        onCreateTag={createTag}
      />
    </main>
  );
}
