"use client";

import { Component, type ReactNode } from "react";

interface BoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

/** If anything in the 3D scene throws (no WebGL, a broken model file), show the fallback instead of breaking the page. */
export class Boundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("[3d] the 3D body failed, showing the flat map", error);
  }

  render(): ReactNode {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
