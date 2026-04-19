import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6 text-center" dir="rtl">
            <h1 className="text-2xl font-bold mb-4 text-red-400">حدث خطأ تقني في التطبيق</h1>
            <p className="mb-6 text-gray-400">الرجاء تصوير هذه الشاشة ومشاركتها مع فريق الدعم.</p>
            
            <div className="bg-black/50 p-4 rounded-lg w-full max-w-lg mb-6 overflow-auto text-left" dir="ltr">
              <code className="text-red-300 text-sm">
                {(this.state as any).error?.toString() || "Unknown Error"}
              </code>
              <br />
              <code className="text-gray-500 text-xs mt-2 block">
                {(this.state as any).errorInfo?.componentStack}
              </code>
            </div>

            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 font-bold"
            >
                إعادة تحميل التطبيق
            </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
