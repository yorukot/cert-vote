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
    <form
      className={cn(
        "flex items-center gap-2 w-full max-w-xl bg-background border rounded-lg px-3 py-2 shadow-sm",
        className
      )}
    >
      <Search className="text-muted-foreground mr-2" size={20} />
      <Input
        type="text"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="Search polls"
      />
      {value && (
        <Button type="button" size="icon" variant="ghost" onClick={handleClear} className="text-muted-foreground">
          <X size={18} />
        </Button>
      )}
    </form>
  );
}
