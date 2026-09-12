import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
            showDetails: false,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    private toggleDetails = () => {
        this.setState((prev) => ({ showDetails: !prev.showDetails }));
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
                    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 sm:p-8 text-center animate-in fade-in zoom-in duration-200">
                        {/* Error Icon */}
                        <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-5 shadow-inner">
                            <AlertTriangle className="w-7 h-7" />
                        </div>

                        {/* Title & Description */}
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                            Произошла непредвиденная ошибка
                        </h1>
                        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                            Приложение столкнулось с внутренней ошибкой рендеринга интерфейса. Данные сессии сохранены.
                        </p>

                        {/* Action Buttons */}
                        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleReload}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-medium transition-all shadow-sm hover:shadow"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Перезагрузить страницу
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-sm font-medium transition-all"
                            >
                                <Home className="w-4 h-4" />
                                На главную
                            </button>
                        </div>

                        {/* Error Details Accordion */}
                        {this.state.error && (
                            <div className="mt-6 border-t border-slate-100 pt-4 text-left">
                                <button
                                    onClick={this.toggleDetails}
                                    className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-600 py-1 transition-colors"
                                >
                                    <span>Техническая информация об ошибке</span>
                                    {this.state.showDetails ? (
                                        <ChevronUp className="w-4 h-4" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4" />
                                    )}
                                </button>

                                {this.state.showDetails && (
                                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap leading-tight shadow-inner">
                                        <div className="text-red-400 font-semibold mb-1">
                                            {this.state.error.name}: {this.state.error.message}
                                        </div>
                                        {this.state.errorInfo?.componentStack && (
                                            <div className="text-slate-400 text-[11px] mt-2">
                                                {this.state.errorInfo.componentStack}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
