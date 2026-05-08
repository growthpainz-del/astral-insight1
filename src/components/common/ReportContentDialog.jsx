import React, { useState } from 'react';
import { base44 } from "@/api/base44Client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReportContentDialog({ isOpen, onClose, contentType, contentContext }) {
    const [reason, setReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for reporting.");
            return;
        }
        
        setIsSubmitting(true);
        try {
            await base44.entities.ReportedContent.create({
                type: contentType,
                context: contentContext || "Unknown context",
                reason: reason,
                status: "pending"
            });
            toast.success("Report submitted successfully. Thank you for helping keep our community safe.");
            onClose();
            setReason("");
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast.error("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-red-500/30 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-400">
                        <Flag className="w-5 h-5" />
                        Report Content
                    </DialogTitle>
                    <DialogDescription className="text-slate-300">
                        If you found this content offensive, deceptive, or otherwise inappropriate, please let us know.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="reason" className="text-sm font-medium text-slate-200 mb-2 block">
                            Reason for reporting
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please describe why this content is inappropriate..."
                            rows={4}
                            className="bg-black/20 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-400"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-slate-400 hover:text-white">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Submit Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}