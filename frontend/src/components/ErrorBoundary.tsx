import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; err?: unknown };

export class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError(err: unknown) {
        return { hasError: true, err };
    }
    componentDidCatch(err: unknown, info: unknown) {
        console.error('UI ErrorBoundary:', err, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gray-900 text-red-200 flex items-center justify-center p-6">
                    <div className="max-w-lg w-full bg-red-900/20 border border-red-700 rounded-xl p-5">
                        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                        <p className="text-sm text-red-300">
                            UI crashed. Open the browser console for details. Try to reload the page.
                        </p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
