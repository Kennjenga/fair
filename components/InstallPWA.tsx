"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker manually
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;

    if (isStandalone || isInWebAppiOS) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently (within 7 days)
    const dismissedTime = localStorage.getItem("pwa-install-dismissed");
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return; // Don't show banner if recently dismissed
      }
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Listen for successful installation
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    // Show banner after 2 seconds even if beforeinstallprompt hasn't fired
    // This ensures visibility for testing and provides manual install instructions
    const timeout = setTimeout(() => {
      if (!isStandalone && !isInWebAppiOS) {
        setShowInstallBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timeout);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // If no deferred prompt, provide manual install instructions
      alert(
        "To install FAIR:\n\n" +
        "Chrome/Edge: Click the install icon in the address bar\n" +
        "Safari (iOS): Tap Share → Add to Home Screen\n" +
        "Firefox: Look for 'Install' in the menu"
      );
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
      setIsInstalled(true);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Don't show again for 7 days
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  // Don't show if installed
  if (isInstalled) {
    return null;
  }

  // Don't show banner if not ready yet
  if (!showInstallBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-gradient-to-r from-[#4F46E5] to-[#6366F1] text-white rounded-2xl shadow-2xl p-5 z-50 animate-slide-up browser-only">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
        aria-label="Close"
      >
        <X size={20} />
      </button>
      <div className="flex items-start gap-4">
        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
          <Download size={28} />
        </div>
        <div className="flex-1 pr-6">
          <h3 className="font-bold text-lg mb-1">Install FAIR App</h3>
          <p className="text-sm text-white/90 mb-4">
            Get quick access, work offline, and enjoy a native app experience
          </p>
          <button
            onClick={handleInstall}
            className="w-full bg-white text-[#4F46E5] px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
          >
            {deferredPrompt ? "Install Now" : "How to Install"}
          </button>
        </div>
      </div>
    </div>
  );
}
