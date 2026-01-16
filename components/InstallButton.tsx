"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Provide manual install instructions if no deferred prompt
      alert(
        "To install FAIR:\n\n" +
        "Chrome/Edge: Click the install icon (⊕) in the address bar\n" +
        "Safari (iOS): Tap Share → Add to Home Screen\n" +
        "Firefox: Look for 'Install' in the browser menu"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  // Hide button if already installed (in standalone mode)
  if (isInstalled) {
    return null;
  }

  // Always show button in browser mode
  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 active:scale-95 browser-only"
      title="Install Fair App"
    >
      <Download size={18} />
      <span className="hidden sm:inline">{deferredPrompt ? "Install App" : "How to Install"}</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
}
