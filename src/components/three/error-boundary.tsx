"use client";

import { Component, type ReactNode } from "react";

/** Catches failures inside 3D scenes (model load, shader compile) so the page never goes blank. */
export class SceneErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode; onError?: (e: Error) => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
