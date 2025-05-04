"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, User, Info, Vote, Check, X, Annoyed, Frown, Smile } from "lucide-react";
import Image from "next/image";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { v4 as uuidv4 } from "uuid";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

interface PollCardProps {
  pollId: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  imageSrc?: string;
  creator?: string;
  voteCount: number;
  totalPossibleVotes?: number;
  status: "ongoing" | "completed" | "upcoming";
  className?: string;
}

export function PollCard({ pollId, title, startDate, endDate, description, imageSrc, creator, voteCount, totalPossibleVotes = 100, status, className }: PollCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [nationalId, setNationalId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [keyGenError, setKeyGenError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [voteHash, setVoteHash] = useState<string | null>(null);

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
      // Hide confetti after 5 seconds
      setTimeout(() => clearVotingData(), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to submit vote");
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
    setError(null);
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
        (async () => {
          try {
            const keyPair = await window.crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
            const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
            const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));
            const randomId = uuidv4();
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
      setError(err.message || "Unknown error");
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
      {showConfetti && (
        <>
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white/80 p-6 rounded-lg shadow-lg text-center max-w-md backdrop-blur-sm pointer-events-auto">
              <div className="text-3xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Vote Successfully Cast!</h2>
              <p className="text-gray-700 mb-4">Your vote has been securely recorded on the blockchain.</p>
              
              {voteHash && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-1">Verification Hash:</p>
                  <div className="flex items-center gap-2 bg-gray-100 p-2 rounded overflow-x-auto">
                    <code className="text-xs font-mono text-gray-700 whitespace-nowrap overflow-x-auto">{voteHash}</code>
                    <button 
                      className="min-w-[60px] text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary/80 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(voteHash);
                        alert("Hash copied to clipboard!");
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">You can use this hash to verify your vote on the blockchain.</p>
                </div>
              )}
              
              <button
                className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors"
                onClick={() => clearVotingData()}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
      <div className="shadow-sm hover:shadow-md w-full">
        <Card className="overflow-hidden w-full rounded-t-xl rounded-b-none border-t border-x border-b-0 shadow-none duration-200 relative">
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
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                <CardContent className="px-6 pt-0 space-y-4">
                  {/* Dates */}
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>Start: {formatDate(startDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar size={12} />
                      <span>End: {formatDate(endDate)}</span>
                    </div>
                  </div>

                  {/* Creator */}
                  {creator && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User size={12} />
                      <span>Created by: {creator}</span>
                    </div>
                  )}

                  {/* Description */}
                  {description && (
                    <div className="flex gap-2 text-xs">
                      <Info size={12} className="text-muted-foreground flex-shrink-0 mt-0.5" />
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
                      <span className="text-3xl font-bold text-primary">{voteCount}</span>
                      <span className="text-xs text-muted-foreground">people voted</span>
                    </div>
                    {/* Voting buttons as dropdown */}
                    <div className="flex pt-2 justify-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="default" size="sm" disabled={status !== "ongoing"}>
                            <Vote size={16} /> Vote
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="flex flex-col gap-2">
                          <DropdownMenuItem onClick={() => handleVoteClick("agree")}>
                            {" "}
                            <Smile size={16} /> Agree{" "}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVoteClick("abstain")}>
                            {" "}
                            <Annoyed size={16} /> Abstain{" "}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleVoteClick("disagree")}>
                            {" "}
                            <Frown size={16} /> Disagree{" "}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  {/* Dialog for national ID input and key generation */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                      {generatingKey || submitting ? (
                        <div className="flex flex-col items-center justify-center py-4">
                          <span className="text-sm text-muted-foreground mb-2">Generating public/private key for encryption…</span>
                          <span className="text-xs text-destructive mb-4">Do not close or refresh this window during key generation.</span>
                          <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          {keyGenError && <div className="text-destructive text-xs mt-2">{keyGenError}</div>}
                        </div>
                      ) : (
                        <form onSubmit={handleDialogSubmit} className="space-y-4">
                          <DialogHeader>
                            <DialogTitle>Enter National ID</DialogTitle>
                            <DialogDescription>
                              To vote <span className="font-semibold">{selectedVote}</span>, please enter your national ID.
                            </DialogDescription>
                          </DialogHeader>
                          <Input placeholder="National ID" value={nationalId} onChange={(e) => setNationalId(e.target.value)} required autoFocus disabled={submitting} />
                          {error && <div className="text-destructive text-xs">{error}</div>}
                          {success && <div className="text-green-600 text-xs">Vote token saved!</div>}
                          <DialogFooter>
                            <Button type="submit" disabled={submitting || !nationalId}>
                              {submitting ? "Submitting..." : "Submit Vote"}
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
