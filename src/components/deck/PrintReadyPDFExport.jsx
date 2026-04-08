import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Printer, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

export default function PrintReadyPDFExport({ deck, cards }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn("Failed to load image, trying proxy or ignoring:", url);
        // Fallback: resolve with null to continue without crashing
        resolve(null);
      };
      // Prevent browser caching issues with CORS by appending a timestamp if it's a supabase URL
      const fetchUrl = url.includes("supabase.co") ? `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}` : url;
      img.src = fetchUrl;
    });
  };

  const handleExport = async (format) => {
    if (!cards || cards.length === 0) {
      alert("No cards in this deck.");
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setStatusText("Initializing PDF...");

    try {
      // Tarot standard: 2.75 x 4.75 inches
      const cardWidth = 2.75;
      const cardHeight = 4.75;
      
      let doc;
      
      if (format === "single") {
        doc = new jsPDF({
          orientation: "portrait",
          unit: "in",
          format: [cardWidth, cardHeight]
        });
      } else {
        doc = new jsPDF({
          orientation: "portrait",
          unit: "in",
          format: "letter"
        });
      }

      let backImg = null;
      if (deck.back_image_url) {
        setStatusText("Loading deck back image...");
        backImg = await loadImage(deck.back_image_url);
      }

      const totalSteps = cards.length;
      let currentStep = 0;

      if (format === "single") {
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          setStatusText(`Processing card ${i + 1} of ${cards.length}...`);
          
          if (i > 0) doc.addPage([cardWidth, cardHeight], "portrait");
          
          if (card.image_url) {
            const img = await loadImage(card.image_url);
            if (img) {
              doc.addImage(img, "JPEG", 0, 0, cardWidth, cardHeight);
            } else {
              doc.text(card.name, 0.2, cardHeight / 2);
            }
          } else {
            doc.text(card.name, 0.2, cardHeight / 2);
          }

          doc.addPage([cardWidth, cardHeight], "portrait");
          if (backImg) {
            doc.addImage(backImg, "JPEG", 0, 0, cardWidth, cardHeight);
          } else {
            doc.text("Deck Back", 0.2, cardHeight / 2);
          }

          currentStep++;
          setProgress(Math.round((currentStep / totalSteps) * 100));
        }
      } else {
        const cols = 3;
        const rows = 2;
        const marginX = (8.5 - (cols * cardWidth)) / 2;
        const marginY = (11 - (rows * cardHeight)) / 2;
        
        let cardIndex = 0;
        while (cardIndex < cards.length) {
          if (cardIndex > 0) doc.addPage("letter", "portrait");
          
          const pageCards = [];
          
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (cardIndex < cards.length) {
                const card = cards[cardIndex];
                pageCards.push(card);
                setStatusText(`Processing front: ${card.name}...`);
                
                const x = marginX + c * cardWidth;
                const y = marginY + r * cardHeight;
                
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.01);
                doc.rect(x, y, cardWidth, cardHeight);
                
                if (card.image_url) {
                  const img = await loadImage(card.image_url);
                  if (img) {
                    doc.addImage(img, "JPEG", x, y, cardWidth, cardHeight);
                  } else {
                    doc.text(card.name, x + 0.2, y + cardHeight / 2);
                  }
                } else {
                  doc.text(card.name, x + 0.2, y + cardHeight / 2);
                }
                cardIndex++;
                
                currentStep++;
                setProgress(Math.round((currentStep / totalSteps) * 100));
              }
            }
          }
          
          doc.addPage("letter", "portrait");
          let backIndex = 0;
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (backIndex < pageCards.length) {
                const mirroredC = cols - 1 - c;
                const x = marginX + mirroredC * cardWidth;
                const y = marginY + r * cardHeight;
                
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.01);
                doc.rect(x, y, cardWidth, cardHeight);
                
                if (backImg) {
                  doc.addImage(backImg, "JPEG", x, y, cardWidth, cardHeight);
                } else {
                  doc.text("Deck Back", x + 0.2, y + cardHeight / 2);
                }
                backIndex++;
              }
            }
          }
        }
      }

      setStatusText("Saving PDF...");
      doc.save(`${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_print_ready.pdf`);
      setIsOpen(false);
      
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Make sure card images are valid and accessible.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-purple-400/60 text-purple-200 hover:bg-purple-500/10 font-semibold">
          <Printer className="w-4 h-4 mr-2" />
          Print PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5 text-purple-400" />
            Export Print-Ready PDF
          </DialogTitle>
        </DialogHeader>
        
        {!isGenerating ? (
          <div className="space-y-4 py-4">
            <p className="text-white/70 text-sm">
              Generate a standard Tarot-sized (2.75" x 4.75") PDF including both card fronts and backs.
            </p>
            
            <div className="grid gap-4">
              <Button 
                variant="outline"
                onClick={() => handleExport("grid")}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 h-auto py-4 flex flex-col items-center gap-2 text-white"
              >
                <div className="font-bold">Home Print (US Letter)</div>
                <div className="text-xs text-white/50 font-normal whitespace-normal text-center">6 cards per page with cut lines. Backs are mirrored for double-sided printing.</div>
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => handleExport("single")}
                className="bg-slate-800 hover:bg-slate-700 border border-white/10 h-auto py-4 flex flex-col items-center gap-2 text-white"
              >
                <div className="font-bold">Professional Print</div>
                <div className="text-xs text-white/50 font-normal whitespace-normal text-center">1 card per page (exact 2.75" x 4.75" dimensions). Perfect for print shops like MPC.</div>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-8 text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
            <div className="space-y-2">
              <div className="text-sm font-medium">{statusText}</div>
              <Progress value={progress} className="h-2 w-full bg-slate-800 border border-white/10" />
              <div className="text-xs text-white/50">{progress}%</div>
            </div>
            <p className="text-xs text-amber-300">
              Please don't close this window. High-res images may take a minute to process.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}