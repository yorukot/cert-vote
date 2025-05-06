"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, User, Info, Vote, Check, X, Annoyed, Frown, Smile, LoaderCircle, ClipboardCopy } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";

interface PollCardProps {
  pollId: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  imageSrc?: string;
  creator?: string;
  totalPossibleVotes?: number;
  status: "ongoing" | "completed" | "upcoming";
  className?: string;
}

export function PollCard({ pollId, title, startDate, endDate, description, imageSrc, creator, totalPossibleVotes = 100, status, className }: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keyGenError, setKeyGenError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [voteHash, setVoteHash] = useState<string | null>(null);
  const [randomUserId, setRandomUserId] = useState<string | null>(null);
  const [voted, setVoted] = useState<boolean>(false);
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [isFacialWindowOpened, setIsFacialWindowOpened] = useState(false);

  // Function to clear all sensitive voting data
  const clearVotingData = () => {
    // Clear all voting-related data from localStorage
    localStorage.removeItem(`poll_jwt_${pollId}`);
    localStorage.removeItem(`poll_random_id_${pollId}`);
    localStorage.removeItem(`poll_private_key_${pollId}`);

    // Reset state
    setShowConfetti(false);
    setSuccess(false);
    setVoteHash(null);
    setNationalId("");
    setSelectedVote(null);
  };

  useEffect(() => {
    fetch(`/api/polls/${pollId}/poll-count`)
      .then((res) => res.json())
      .then((data) => {
        setVoteCount(data.agree + data.disagree + data.abstain || 0);
      });
  }, [voted, pollId]);

  // Function to submit the final vote using the generated key
  const submitVote = async (randomId: string, privateKey: CryptoKey, option: string) => {
    try {
      // Create signature for the vote
      const encoder = new TextEncoder();
      const data = encoder.encode(randomId + option);
      const signature = await window.crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, privateKey, data);

      // Convert signature to Base64
      const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

      // Submit the vote
      const voteRes = await fetch(`/api/polls/${pollId}/vote-blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voteRandomId: randomId,
          selectedOption: option,
          userSignature: signatureBase64,
        }),
      });

      // Get the response data
      const voteData = await voteRes.json();

      if (!voteRes.ok) {
        throw new Error(voteData.error || "Failed to submit vote");
      }

      // Store the vote hash from the response
      if (voteData.createdVoteBlock?.hash) {
        setVoteHash(voteData.createdVoteBlock.hash);
      }

      // Update success state and show confetti
      setSuccess(true);
      setShowConfetti(true);
    } catch (err: any) {
      setVoteError(err.message || "Failed to submit vote");
      setGeneratingKey(false);
    }
  };

  const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    ongoing: "secondary",
    completed: "default",
    upcoming: "outline",
  };

  const progressPercentage = Math.min(Math.round((voteCount / totalPossibleVotes) * 100), 100);

  // Format timestamp to readable date
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(parseInt(timestamp) * 1000);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return timestamp;
    }
  };

  const handleVoteClick = (vote: string) => {
    setSelectedVote(vote);
    setDialogOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setVoteError(null);
    setSuccess(false);
    setKeyGenError(null);

    // Clear any previous voting data
    clearVotingData();

    try {
      const res = await fetch(`/api/polls/${pollId}/verification-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nationalId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get token");
      if (data.verificationToken) {
        localStorage.setItem(`poll_jwt_${pollId}`, data.verificationToken);
        setSuccess(true);
        setGeneratingKey(true);
        // Generate key pair and UUID, send to backend
        await (async () => {
          try {
            const keyPair = await window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
            const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
            const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
            const randomId = uuidv4();
            setRandomUserId(randomId);
            // You may want to get userId from the JWT or user context
            const userId = "anonymous";
            const voteKeyRes = await fetch(`/api/polls/${pollId}/vote-key`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userPublicKey: publicKeyBase64,
                voteRandomId: randomId,
                verificationToken: data.verificationToken,
                userId,
              }),
            });
            if (!voteKeyRes.ok) {
              const errData = await voteKeyRes.json();
              throw new Error(errData.error || "Failed to register vote key");
            }
            // Store necessary data for voting
            localStorage.setItem(`poll_random_id_${pollId}`, randomId);

            // Export private key for signing
            const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
            const privateKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer)));
            localStorage.setItem(`poll_private_key_${pollId}`, privateKeyBase64);

            // Now submit the actual vote
            await submitVote(randomId, keyPair.privateKey, selectedVote!);
            setVoted(true);

            setGeneratingKey(false);
            setDialogOpen(false);
            setNationalId("");
            setSelectedVote(null);
          } catch (err: any) {
            setKeyGenError(err.message || "Key generation failed");
            setGeneratingKey(false);
          }
        })();
      }
    } catch (err: any) {
      setVoteError(err.message || "Unknown error");
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      clearVotingData();
    };
  }, []);

  return (
    <>
      <AlertDialog open={showConfetti} onOpenChange={setShowConfetti}>
        <AlertDialogContent className="sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>投票成功！🎉</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <>
                <p className="mb-6">您的投票已由您的私鑰安全簽署並存儲在區塊鏈上以確保完整性</p>

                <p className="mb-1">投票隨機 ID：</p>
                {randomUserId && <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] mb-1 font-mono text-sm font-semibold w-full overflow-x-scroll">{randomUserId}</code>}
                <p className="mb-1">區塊哈希：</p>
                {voteHash && <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold w-full overflow-x-scroll">{voteHash}</code>}

                <p className="mt-3 text-sm text-muted-foreground">您的個人數據不會與您的投票綁定，只有投票隨機 ID 存儲在區塊鏈上。</p>
              </>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button
                variant={voteHash ? "secondary" : "default"}
                className="cursor-pointer"
                onClick={() => {
                  setNationalId("");
                  setGeneratingKey(false);
                  setSubmitting(false);
                  setRandomUserId(null);
                }}
              >
                關閉
              </Button>
            </AlertDialogCancel>
            {voteHash && (
              <AlertDialogAction
                onClick={() => {
                  navigator.clipboard.writeText(voteHash);
                  setNationalId("");
                  setGeneratingKey(false);
                  setSubmitting(false);
                }}
              >
                複製區塊哈希並關閉
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}

      <div className="shadow-sm hover:shadow-md w-full">
        <Card className="overflow-hidden w-full rounded-t-xl rounded-b-none border-t border-x border-b-0 shadow-none duration-200 relative gap-0">
          <CardHeader className="cursor-pointer flex flex-row justify-between items-center" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-muted-foreground">
                <ChevronDown size={16} />
              </motion.div>
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
            </div>
            <Badge variant={statusVariant[status]} className="capitalize text-xs">
              {status}
            </Badge>
          </CardHeader>

          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.35, 1, 0.8, 0.85] }}>
                <CardContent className="px-6 pt-0 mt-6 space-y-4">
                  {/* Dates */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>開始：{formatDate(startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>結束：{formatDate(endDate)}</span>
                    </div>
                  </div>

                  {/* Creator */}
                  {creator && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      <span>創建者：{creator}</span>
                    </div>
                  )}

                  {/* Description */}
                  {description && (
                    <div className="flex gap-2 text-xs place-items-center">
                      <Info size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
                      <p className="text-sm">{description}</p>
                    </div>
                  )}

                  {/* Image */}
                  {imageSrc && (
                    <div className="relative h-32 w-full overflow-hidden rounded-md">
                      <Image src={imageSrc} alt={`Image for ${title}`} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex flex-row justify-between items-center">
                    {/* Vote count */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{voteCount != null ? voteCount : "..."}</span>
                      <span className="text-xs text-muted-foreground">人已投票</span>
                    </div>
                    {/* Voting buttons as dropdown */}
                    <div className="flex pt-2 justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm" className={cn(status === "ongoing" && "cursor-pointer")} disabled={status !== "ongoing" || voted}>
                            <Vote size={16} /> {voted ? "已投票" : "投票"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="flex flex-col gap-2">
                          <DropdownMenuItem onClick={() => handleVoteClick("agree")} className="cursor-pointer">
                            {" "}
                            <Smile size={16} /> 同意{" "}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVoteClick("abstain")} className="cursor-pointer">
                            {" "}
                            <Annoyed size={16} /> 棄權{" "}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVoteClick("disagree")} className="cursor-pointer">
                            {" "}
                            <Frown size={16} /> 反對{" "}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Dialog for national ID input and key generation */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                      {generatingKey || submitting ? (
                        <>
                          <span className="text-sm text-muted-foreground mb-2">正在處理您的投票</span>
                          <span className="text-xs text-destructive mb-4">金鑰生成過程中請勿關閉或刷新此窗口。</span>
                          <LoaderCircle className="animate-spin" size={28} />
                          {keyGenError && <div className="text-destructive text-xs mt-2">{keyGenError}</div>}
                        </>
                      ) : (
                        <form onSubmit={handleDialogSubmit} className="space-y-4">
                          <DialogHeader>
                            <DialogTitle>輸入身份證號碼</DialogTitle>
                            <DialogDescription>
                              要在 <span className={"font-semibold"}>{title}</span> 中投 <span className="font-semibold">{selectedVote}</span>，請輸入您的身份證號碼。
                            </DialogDescription>
                          </DialogHeader>
                          <Input placeholder="身份證號碼" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required autoFocus disabled={submitting} />
                          <Input placeholder="身份證卡號" />
                          {voteError && <div className="text-destructive text-xs">{voteError}</div>}
                          {success && <div className="text-green-600 text-xs">投票令牌已保存！</div>}
                          <DialogFooter>
                            <Button
                              disabled={isFacialWindowOpened}
                              variant={isFacialWindowOpened ? "outline" : "default"}
                              className="cursor-pointer"
                              onClick={() => {
                                window.open("/face", "_blank")?.focus();
                                setIsFacialWindowOpened(true);
                              }}
                            >
                              {isFacialWindowOpened && <Check size={12} className="mr-2" />}
                              掃描您的臉部
                            </Button>
                            <Button type="submit" disabled={submitting || !nationalId || !isFacialWindowOpened} variant={isFacialWindowOpened ? "default" : "outline"}>
                              {submitting ? "提交中..." : "提交投票"}
                            </Button>
                          </DialogFooter>
                        </form>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Progress bar - always visible at bottom */}
        </Card>
        <div className="w-full h-3 bg-muted border-x border-b border-primary/20 rounded-b-xl">
          <div
            className={cn(
              "h-full rounded-bl-xl",
              {
                "bg-secondary": status === "ongoing",
                "bg-primary": status === "completed",
                "bg-muted-foreground": status === "upcoming",
              },
              progressPercentage >= 99 ? "rounded-r-none" : "rounded-br-xl",
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </>
  );
}
