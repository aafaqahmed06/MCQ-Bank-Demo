"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ConfirmModal from "@/components/ConfirmModal";
import { Icon, cn } from "@/components/ui";

/** Profile/account affordance for the navbar (§ application shell — "Account
 * /settings live behind the profile menu"). Houses the Account link and
 * Sign out, which previously sat as flat top-level navbar items. */
export default function ProfileMenu() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const doSignOut = () => {
    void signOut().then(() => {
      router.replace("/");
      router.refresh();
    });
  };

  const handleSignOut = () => {
    setOpen(false);
    if (user?.is_anonymous) {
      setConfirmSignOut(true);
      return;
    }
    doSignOut();
  };

  const initial = profile?.full_name?.trim()?.[0]?.toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border-default bg-surface-secondary text-sm font-semibold text-text-secondary transition-colors duration-150 hover:border-primary/40 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {initial || <Icon icon={User} size="sm" />}
      </button>

      {open && (
        <div
          role="menu"
          className="fade-in absolute top-full right-0 z-20 mt-2 w-48 overflow-hidden rounded-control border border-border-default bg-surface-elevated py-1 shadow-elevated"
        >
          <Link
            href="/bookmarks"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-secondary transition-colors duration-150",
              "hover:bg-primary/8 hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
            )}
          >
            <Icon icon={Bookmark} size="sm" />
            Bookmarks
          </Link>
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-text-secondary transition-colors duration-150",
              "hover:bg-primary/8 hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
            )}
          >
            <Icon icon={Settings} size="sm" />
            Account
          </Link>
          {user && (
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-text-secondary transition-colors duration-150",
                "hover:bg-error/10 hover:text-error",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
              )}
            >
              <Icon icon={LogOut} size="sm" />
              Sign out
            </button>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmSignOut}
        title="Sign out of guest account?"
        message="You're using a guest account. Signing out will permanently lose your progress unless you've saved it to an email/password account from Account settings."
        confirmLabel="Sign out anyway"
        cancelLabel="Stay signed in"
        onConfirm={() => {
          setConfirmSignOut(false);
          doSignOut();
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </div>
  );
}
