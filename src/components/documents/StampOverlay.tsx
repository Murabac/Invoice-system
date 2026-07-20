"use client";

import Image from "next/image";

interface StampOverlayProps {
  className?: string;
  src: string;
}

export function StampOverlay({ className, src }: StampOverlayProps) {
  return (
    <Image
      src={src}
      alt="Original Issued stamp"
      width={120}
      height={120}
      className={className}
    />
  );
}
