"use client";

import React from "react";

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 flex h-screen w-full items-center justify-center overflow-hidden bg-background">
      <div className="glowing">
        <span style={{ "--i": 1 } as React.CSSProperties}></span>
        <span style={{ "--i": 2 } as React.CSSProperties}></span>
        <span style={{ "--i": 3 } as React.CSSProperties}></span>
      </div>
      <div className="glowing">
        <span style={{ "--i": 1 } as React.CSSProperties}></span>
        <span style={{ "--i": 2 } as React.CSSProperties}></span>
        <span style={{ "--i": 3 } as React.CSSProperties}></span>
      </div>
      <div className="glowing">
        <span style={{ "--i": 1 } as React.CSSProperties}></span>
        <span style={{ "--i": 2 } as React.CSSProperties}></span>
        <span style={{ "--i": 3 } as React.CSSProperties}></span>
      </div>
      <div className="glowing">
        <span style={{ "--i": 1 } as React.CSSProperties}></span>
        <span style={{ "--i": 2 } as React.CSSProperties}></span>
        <span style={{ "--i": 3 } as React.CSSProperties}></span>
      </div>
    </div>
  );
}
