import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("Route error:", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div style={{ padding: 40, color: "#fff", background: "#000", minHeight: "100vh" }}>
                        <h2>Đã xảy ra lỗi</h2>
                        <p style={{ color: "#888" }}>{this.state.error?.message}</p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.history.back();
                            }}
                            style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
                        >
                            Quay lại
                        </button>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;