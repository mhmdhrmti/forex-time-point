"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

/**
 * "Install app" for browsers that offer it; on iPhone/iPad (no install API) a short how-to.
 * Renders nothing once the app is installed and running standalone.
 */
export default function InstallButton() {
  const { canInstall, install, standalone, ios } = useInstallPrompt();
  const [showHint, setShowHint] = useState(false);

  if (standalone) return null;
  if (canInstall) {
    return (
      <Button size="sm" variant="accent" onClick={() => void install()}>
        Install app
      </Button>
    );
  }
  if (ios) {
    return (
      <div className="relative">
        <Button size="sm" onClick={() => setShowHint((v) => !v)} aria-expanded={showHint}>
          Add to Home Screen
        </Button>
        {showHint && (
          <p role="note" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-lg bg-[var(--surface)] p-3 text-xs leading-relaxed shadow-xl ring-1 ring-[var(--line)]">
            Tap the <strong>Share</strong> button in Safari, then <strong>Add to Home Screen</strong>.
          </p>
        )}
      </div>
    );
  }
  return null;
}
