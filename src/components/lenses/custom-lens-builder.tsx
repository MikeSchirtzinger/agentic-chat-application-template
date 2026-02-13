"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomLens } from "@/features/lenses/types";

interface CustomLensBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLensCreated: (lens: CustomLens) => void;
}

interface GeneratedLens {
  name: string;
  description: string;
  prompt: string;
  icon: string;
}

export function CustomLensBuilder({ open, onOpenChange, onLensCreated }: CustomLensBuilderProps) {
  const [step, setStep] = useState<"input" | "preview">("input");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedLens | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please enter a mindset description");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/lenses/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate lens");
      }

      const data = (await res.json()) as GeneratedLens;
      setGenerated(data);
      setStep("preview");
    } catch {
      toast.error("Failed to generate lens. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generated) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/lenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: generated.name,
          description: generated.description,
          prompt: generated.prompt,
          icon: generated.icon,
          originalInput: description.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save lens");
      }

      const data = (await res.json()) as CustomLens;
      onLensCreated(data);
      toast.success("Custom lens created successfully");
      handleClose();
    } catch {
      toast.error("Failed to save lens. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setStep("input");
    setDescription("");
    setGenerated(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Custom Lens</DialogTitle>
          <DialogDescription>
            {step === "input"
              ? "Describe the mindset or perspective you want the AI to adopt."
              : "Review and edit the generated lens before saving."}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Mindset Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., Think like a security researcher looking for vulnerabilities"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={isGenerating || !description.trim()}>
                {isGenerating ? "Generating..." : "Generate Lens"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={generated?.name ?? ""}
                onChange={(e) =>
                  setGenerated((prev) => (prev ? { ...prev, name: e.target.value } : null))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={generated?.description ?? ""}
                onChange={(e) =>
                  setGenerated((prev) => (prev ? { ...prev, description: e.target.value } : null))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Lucide icon name)</Label>
              <Input
                id="icon"
                value={generated?.icon ?? ""}
                onChange={(e) =>
                  setGenerated((prev) => (prev ? { ...prev, icon: e.target.value } : null))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={generated?.prompt ?? ""}
                onChange={(e) =>
                  setGenerated((prev) => (prev ? { ...prev, prompt: e.target.value } : null))
                }
                rows={8}
                className="font-mono text-xs"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Lens"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
