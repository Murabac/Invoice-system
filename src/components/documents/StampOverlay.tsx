"use client";

import Image from "next/image";

interface StampOverlayProps {
  className?: string;
}

export function StampOverlay({ className }: StampOverlayProps) {
  return (
    <Image
      src="/stamp.png"
      alt="Original Issued stamp"
      width={120}
      height={120}
      className={className}
    />
  );
}
