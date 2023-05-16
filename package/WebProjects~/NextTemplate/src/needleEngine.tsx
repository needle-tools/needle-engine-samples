// https://nextjs.org/docs/getting-started/react-essentials#the-use-client-directive
'use client'
import "./generated/gen";
const isServer = () => typeof window === `undefined`;

// client only
import "@needle-tools/engine"


export default function NeedleEngine({ ...props }) {

  return (
    <>
      {!isServer() && <needle-engine {...props}></needle-engine>}
    </>
  );
}