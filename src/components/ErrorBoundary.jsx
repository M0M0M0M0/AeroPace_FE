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
                    <div style={{ padding: 40, color: "#e5e4e4", background: "#000", minHeight: "100vh" }}>
                        <h2>An error has occurred</h2>
                        <p style={{ color: "#888" }}>{this.state.error?.message}</p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.history.back();
                            }}
                            style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}
                        >
                            Return
                        </button>
                    </div>
                )
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;