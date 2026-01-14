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
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      return; // Already installed, don't show button
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      
      // Show banner after 3 seconds
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowInstallButton(false);
      setShowBanner(false);
    }
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <>
      {/* Floating Install Banner */}
      {showBanner && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-2 right-2 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Download size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Install Fair App</h3>
              <p className="text-sm text-white/90 mt-1">
                Get quick access and work offline
              </p>
              <button
                onClick={handleInstall}
                className="mt-3 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
              >
                Install Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Install Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Download className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Install Fair App</p>
              <p className="text-sm text-gray-600">
                Access faster, work offline
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInstallButton(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Install
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
