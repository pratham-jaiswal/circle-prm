"use client";

type ToastBannerProps = {
  type: "success" | "error";
  message: string;
};

export function ToastBanner({ type, message }: ToastBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border px-4 py-3 text-sm ${
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800"
      }`}
    >
      {message}
    </div>
  );
}
