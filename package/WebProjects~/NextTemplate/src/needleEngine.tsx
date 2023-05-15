// https://nextjs.org/docs/getting-started/react-essentials#the-use-client-directive
'use client'
// 
// export * from "@needle-tools/engine";
// import dynamic from 'next/dynamic';
import { useEffect } from "react";

const isServer = () => typeof window === `undefined`;

// client only
import "@needle-tools/engine"

export default function NeedleEngine({ ...props }) {
  return (
    <>
      {!isServer() && <needle-engine {...props} src="./gameObject4.glb"></needle-engine>}
    </>
  );
}