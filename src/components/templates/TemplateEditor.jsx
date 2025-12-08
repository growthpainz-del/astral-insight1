import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, Loader2 } from "lucide-react";

export default function TemplateEditor({ onSave, isSaving }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("bundle");
  const [isPublic, setIsPublic] = React.useState(false);
  const [jsonText, setJsonText] = React.useState("");
  const [tagsText, setTagsText] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = () => {
    setError("");
    let obj;
    try {
      obj = JSON.parse(jsonText || "{}");
    } catch (e) {
      setError("Invalid JSON. Please fix and try again.");
      return;
    }
    const tags = tagsText.split(",").map(t => t.trim()).filter(Boolean);
    onSave?.({
      name: name || "Untitled",
      description,
      category,
      is_public: isPublic,
      template_json: obj,
      tags
    });
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="text-lg">Create a Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-white/70">Title</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template title" className="bg-black/40 border-white/20 text-white" />
          </div>
          <div>
            <label className="text-sm text-white/70">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-black/40 border-white/20 text-white"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-slate-900 border-white/10 text-white">
                <SelectItem value="bundle">Bundle</SelectItem>
                <SelectItem value="persona">Persona</SelectItem>
                <SelectItem value="spreads">Spreads</SelectItem>
                <SelectItem value="cards">Cards</SelectItem>
                <SelectItem value="deck">Deck</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this template include?" className="bg-black/40 border-white/20 text-white" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Tags (comma separated)</label>
            <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="e.g., doomsday, persona, spreads" className="bg-black/40 border-white/20 text-white" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            <span className="text-sm">{isPublic ? "Public" : "Private"}</span>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-white/70">Template JSON</label>
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='Paste your JSON (e.g., {"persona": {...}, "spreads": [...], "cards": [...]})'
              className="bg-black/40 border-white/20 text-white min-h-[220px]"
            />
          </div>
        </div>
        {error ? <p className="text-red-300 text-sm">{error}</p> : null}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSaving} className="bg-gradient-to-r from-purple-600 to-blue-600">
            {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : (<><UploadCloud className="w-4 h-4 mr-2" /> Save Template</>)}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}