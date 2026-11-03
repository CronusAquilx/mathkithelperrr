import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  HardDrive,
  Upload,
  RefreshCw,
  Folder,
  File,
  Download,
  ExternalLink,
  Share2,
  Copy,
  ArrowUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { storageOperation } from "@/lib/storage/storage.functions";
import {
  folderPath,
  MAX_UPLOAD_BYTES,
  uploadMetadata,
  type StorageInput,
  type StorageResult,
} from "@/lib/storage/schema";

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StorageView() {
  const { user } = useAuth();
  return <AccountStorageView key={user?.id ?? "guest"} />;
}

function AccountStorageView() {
  const { user } = useAuth();
  const call = useServerFn(storageOperation);
  const cache = useQueryClient();
  const [folder, setFolder] = useState("");
  const [pathDraft, setPathDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [share, setShare] = useState<{ key: string; url: string } | null>(null);
  const [pending, setPending] = useState<{ key: string; size: number } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const owner = useRef(user?.id);
  owner.current = user?.id;
  const queryKey = ["flux-storage", user?.id, folder];
  const request = async (data: StorageInput): Promise<StorageResult> => {
    try {
      return await call({ data });
    } catch {
      return {
        ok: false,
        status: 401,
        error: "Storage request failed. Check your connection and sign in again if needed.",
      };
    }
  };
  const files = useQuery({
    queryKey,
    enabled: Boolean(user),
    queryFn: async () => {
      const result = await request({ operation: "list", folder });
      if (!result.ok) throw new Error(result.error);
      if (result.operation !== "list") throw new Error("Storage returned an unexpected response.");
      return result.files;
    },
    retry: false,
  });
  const navigateFolder = (path: string) => {
    if (!folderPath.safeParse(path).success) {
      setError("Enter a relative folder path without .. or special encoded characters.");
      return;
    }
    setFolder(path);
    setPathDraft(path);
    setError("");
    setShare(null);
  };
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: ["flux-storage", user?.id] });
  };
  const confirm = async (metadata: { key: string; size: number }) => {
    const result = await request({ operation: "confirm", ...metadata });
    if (!result.ok) {
      setPending(metadata);
      setError(
        `Upload sent but confirmation failed. ${result.error} Retry confirmation before uploading again.`,
      );
      return false;
    }
    setPending(null);
    await refresh();
    return true;
  };
  const upload = async (file: globalThis.File) => {
    if (!user) return;
    const account = user.id;
    const metadata = {
      key: folder ? `${folder}/${file.name}` : file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    };
    if (!uploadMetadata.safeParse(metadata).success) {
      setError(
        `Use a valid filename and MIME type; file size must be 1 byte to ${sizeLabel(MAX_UPLOAD_BYTES)}.`,
      );
      return;
    }
    if (files.data?.some((item) => item.key === metadata.key)) {
      setError("A file with that name already exists. Rename your file before uploading.");
      return;
    }
    setError("");
    setShare(null);
    setBusy(`Uploading ${file.name}`);
    try {
      const signed = await request({ operation: "upload", ...metadata });
      if (!signed.ok) {
        setError(signed.error);
        return;
      }
      if (signed.operation !== "upload" || owner.current !== account) return;
      const sent = await fetch(signed.url, {
        method: "PUT",
        headers: { "Content-Type": signed.contentType },
        body: file,
        credentials: "omit",
        redirect: "error",
      });
      if (owner.current !== account) return;
      if (!sent.ok) {
        setError("File transfer failed. No upload was confirmed; select the file again to retry.");
        return;
      }
      setBusy("Confirming upload");
      await confirm({ key: signed.key, size: file.size });
    } catch {
      setError(
        "File transfer failed or was interrupted. Check your connection and signed-upload CORS settings, then retry.",
      );
    } finally {
      setBusy("");
    }
  };
  const fileAction = async (key: string, operation: "download" | "open" | "share") => {
    setBusy(key);
    setError("");
    // Reserve a native window during the click so asynchronous URL lookup isn't blocked.
    const opened = operation === "open" ? window.open("about:blank", "_blank") : null;
    if (opened) opened.opener = null;
    try {
      const result = await request({
        operation: operation === "share" ? "share" : "download",
        key,
      });
      if (!result.ok) {
        opened?.close();
        setError(result.error);
        return;
      }
      if (result.operation !== "download" && result.operation !== "share") {
        opened?.close();
        return;
      }
      if (operation === "share") {
        setShare({ key, url: result.url });
      } else if (opened) opened.location.replace(result.url);
      else if (operation === "open")
        setError("Your browser blocked the new tab. Allow popups and retry.");
      else {
        const link = document.createElement("a");
        link.href = result.url;
        link.download = key.split("/").at(-1) ?? "download";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.click();
      }
    } finally {
      setBusy("");
    }
  };
  const folders = [
    ...new Set(
      (files.data ?? [])
        .map((item) => item.key.slice(folder ? folder.length + 1 : 0))
        .filter((key) => key.includes("/"))
        .map((key) => key.split("/")[0] ?? ""),
    ),
  ].sort();
  const visible = (files.data ?? []).filter(
    (item) => !item.key.slice(folder ? folder.length + 1 : 0).includes("/"),
  );

  if (!user)
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <HardDrive className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Storage</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your files. Guest accounts cannot use Storage.
        </p>
      </div>
    );
  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-6">
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <HardDrive className="size-5 text-primary" />
          Storage
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Refresh files"
            aria-label="Refresh files"
            disabled={Boolean(busy)}
            onClick={() => void refresh()}
          >
            <RefreshCw className={files.isFetching ? "animate-spin" : ""} />
          </Button>
          <Button
            disabled={Boolean(busy) || Boolean(pending)}
            onClick={() => picker.current?.click()}
          >
            <Upload />
            Upload file
          </Button>
          <input
            ref={picker}
            className="hidden"
            type="file"
            aria-label="Upload file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload(file);
            }}
          />
        </div>
      </header>
      <form
        className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 sm:px-6"
        onSubmit={(event) => {
          event.preventDefault();
          navigateFolder(pathDraft);
        }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Parent folder"
          title="Parent folder"
          disabled={!folder || Boolean(busy)}
          onClick={() => navigateFolder(folder.split("/").slice(0, -1).join("/"))}
        >
          <ArrowUp />
        </Button>
        <Folder className="size-4 shrink-0 text-muted-foreground" />
        <Input
          aria-label="Folder path"
          placeholder="My files"
          value={pathDraft}
          disabled={Boolean(busy)}
          onChange={(event) => setPathDraft(event.target.value)}
        />
        <Button type="submit" variant="secondary" disabled={Boolean(busy)}>
          Go
        </Button>
      </form>
      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
        {busy && (
          <p role="status" className="mb-4 flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            {busy}
          </p>
        )}
        {(error || files.error) && (
          <div
            role="alert"
            className="mb-4 border-l-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive"
          >
            <p>{error || files.error?.message}</p>
            {pending ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={Boolean(busy)}
                onClick={() => {
                  setError("");
                  setBusy("Confirming upload");
                  void confirm(pending).finally(() => setBusy(""));
                }}
              >
                Retry confirmation
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  setError("");
                  void refresh();
                }}
              >
                Retry
              </Button>
            )}
          </div>
        )}
        {share && (
          <section aria-label="Share link" className="mb-4 border-b pb-4">
            <p className="mb-2 break-all text-sm font-medium">Share: {share.key}</p>
            <div className="flex gap-2">
              <Input aria-label="File share link" readOnly value={share.url} />
              <Button
                variant="secondary"
                size="icon"
                aria-label="Copy share link"
                title="Copy share link"
                onClick={() => {
                  void navigator.clipboard
                    .writeText(share.url)
                    .then(() => setBusy("Link copied"))
                    .catch(() => setError("Could not copy. Select and copy the link above."))
                    .finally(() => setTimeout(() => setBusy(""), 1500));
                }}
              >
                <Copy />
              </Button>
            </div>
          </section>
        )}
        {files.isPending ? (
          <p role="status" className="py-12 text-center text-muted-foreground">
            Loading files…
          </p>
        ) : !files.error && !folders.length && !visible.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Folder className="size-12 text-muted-foreground" />
            <h2 className="font-medium">This folder is empty</h2>
            <p className="text-sm text-muted-foreground">No files in {folder || "My files"}.</p>
          </div>
        ) : (
          <ul className="divide-y">
            {folders.map((name) => (
              <li key={name}>
                <Button
                  variant="ghost"
                  disabled={Boolean(busy)}
                  className="h-auto w-full justify-start gap-3 py-4 text-left"
                  onClick={() => navigateFolder(folder ? `${folder}/${name}` : name)}
                >
                  <Folder className="size-5 text-primary" />
                  <span className="min-w-0 break-all">{name}</span>
                </Button>
              </li>
            ))}
            {visible.map((item) => (
              <li key={item.key} className="flex flex-wrap items-center gap-3 py-3">
                <File className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-sm font-medium">{item.key.split("/").at(-1)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {sizeLabel(item.size)}
                    {item.lastModified
                      ? ` · ${new Date(item.lastModified).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {(
                    [
                      { operation: "open", label: "Open", icon: ExternalLink },
                      { operation: "download", label: "Download", icon: Download },
                      { operation: "share", label: "Share", icon: Share2 },
                    ] as const
                  ).map((action) => (
                    <Button
                      key={action.operation}
                      variant="ghost"
                      size="icon"
                      disabled={Boolean(busy)}
                      title={`${action.label} ${item.key}`}
                      aria-label={`${action.label} ${item.key}`}
                      onClick={() => void fileAction(item.key, action.operation)}
                    >
                      <action.icon className="size-4" />
                    </Button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <footer className="border-t px-4 py-2 text-xs text-muted-foreground">
        My files{folder ? ` / ${folder}` : ""} · {files.data?.length ?? 0} files · 500 MB maximum
        upload
      </footer>
    </div>
  );
}
