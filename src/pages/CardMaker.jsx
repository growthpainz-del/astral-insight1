import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { UploadFile } from "@/integrations/Core";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Image as ImageIcon, Loader2, Sparkles, Wand2, Download, ChevronLeft } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function CardMaker() {
  const [imageSrc, setImageSrc] = useState(null);
  const [originalImageFileUrl, setOriginalImageFileUrl] = useState("");
  const [cardName, setCardName] = useState("The Fool");
  const [frameStyle, setFrameStyle] = useState("classic_white");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [cardMeaning, setCardMeaning] = useState("");
  const [cardSubtitle, setCardSubtitle] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [uprightMeaning, setUprightMeaning] = useState("");
  const [reversedMeaning, setReversedMeaning] = useState("");
  const [keywords, setKeywords] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const canvasRef = useRef(null);

  // For saving directly to a deck
  const [decks, setDecks] = useState([]);
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [deckCards, setDeckCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me().catch(() => null);
      if (user?.email) {
        const allDecks = await base44.entities.Deck.list("-updated_date", 200);
        const myDecks = (allDecks || []).filter(d => d.created_by?.toLowerCase() === user.email.toLowerCase());
        setDecks(myDecks);
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedDeckId && selectedDeckId !== "none") {
      base44.entities.Card.filter({ deck_id: selectedDeckId }).then(cards => {
        setDeckCards(cards || []);
        setSelectedCardId("new");
      });
    } else {
      setDeckCards([]);
      setSelectedCardId("");
    }
  }, [selectedDeckId]);

  useEffect(() => {
    if (imageSrc) {
      drawCanvas();
    }
  }, [imageSrc, cardName, frameStyle]);

  const handleAiSuggest = async () => {
    if (!originalImageFileUrl && !canvasRef.current) return;
    setIsSuggesting(true);
    try {
      let file_url = originalImageFileUrl;
      if (!file_url && canvasRef.current) {
        const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/jpeg', 0.9));
        const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
        const uploadRes = await base44.integrations.Core.UploadFile({ file });
        file_url = uploadRes.file_url;
      }
      
      const selectedDeck = decks.find(d => d.id === selectedDeckId);
      const deckContext = selectedDeck ? `The deck theme is "${selectedDeck.name}". Category: ${selectedDeck.category}. Description: ${selectedDeck.description || "N/A"}.` : "No specific deck theme, make it a general mystical oracle card.";
      
      const nameGuideline = cardName && cardName !== "The Fool" && cardName.trim() !== "" ? `The user has explicitly set the card name to "${cardName}". Please keep this exact name and generate interpretations tailored to this name and the image.` : "";

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image. Suggest a suitable oracle/tarot card name and meaningful interpretations. ${deckContext} ${nameGuideline}`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            subtitle: { type: "string" },
            meaning: { type: "string" },
            upright_meaning: { type: "string" },
            reversed_meaning: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          },
          required: ["name", "meaning"]
        }
      });
      
      const parsed = typeof res === "string" ? JSON.parse(res) : res;
      if (parsed && parsed.name) {
        setCardName(parsed.name);
        setCardSubtitle(parsed.subtitle || "");
        setCardMeaning(parsed.meaning || "");
        setUprightMeaning(parsed.upright_meaning || "");
        setReversedMeaning(parsed.reversed_meaning || "");
        setKeywords(parsed.keywords ? parsed.keywords.join(", ") : "");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to get AI suggestion.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerateDetails = async () => {
    setIsGeneratingDetails(true);
    try {
      const selectedDeck = decks.find(d => d.id === selectedDeckId);
      const deckContext = selectedDeck ? `The deck theme is "${selectedDeck.name}". Category: ${selectedDeck.category}. Description: ${selectedDeck.description || "N/A"}.` : "No specific deck theme, make it a general mystical oracle card.";
      
      const prompt = `Write a deep, evocative, and meaningful interpretation for an oracle/tarot card.
      Card Name: ${cardName || 'Unknown'}
      Subtitle: ${cardSubtitle || 'None'}
      Keywords: ${keywords || 'None'}
      
      ${deckContext}
      `;

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_meaning: { type: "string", description: "Deep overall spiritual meaning of the card" },
            upright_meaning: { type: "string", description: "What it means when drawn upright (actionable advice or insight)" },
            reversed_meaning: { type: "string", description: "What it means when drawn reversed (blocked energy, shadow aspect, or internal reflection)" }
          },
          required: ["overall_meaning", "upright_meaning", "reversed_meaning"]
        }
      });
      
      const parsed = typeof res === "string" ? JSON.parse(res) : res;
      if (parsed) {
        if (parsed.overall_meaning) setCardMeaning(parsed.overall_meaning);
        if (parsed.upright_meaning) setUprightMeaning(parsed.upright_meaning);
        if (parsed.reversed_meaning) setReversedMeaning(parsed.reversed_meaning);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to generate details.");
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setUploadedUrl("");
    };
    reader.readAsDataURL(file);

    setIsSuggesting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setOriginalImageFileUrl(file_url);
      
      const selectedDeck = decks.find(d => d.id === selectedDeckId);
      const deckContext = selectedDeck ? `The deck theme is "${selectedDeck.name}". Category: ${selectedDeck.category}. Description: ${selectedDeck.description || "N/A"}.` : "No specific deck theme, make it a general mystical oracle card.";
      
      const nameGuideline = cardName && cardName !== "The Fool" && cardName.trim() !== "" ? `The user has explicitly set the card name to "${cardName}". Please keep this exact name and generate interpretations tailored to this name and the image.` : "";

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this image. Suggest a suitable oracle/tarot card name and meaningful interpretations. ${deckContext} ${nameGuideline}`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            subtitle: { type: "string" },
            meaning: { type: "string" },
            upright_meaning: { type: "string" },
            reversed_meaning: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          },
          required: ["name", "meaning"]
        }
      });
      
      const parsed = typeof res === "string" ? JSON.parse(res) : res;
      if (parsed && parsed.name) {
        setCardName(parsed.name);
        setCardSubtitle(parsed.subtitle || "");
        setCardMeaning(parsed.meaning || "");
        setUprightMeaning(parsed.upright_meaning || "");
        setReversedMeaning(parsed.reversed_meaning || "");
        setKeywords(parsed.keywords ? parsed.keywords.join(", ") : "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Card dimensions (standard tarot is roughly 2.75 x 4.75, ratio ~0.58)
    const width = 800;
    const height = 1380;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.onload = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background based on frame style
      if (frameStyle === "classic_white") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
      } else if (frameStyle === "dark_magic") {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, width, height);
      } else if (frameStyle === "vintage") {
        ctx.fillStyle = "#f4ebd0";
        ctx.fillRect(0, 0, width, height);
      } else if (frameStyle === "gold_border") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      // Calculate image placement (leave margin for border and text)
      let marginX = 40;
      let marginY = 40;
      let textSpace = 180;
      
      if (frameStyle === "gold_border") {
        marginX = 60;
        marginY = 60;
        textSpace = 200;
        
        // Draw gold border
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = 10;
        ctx.strokeRect(30, 30, width - 60, height - 60);
        ctx.strokeRect(45, 45, width - 90, height - 90);
      }

      const drawWidth = width - (marginX * 2);
      const drawHeight = height - marginY - textSpace;

      // Draw image (cover object-fit style)
      const scale = Math.max(drawWidth / img.width, drawHeight / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = marginX + (drawWidth - scaledWidth) / 2;
      const offsetY = marginY + (drawHeight - scaledHeight) / 2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(marginX, marginY, drawWidth, drawHeight);
      ctx.clip();
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      ctx.restore();

      // Inner border around image
      if (frameStyle === "classic_white" || frameStyle === "vintage") {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.strokeRect(marginX, marginY, drawWidth, drawHeight);
      }

      // Draw Text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const textY = height - (textSpace / 2);
      
      if (frameStyle === "classic_white") {
        ctx.fillStyle = "#000000";
        ctx.font = "bold 60px serif";
      } else if (frameStyle === "dark_magic") {
        ctx.fillStyle = "#e0e7ff";
        ctx.font = "italic 60px serif";
      } else if (frameStyle === "vintage") {
        ctx.fillStyle = "#3e2723";
        ctx.font = "bold 70px 'Courier New', Courier, monospace";
      } else if (frameStyle === "gold_border") {
        ctx.fillStyle = "#d4af37";
        ctx.font = "bold 65px serif";
      }

      ctx.fillText(cardName.toUpperCase(), width / 2, textY);
    };
    img.src = imageSrc;
  };

  const handleExportAndUpload = async () => {
    if (!canvasRef.current) return;
    setIsUploading(true);

    try {
      // 1. Get blob from canvas
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/jpeg', 0.9));
      
      // Convert blob to File object for UploadFile
      const file = new File([blob], `${cardName.replace(/\\s+/g, '_')}_cardified.jpg`, { type: 'image/jpeg' });

      // 2. Upload using Core integration
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedUrl(file_url);

      // 3. Attach to card if selected
      const keywordsArray = keywords ? keywords.split(",").map(k => k.trim()).filter(Boolean) : undefined;
      const updateData = {
        image_url: file_url,
        subtitle: cardSubtitle || undefined,
        number: cardNumber !== "" ? Number(cardNumber) : undefined,
        overall_meaning: cardMeaning || undefined,
        upright_meaning: uprightMeaning || undefined,
        reversed_meaning: reversedMeaning || undefined,
        keywords: keywordsArray?.length > 0 ? keywordsArray : undefined
      };
      
      if (selectedDeckId && selectedDeckId !== "none") {
        if (selectedCardId && selectedCardId !== "none" && selectedCardId !== "new") {
          await base44.entities.Card.update(selectedCardId, updateData);
          alert("Image and meaning attached to card!");
        } else if (selectedCardId === "new") {
          await base44.entities.Card.create({
            deck_id: selectedDeckId,
            name: cardName,
            ...updateData
          });
          alert("New card created in deck!");
        }
      } else {
        // Save to Card Library (unassigned)
        await base44.entities.Card.create({
          deck_id: "unassigned",
          name: cardName || "Untitled Card",
          ...updateData
        });
        alert("Card saved to your Card Library!");
      }

    } catch (error) {
      console.error(error);
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link to={createPageUrl("Studio")}>
          <Button variant="ghost" className="mb-4 text-purple-300 hover:text-purple-100 hover:bg-purple-900/30">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Studio
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-purple-400" />
          Cardify Studio
        </h1>
        <p className="text-white/60 mb-8">Turn your custom photos and art into beautiful, uniform oracle cards.</p>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6 bg-slate-900/50 p-6 rounded-2xl border border-white/10">
            <div>
              <Label className="text-lg text-white mb-2 block">1. Upload Image</Label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-black/20 hover:bg-black/40 hover:border-purple-500/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-white/50 mb-2" />
                    <p className="text-sm text-white/70 font-semibold">Click to upload photo</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {imageSrc && (
              <>
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg text-white block">2. Customize Card</Label>
                    <Button 
                      size="sm" 
                      onClick={handleAiSuggest} 
                      disabled={isSuggesting}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                    >
                      {isSuggesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      AI Suggest
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Card Name</Label>
                      <Input 
                        value={cardName} 
                        onChange={e => setCardName(e.target.value)} 
                        className="bg-black/40 border-white/20 mt-1"
                        placeholder="e.g. The Fool"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Subtitle</Label>
                      <Input 
                        value={cardSubtitle} 
                        onChange={e => setCardSubtitle(e.target.value)} 
                        className="bg-black/40 border-white/20 mt-1"
                        placeholder="e.g. New Beginnings"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Card Number</Label>
                      <Input 
                        type="number"
                        value={cardNumber} 
                        onChange={e => setCardNumber(e.target.value)} 
                        className="bg-black/40 border-white/20 mt-1"
                        placeholder="e.g. 0"
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Keywords (comma separated)</Label>
                      <Input 
                        value={keywords} 
                        onChange={e => setKeywords(e.target.value)} 
                        className="bg-black/40 border-white/20 mt-1"
                        placeholder="e.g. journey, innocence"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label className="text-white/70">Overall Meaning</Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleGenerateDetails}
                        disabled={isGeneratingDetails || !cardName}
                        className="text-purple-300 hover:text-purple-100 hover:bg-purple-900/30 h-7 text-xs px-2"
                      >
                        {isGeneratingDetails ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1" />}
                        AI Write Details
                      </Button>
                    </div>
                    <textarea 
                      value={cardMeaning} 
                      onChange={e => setCardMeaning(e.target.value)} 
                      className="flex min-h-[60px] w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                      placeholder="Overall card meaning..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Upright Meaning</Label>
                      <textarea 
                        value={uprightMeaning} 
                        onChange={e => setUprightMeaning(e.target.value)} 
                        className="flex min-h-[60px] w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                        placeholder="Upright meaning..."
                      />
                    </div>
                    <div>
                      <Label className="text-white/70">Reversed Meaning</Label>
                      <textarea 
                        value={reversedMeaning} 
                        onChange={e => setReversedMeaning(e.target.value)} 
                        className="flex min-h-[60px] w-full rounded-md border border-white/20 bg-black/40 px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                        placeholder="Reversed meaning..."
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/70">Frame Style</Label>
                    <Select value={frameStyle} onValueChange={setFrameStyle}>
                      <SelectTrigger className="bg-black/40 border-white/20 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic_white">Classic White Border</SelectItem>
                        <SelectItem value="dark_magic">Dark Magic (Midnight)</SelectItem>
                        <SelectItem value="vintage">Vintage Parchment</SelectItem>
                        <SelectItem value="gold_border">Opulent Gold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <Label className="text-lg text-white block">3. Save & Attach</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white/70">Select Deck (Optional)</Label>
                      <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                        <SelectTrigger className="bg-black/40 border-white/20 mt-1">
                          <SelectValue placeholder="Select Deck" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {decks.map(d => (
                            <SelectItem key={d.id} value={d.id}>
                              {d.name} {d.publish_status && d.publish_status !== "published" ? `(${d.publish_status})` : (!d.publish_status ? "(draft)" : "")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white/70">Select Card</Label>
                      <Select value={selectedCardId} onValueChange={setSelectedCardId} disabled={!selectedDeckId || selectedDeckId === "none"}>
                        <SelectTrigger className="bg-black/40 border-white/20 mt-1">
                          <SelectValue placeholder="Select Card" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="new">✨ Create New Card</SelectItem>
                          {deckCards.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    onClick={handleExportAndUpload} 
                    disabled={isUploading}
                    className="w-full bg-purple-600 hover:bg-purple-700 py-6 text-lg mt-4"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                    Generate & Upload
                  </Button>

                  {uploadedUrl && (
                    <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-300 text-sm mt-4 text-center">
                      Success! Card saved successfully.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col items-center justify-center bg-black/40 p-6 rounded-2xl border border-white/5">
            <h2 className="text-white/60 font-semibold mb-6">Live Preview</h2>
            {imageSrc ? (
              <div className="relative shadow-2xl shadow-purple-900/20 max-w-[300px] w-full rounded-xl overflow-hidden">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-auto rounded-xl"
                  style={{ display: "block" }}
                />
              </div>
            ) : (
              <div className="w-[300px] h-[450px] border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/30 flex-col gap-4">
                <ImageIcon className="w-12 h-12" />
                <p>Upload an image to see preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}