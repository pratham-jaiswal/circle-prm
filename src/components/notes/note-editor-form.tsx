"use client";

import "@mdxeditor/editor/style.css";

import {
  BoldItalicUnderlineToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  MDXEditor,
  UndoRedo,
  headingsPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ToastBanner } from "@/components/ui/toast-banner";

type NoteEditorFormProps = {
  mode: "create" | "edit";
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  initialAssociatedPeople?: string[];
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NoteEditorForm({
  mode,
  noteId,
  initialTitle = "",
  initialContent = "",
  initialTags = [],
  initialAssociatedPeople = [],
}: NoteEditorFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [associatedPeople, setAssociatedPeople] = useState(
    initialAssociatedPeople.join(", "),
  );
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: initialTitle,
        content: initialContent,
        tags: initialTags,
        associatedPeople: initialAssociatedPeople,
      }),
    [initialAssociatedPeople, initialContent, initialTags, initialTitle],
  );

  const currentSnapshot = JSON.stringify({
    title,
    content,
    tags: splitCsv(tags),
    associatedPeople: splitCsv(associatedPeople),
  });

  const isDirty = currentSnapshot !== initialSnapshot;

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!isDirty) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!anchor) {
        return;
      }

      if (!window.confirm("You have unsaved changes. Discard them and leave?")) {
        event.preventDefault();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onDocumentClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [isDirty]);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setSubmitting(true);

        try {
          const payload = {
            title,
            content,
            tags: splitCsv(tags),
            associatedPeople: splitCsv(associatedPeople),
          };

          const response = await fetch(
            mode === "create" ? "/api/notes" : `/api/notes/${noteId}`,
            {
              method: mode === "create" ? "POST" : "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          );

          if (!response.ok) {
            throw new Error("Unable to save note.");
          }

          const data = await response.json();

          if (mode === "create") {
            setToast({ type: "success", message: "Note created." });
            router.push(`/notes/${data.note.publicId}`);
          } else {
            setToast({ type: "success", message: "Note saved." });
            router.refresh();
          }
        } catch (error) {
          setToast({
            type: "error",
            message: error instanceof Error ? error.message : "Unable to save note.",
          });
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium text-slate-800">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
          placeholder="Conversation summary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-800">Markdown content</label>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <MDXEditor
            markdown={content}
            onChange={setContent}
            contentEditableClassName="prose prose-slate max-w-none min-h-[240px]"
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              linkPlugin(),
              markdownShortcutPlugin(),
              toolbarPlugin({
                toolbarContents: () => (
                  <DiffSourceToggleWrapper>
                    <UndoRedo />
                    <BoldItalicUnderlineToggles />
                    <CreateLink />
                  </DiffSourceToggleWrapper>
                ),
              }),
            ]}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="associatedPeople" className="text-sm font-medium text-slate-800">
            Associated people (public IDs)
          </label>
          <input
            id="associatedPeople"
            value={associatedPeople}
            onChange={(event) => setAssociatedPeople(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
            placeholder="PER_A7K29X, PER_B8C12D"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium text-slate-800">
            Tags
          </label>
          <input
            id="tags"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring"
            placeholder="college, reunion"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-65"
        >
          {submitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(content);
              setToast({ type: "success", message: "Markdown copied to clipboard." });
            } catch {
              setToast({ type: "error", message: "Unable to copy note content." });
            }
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Copy
        </button>
        <button
          type="button"
          onClick={() => {
            if (isDirty && !window.confirm("Discard unsaved changes?")) {
              return;
            }
            setTitle(initialTitle);
            setContent(initialContent);
            setTags(initialTags.join(", "));
            setAssociatedPeople(initialAssociatedPeople.join(", "));
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => {
            if (isDirty && !window.confirm("Discard unsaved changes and cancel?")) {
              return;
            }

            if (mode === "edit" && noteId) {
              router.push(`/notes/${noteId}`);
            } else {
              router.push("/notes");
            }
          }}
          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

      {toast ? <ToastBanner type={toast.type} message={toast.message} /> : null}
    </form>
  );
}
