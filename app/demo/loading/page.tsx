'use client';

import React, { useState } from 'react';
import { Card, Button, LoadingSpinner, LoadingDots, LoadingBar, LoadingSkeleton } from '@/components/ui';

export default function LoadingDemoPage() {
    const [showOverlay, setShowOverlay] = useState(false);
    const [progress, setProgress] = useState(0);

    const simulateProgress = () => {
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 10;
            });
        }, 300);
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="container max-w-6xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-h1 text-slate-900 mb-4">Loading Components Demo</h1>
                    <p className="text-slate-700">
                        Cool, on-theme loading widgets for the FAIR platform
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Loading Spinner */}
                    <Card>
                        <h2 className="text-h3 text-slate-900 mb-4">Loading Spinner</h2>
                        <p className="text-small text-slate-700 mb-6">
                            Rotating ring with pulsing center - perfect for full-page loading
                        </p>

                        <div className="space-y-6">
                            <div>
                                <p className="text-caption text-slate-700 mb-2">Small</p>
                                <LoadingSpinner size="sm" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Medium (Default)</p>
                                <LoadingSpinner size="md" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Large</p>
                                <LoadingSpinner size="lg" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">With Message</p>
                                <LoadingSpinner size="md" message="Loading your data..." />
                            </div>

                            <div>
                                <Button onClick={() => setShowOverlay(true)}>
                                    Show Overlay Spinner
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Loading Dots */}
                    <Card>
                        <h2 className="text-h3 text-slate-900 mb-4">Loading Dots</h2>
                        <p className="text-small text-slate-700 mb-6">
                            Bouncing dots - great for inline loading states
                        </p>

                        <div className="space-y-6">
                            <div>
                                <p className="text-caption text-slate-700 mb-2">Small</p>
                                <LoadingDots size="sm" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Medium (Default)</p>
                                <LoadingDots size="md" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Large</p>
                                <LoadingDots size="lg" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Secondary Color</p>
                                <LoadingDots color="secondary" />
                            </div>

                            <div className="bg-slate-900 p-4 rounded-lg">
                                <p className="text-caption text-white mb-2">White (on dark bg)</p>
                                <LoadingDots color="white" />
                            </div>
                        </div>
                    </Card>

                    {/* Loading Bar */}
                    <Card>
                        <h2 className="text-h3 text-slate-900 mb-4">Loading Bar</h2>
                        <p className="text-small text-slate-700 mb-6">
                            Progress bar with shimmer effect or determinate progress
                        </p>

                        <div className="space-y-6">
                            <div>
                                <p className="text-caption text-slate-700 mb-2">Indeterminate (Shimmer)</p>
                                <LoadingBar variant="indeterminate" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Determinate Progress: {progress}%</p>
                                <LoadingBar variant="determinate" progress={progress} />
                                <Button onClick={simulateProgress} className="mt-2">
                                    Simulate Progress
                                </Button>
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Small Height</p>
                                <LoadingBar height="sm" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Large Height</p>
                                <LoadingBar height="lg" />
                            </div>
                        </div>
                    </Card>

                    {/* Loading Skeleton */}
                    <Card>
                        <h2 className="text-h3 text-slate-900 mb-4">Loading Skeleton</h2>
                        <p className="text-small text-slate-700 mb-6">
                            Content placeholders with shimmer animation
                        </p>

                        <div className="space-y-6">
                            <div>
                                <p className="text-caption text-slate-700 mb-2">Text Lines</p>
                                <LoadingSkeleton variant="text" count={3} />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Circular (Avatar)</p>
                                <LoadingSkeleton variant="circular" width="64px" height="64px" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Rectangular</p>
                                <LoadingSkeleton variant="rectangular" height="100px" />
                            </div>

                            <div>
                                <p className="text-caption text-slate-700 mb-2">Card</p>
                                <LoadingSkeleton variant="card" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Usage Examples */}
                <Card className="mt-6">
                    <h2 className="text-h3 text-slate-900 mb-4">Usage Examples</h2>
                    <div className="space-y-4 text-small text-slate-700">
                        <div>
                            <p className="font-semibold mb-2">Full Page Loading:</p>
                            <code className="block bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                                {`<LoadingSpinner variant="overlay" message="Loading..." />`}
                            </code>
                        </div>

                        <div>
                            <p className="font-semibold mb-2">Button Loading State:</p>
                            <code className="block bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                                {`<Button disabled={loading}>
  {loading ? <LoadingDots size="sm" color="white" /> : 'Submit'}
</Button>`}
                            </code>
                        </div>

                        <div>
                            <p className="font-semibold mb-2">Content Loading:</p>
                            <code className="block bg-slate-100 p-3 rounded-lg text-xs overflow-x-auto">
                                {`{loading ? (
  <LoadingSkeleton variant="card" count={3} />
) : (
  <DataList />
)}`}
                            </code>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Overlay Demo */}
            {showOverlay && (
                <LoadingSpinner
                    variant="overlay"
                    size="xl"
                    message="This is an overlay loading spinner"
                />
            )}

            {showOverlay && (
                <button
                    onClick={() => setShowOverlay(false)}
                    className="fixed bottom-8 right-8 z-[60] btn btn-primary"
                >
                    Close Overlay
                </button>
            )}
        </div>
    );
}
