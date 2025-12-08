import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Share2, Link2, Mail, 
  Copy, Check, Download, Loader2, 
  Facebook, Twitter, Linkedin, MessageCircle
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";

export default function ReadingShareModal({ 
  isOpen, 
  onClose, 
  reading,
  deckName,
  spreadName,
  drawnCards,
  question 
}) {
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", message: "" });
  const [sending, setSending] = useState(false);
  const cardContainerRef = useRef(null);

  // Generate shareable link
  const generateShareLink = async () => {
    setGenerating(true);
    try {
      // Create a public reading record
      const publicReading = await base44.entities.Reading.create({
        title: reading?.title || "Shared Reading",
        spread_type: spreadName,
        deck_id: reading?.deck_id,
        cards_drawn: drawnCards.map(c => ({
          card_id: c.id,
          position: c.position,
          is_reversed: c.isReversed || false
        })),
        interpretation: reading?.interpretation || "",
        date: new Date().toISOString().split('T')[0],
        is_public: true
      });

      const link = `${window.location.origin}${window.location.pathname}#/SharedReading?id=${publicReading.id}`;
      setShareLink(link);
    } catch (error) {
      console.error("Failed to generate share link:", error);
      alert("Failed to generate share link");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!shareLink) {
      await generateShareLink();
      return;
    }
    
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert("Failed to copy link");
    }
  };

  // Share to social media
  const shareToSocial = async (platform) => {
    if (!shareLink) {
      await generateShareLink();
      return;
    }

    const text = `Check out my ${spreadName} reading: ${reading?.title || "My Reading"}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareLink);

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (url) window.open(url, "_blank", "width=600,height=400");
  };

  // Send via email
  const sendEmail = async () => {
    if (!emailForm.to.trim()) {
      alert("Please enter an email address");
      return;
    }

    setSending(true);
    try {
      if (!shareLink) await generateShareLink();

      const emailBody = `${emailForm.message || "I wanted to share this reading with you:"}\n\n${shareLink}`;

      await base44.integrations.Core.SendEmail({
        to: emailForm.to,
        subject: `Shared Reading: ${reading?.title || "Check out this reading"}`,
        body: emailBody
      });

      alert("Email sent successfully!");
      setEmailForm({ to: "", message: "" });
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Failed to send email: " + (error.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  // Export as image
  const exportAsImage = async () => {
    if (!cardContainerRef.current) return;

    setGenerating(true);
    try {
      const canvas = await html2canvas(cardContainerRef.current, {
        backgroundColor: "#1e1b4b",
        scale: 2
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reading-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export image:", error);
      alert("Failed to export image");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-900 text-white border border-purple-500/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-400" />
            Share Your Reading
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="image">Image</TabsTrigger>
          </TabsList>

          {/* Shareable Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
              <p className="text-sm text-white/80 mb-4">
                Generate a shareable link that anyone can view. Your reading will be saved publicly.
              </p>
              
              {shareLink ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="bg-slate-800 border-white/20 text-white flex-1"
                    />
                    <Button
                      onClick={copyLink}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-green-400">✓ Link generated successfully!</p>
                </div>
              ) : (
                <Button
                  onClick={generateShareLink}
                  disabled={generating}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Generate Shareable Link
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social" className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-white/80 mb-4">
                Share your reading on social media platforms
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => shareToSocial("twitter")}
                  disabled={generating}
                  className="bg-sky-600 hover:bg-sky-700"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  onClick={() => shareToSocial("facebook")}
                  disabled={generating}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button
                  onClick={() => shareToSocial("linkedin")}
                  disabled={generating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button
                  onClick={() => shareToSocial("whatsapp")}
                  disabled={generating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>

              {generating && (
                <p className="text-xs text-white/60 mt-3 text-center">
                  Generating share link...
                </p>
              )}
            </div>
          </TabsContent>

          {/* Email Tab */}
          <TabsContent value="email" className="space-y-4">
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4 space-y-4">
              <p className="text-sm text-white/80">
                Send this reading directly to someone's email
              </p>
              
              <div>
                <Label className="text-white/90 mb-2 block">Recipient Email</Label>
                <Input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                  placeholder="friend@example.com"
                  className="bg-slate-800 border-white/20 text-white"
                />
              </div>

              <div>
                <Label className="text-white/90 mb-2 block">Personal Message (Optional)</Label>
                <Textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  placeholder="Add a personal message..."
                  className="bg-slate-800 border-white/20 text-white min-h-[100px]"
                />
              </div>

              <Button
                onClick={sendEmail}
                disabled={sending || !emailForm.to.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Image Export Tab */}
          <TabsContent value="image" className="space-y-4">
            <div className="bg-pink-900/20 border border-pink-500/30 rounded-lg p-4">
              <p className="text-sm text-white/80 mb-4">
                Export your reading as an image to share anywhere
              </p>

              {/* Preview of what will be exported */}
              <div ref={cardContainerRef} className="bg-gradient-to-br from-indigo-950 to-purple-950 rounded-lg p-6 mb-4">
                <h3 className="text-xl font-bold text-white mb-2">
                  {reading?.title || "My Reading"}
                </h3>
                <p className="text-purple-300 text-sm mb-4">
                  {spreadName} • {deckName}
                </p>
                {question && (
                  <p className="text-white/80 text-sm italic mb-4">"{question}"</p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {drawnCards.slice(0, 6).map((card, idx) => (
                    <div key={idx} className="text-center">
                      {card.image_url && (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-xs text-white/90 font-medium">{card.name}</p>
                      <p className="text-xs text-purple-300">{card.position}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={exportAsImage}
                  disabled={generating}
                  className="flex-1 bg-pink-600 hover:bg-pink-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}