"use client";

import Button from "@/components/ui/Button";
import SegmentedControl from "@/components/ui/SegmentedControl";
import InstallButton from "@/components/pwa/InstallButton";
import type { Theme } from "@/lib/types";
import Logo from "./Logo";

interface Props {
  theme: Theme;
  onTheme: (t: Theme) => void;
  alertPermission: NotificationPermission | "unsupported";
  onEnableAlerts: () => void;
}

const THEMES: Array<{ value: Theme; label: string }> = [
  { value: "system", label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Logo on the left; theme, alerts and install on the right. */
export default function AppHeader({ theme, onTheme, alertPermission, onEnableAlerts }: Props) {
  const label =
    alertPermission === "granted" ? "Alerts on" : alertPermission === "denied" ? "Alerts blocked" : "Enable alerts";
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Logo />
      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl ariaLabel="Colour theme" value={theme} options={THEMES} onChange={onTheme} />
        <Button
          size="sm"
          onClick={onEnableAlerts}
          disabled={alertPermission === "denied" || alertPermission === "unsupported"}
          title={
            alertPermission === "denied"
              ? "Notifications are blocked in your browser settings"
              : "Enable sound and system notifications for event alerts"
          }
        >
          {label}
        </Button>
        <InstallButton />
      </div>
    </header>
  );
}
