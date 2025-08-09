"use client";
import { Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

export const ActionButtons = ({
  onSave, onDelete, loadingAction
}: {
  onSave: () => void;
  onDelete: () => void;
  loadingAction: "save" | "delete" | null;
}) => (
  <div className="grid grid-cols-2 gap-4 w-full">
    <Button onClick={onSave} className="bg-green-600 text-white flex items-center justify-center" disabled={Boolean(loadingAction)}>
      {loadingAction === "save" ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Record</>}
    </Button>
    <Button onClick={onDelete} className="bg-red-600 text-white flex items-center justify-center" disabled={Boolean(loadingAction)}>
      {loadingAction === "delete" ? "Deleting..." : <><Trash2 /> Delete Record</>}
    </Button>
  </div>
);
