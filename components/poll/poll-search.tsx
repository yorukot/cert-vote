import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PollSearchProps {
  placeholder?: string;
  setValue?: (value: string) => void;
  value?: string;
  className?: string;
}

export function PollSearch({ placeholder = "Search polls...", setValue = () => {}, value = "", className }: PollSearchProps) {
  const handleClear = () => {
    setValue("");
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 max-w-3xl place-items-center">
      <p className="place-self-start my-auto font-bold text-lg">Choose one event to vote:</p>
      <form className={cn("flex items-center gap-2 max-w-xl rounded-lg px-3 py-2 shadow-sm place-self-end", className)}>
        <Search className="text-muted-foreground mr-2" size={20} />
        <Input type="text" className="max-w-48" value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)} placeholder={placeholder} aria-label="Search polls" />
      </form>
    </div>
  );
}
