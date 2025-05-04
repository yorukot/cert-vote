"use client";

import Webcam from "react-webcam";
import { useState, useEffect } from "react";
import { CircleCheck } from "lucide-react";

export default function Face() {
  const [verifyStatus, setVerifyStatus] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setVerifyStatus(true);
    }, 8_000);
  }, [setVerifyStatus, verifyStatus]);

  return (
    <div className="flex justify-center flex-col h-full place-items-center">
      {!verifyStatus ? (
        <div className="rounded-full w-fit h-fit overflow-hidden animate-pulse">
          <Webcam className="h-96 w-96 mx-auto scale-135" />
        </div>
      ) : (
        <CircleCheck size={256} className="text-green-400" />
      )}

      <h1 className="mt-6 mb-4 font-bold text-xl">{verifyStatus ? "Verification passed!" : "Please look at the camera"}</h1>
      {verifyStatus && <p>Please return to the voting system to continue voting.</p>}
    </div>
  );
}
