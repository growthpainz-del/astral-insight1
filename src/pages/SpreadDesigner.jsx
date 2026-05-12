import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Plus, Trash2, Save, Eye, EyeOff, Info, Sparkles } from "lucide-react";
import SpreadDesignCanvas from "@/components/spread/SpreadDesignCanvas";
import SpreadLayout from "@/components/reading/SpreadLayout";
import InteractiveSpreadTester from "@/components/spread/InteractiveSpreadTester";
import AISpreadAssistant from "@/components/spread/AISpreadAssistant";
import { getDesignerAspectRatio } from "@/components/utils/cardSizing";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SpreadDesigner() {
  const [spreadName, setSpreadName] = useState("");
  const [spreadDescription, setSpreadDescription] = useState("");
  const [spreadCategory, setSpreadCategory] = useState("General");
  const [positions, setPositions] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [requiresPositions, setRequiresPositions] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

  const [searchParams] = useSearchParams();
  const spreadId = searchParams.get("id");
  const [isLoading, setIsLoading] = useState(!!spreadId);

  useEffect(() => {
    if (!spreadId) return;

    (async () => {
      try {
        const spread = await base44.entities.Spread.get(spreadId);
        setSpreadName(spread.name || "");
        setSpreadDescription(spread.description || "");
        setSpreadCategory(spread.category || "General");
        setPositions(spread.positions || []);
        setIsPublic(spread.is_public || false);
        setRequiresPositions(spread.requires_positions !== false);
      } catch (error) {
        setSaveMessage("Failed to load spread");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [spreadId]);

  const addPosition = () => {
    const newPos = {
      name: `Position ${positions.length + 1}`,
      meaning: "",
      x: 50,
      y: 50,
      rotation: 0,
    };
    setPositions([...positions, newPos]);
  };

  const removePosition = (index) => {
    setPositions(positions.filter((_, i) => i !== index));
  };

  const updatePositionField = (index, field, value) => {
    const updated = positions.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    setPositions(updated);
  };

  const handleSave = async () => {
    if (!spreadName.trim()) {
      setSaveMessage("Please enter a spread name");
      return;
    }
    if (positions.length === 0) {
      setSaveMessage("Please add at least one position");
      return;
    }
    for (let i = 0; i < positions.length; i++) {
      if (!positions[i].name?.trim()) {
        setSaveMessage(`Position ${i + 1} needs a name`);
        return;
      }
      if (!positions[i].meaning?.trim()) {
        setSaveMessage(`Position ${i + 1} needs a meaning`);
        return;
      }
    }

    setIsSaving(true);
    setSaveMessage("");

    try {
      const spreadData = {
        name: spreadName.trim(),
        description: spreadDescription.trim(),
        category: spreadCategory,
        positions,
        is_public: isPublic,
        requires_positions: requiresPositions,
      };

      if (spreadId) {
        await base44.entities.Spread.update(spreadId, spreadData);
        setSaveMessage("✅ Spread updated successfully!");
      } else {
        await base44.entities.Spread.create(spreadData);
        setSaveMessage("✅ Spread created successfully!");
        setTimeout(() => {
          setSpreadName("");
          setSpreadDescription("");
          setPositions([]);
        }, 2000);
      }
    } catch (error) {
      setSaveMessage("❌ Failed to save spread. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 5000);
    }
  };

  const mockCards = React.useMemo(() => {
    return positions.map((pos, idx) => ({
      id: `preview-card-${idx}`,
      name: pos.name || `Card ${idx + 1}`,
      image_url:
        "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=400&h=600&fit=crop",
      overall_meaning: pos.meaning || "",
      isFlipped: true,
      position_number: idx + 1,
    }));
  }, [positions]);

  const aspectRatio = getDesignerAspectRatio(positions.length);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading spread...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-black text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("SpreadManager")}>
              <Button variant="ghost" className="text-purple-300 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              {spreadId ? "Edit Spread" : "Create Spread"}
            </h1>
          </div>

          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            className={`border-cyan-500/40 ${
              previewMode ? "bg-cyan-600/20 text-cyan-300" : "text-white"
            }`}
          >
            {previewMode ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Show Preview
              </>
            )}
          </Button>
        </div>

        {saveMessage && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              saveMessage.includes("✅")
                ? "bg-green-500/20 border border-green-500/40 text-green-200"
                : "bg-red-500/20 border border-red-500/40 text-red-200"
            }`}
          >
            {saveMessage}
          </div>
        )}

        {/* Mobile layout */}
        <div className="lg:hidden">
          <Tabs defaultValue="canvas" className="w-full">
            <TabsList className="grid grid-cols-3 w-full sticky top-0 z-10 bg-slate-900/80 backdrop-blur rounded-xl">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="canvas">
              <div
                className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 h-[calc(100vh-180px)] overflow-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-purple-300">
                    Visual Layout
                  </h2>
                  <Button
                    onClick={addPosition}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                {positions.length > 0 ? (
                  <SpreadDesignCanvas
                    positions={positions}
                    onChange={setPositions}
                    showGrid={true}
                    aspectRatio={aspectRatio}
                  />
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center min-h-[50vh] flex items-center justify-center">
                    <div>
                      <p className="text-white/60 mb-4">
                        Add positions to start designing your spread layout
                      </p>
                      <Button
                        onClick={addPosition}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add First Position
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div
                className="space-y-6 p-4 h-[calc(100vh-180px)] overflow-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
                  <h2 className="text-xl font-bold text-purple-300">
                    Spread Details
                  </h2>
                  <div>
                    <Label htmlFor="spread-name">Spread Name *</Label>
                    <Input
                      id="spread-name"
                      value={spreadName}
                      onChange={(e) => setSpreadName(e.target.value)}
                      placeholder="e.g., Celtic Cross, Three Card Spread"
                      className="bg-black/50 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spread-description">Description</Label>
                    <Textarea
                      id="spread-description"
                      value={spreadDescription}
                      onChange={(e) => setSpreadDescription(e.target.value)}
                      placeholder="Describe what this spread is for and how to use it..."
                      className="bg-black/50 border-white/20 text-white min-h-[80px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spread-category">Category</Label>
                    <Select
                      value={spreadCategory}
                      onValueChange={setSpreadCategory}
                    >
                      <SelectTrigger
                        id="spread-category"
                        className="bg-black/50 border-white/20 text-white"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-white/20 text-white">
                        <SelectItem value="General">General</SelectItem>
                        <SelectItem value="Love">Love & Relationships</SelectItem>
                        <SelectItem value="Career">Career & Finance</SelectItem>
                        <SelectItem value="Spiritual">Spiritual Growth</SelectItem>
                        <SelectItem value="Runes">Runes</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="requires-positions">
                        Show Position Labels
                      </Label>
                      <p className="text-xs text-white/60">
                        Display position names/meanings during readings
                      </p>
                    </div>
                    <Switch
                      id="requires-positions"
                      checked={requiresPositions}
                      onCheckedChange={setRequiresPositions}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="is-public">Make Public</Label>
                      <p className="text-xs text-white/60">
                        Allow others to use this spread
                      </p>
                    </div>
                    <Switch
                      id="is-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-purple-300">
                      Position Details ({positions.length})
                    </h2>
                  </div>
                  {positions.length === 0 ? (
                    <div className="text-center py-8 text-white/60">
                      <p className="mb-2">No positions yet.</p>
                      <p className="text-sm">
                        Tap "Add Card" in the Canvas tab to start.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="space-y-3 max-h-[50vh] overflow-y-auto pr-2"
                      style={{ WebkitOverflowScrolling: "touch" }}
                    >
                      {positions.map((pos, idx) => (
                        <div
                          key={idx}
                          className="bg-black/30 rounded-lg p-4 space-y-3 border border-white/10"
                        >
                          <div className="flex items-center justify-between">
                            <Badge className="bg-purple-600/50">
                              Position {idx + 1}
                            </Badge>
                            <span className="text-xs text-white/60">
                              {Math.round(pos.x)}%, {Math.round(pos.y)}%,{" "}
                              {pos.rotation || 0}°
                            </span>
                          </div>
                          <div>
                            <Label className="text-xs">Position Name *</Label>
                            <Input
                              value={pos.name || ""}
                              onChange={(e) =>
                                updatePositionField(idx, "name", e.target.value)
                              }
                              placeholder="e.g., Past, Present, Future"
                              className="bg-black/50 border-white/20 text-white text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Meaning *</Label>
                            <Textarea
                              value={pos.meaning || ""}
                              onChange={(e) =>
                                updatePositionField(
                                  idx,
                                  "meaning",
                                  e.target.value
                                )
                              }
                              placeholder="What this position represents..."
                              className="bg-black/50 border-white/20 text-white text-sm min-h-[60px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-5 text-lg font-bold"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {isSaving
                    ? "Saving..."
                    : spreadId
                    ? "Update Spread"
                    : "Create Spread"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="controls">
              <div
                className="p-4 space-y-4 h-[calc(100vh-180px)] overflow-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-purple-300">
                    Controls
                  </h2>
                  <Button
                    onClick={() => setPreviewMode(!previewMode)}
                    variant="outline"
                    className={`border-cyan-500/40 ${
                      previewMode
                        ? "bg-cyan-600/20 text-cyan-300"
                        : "text-white"
                    }`}
                  >
                    {previewMode ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" /> Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" /> Show Preview
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" /> How to Use
                  </h3>
                  <ul className="text-xs text-cyan-200/80 space-y-1 list-disc pl-5">
                    <li>Drag the small handle on a card to move it</li>
                    <li>Tap a card to show the rotation toolbar</li>
                    <li>Use the slider/buttons to set angle (0–360°)</li>
                    <li>Use Preview to see the reading view</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Visual Designer */}
          <div className="space-y-4 order-2 lg:order-1">
            {previewMode ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-cyan-500/40 p-6">
                <div className="mb-4 text-center">
                  <h2 className="text-xl font-bold text-cyan-300 mb-2">
                    📱 Reading Preview
                  </h2>
                  <p className="text-sm text-cyan-200/80">
                    This is how your spread will look during actual readings
                  </p>
                </div>
                <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-black rounded-xl p-4 min-h-[500px] flex items-center justify-center w-full">
                  <InteractiveSpreadTester positions={positions} />
                </div>
                <div className="mt-4 text-xs text-cyan-200/60 text-center">
                  💡 Tip: Toggle back to designer view to adjust card positions
                  and angles
                </div>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-purple-300">
                    Visual Layout Designer
                  </h2>
                  <Button
                    onClick={addPosition}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Card
                  </Button>
                </div>

                <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mb-4">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    How to Use:
                  </h3>
                  <ul className="text-xs text-cyan-200/80 space-y-1">
                    <li>
                      • <strong>Long‑press on a card</strong> to drag on mobile
                    </li>
                    <li>
                      • <strong>Drag cards</strong> to position them
                    </li>
                    <li>
                      • <strong>Tap</strong> a card to select it
                    </li>
                    <li>
                      • <strong>Rotate with buttons or slider</strong> below the
                      selected card
                    </li>
                    <li>
                      • <strong>Snap to grid</strong> helps clean alignment
                    </li>
                    <li>• Edit names/meanings in the right panel</li>
                  </ul>
                </div>

                {positions.length > 0 ? (
                  <SpreadDesignCanvas
                    positions={positions}
                    onChange={setPositions}
                    showGrid={true}
                    aspectRatio={aspectRatio}
                  />
                ) : (
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center min-h-[400px] flex items-center justify-center">
                    <div>
                      <p className="text-white/60 mb-4">
                        Add positions to start designing your spread layout
                      </p>
                      <Button
                        onClick={addPosition}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Position
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-4 text-xs text-white/60 space-y-1">
                  <p>
                    • <strong>Drag:</strong> Move cards around the canvas (snaps
                    to grid)
                  </p>
                  <p>
                    • <strong>Tap:</strong> Select card to show rotation controls
                  </p>
                  <p>
                    • <strong>Rotate:</strong> Use buttons below selected card
                    (-15° / +15°)
                  </p>
                  <p>• Toggle preview to see how it looks in readings</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 order-1 lg:order-2">
            <AISpreadAssistant
              onApply={(s) => {
                try {
                  if (s?.spread_name) setSpreadName(s.spread_name);
                  if (s?.description) setSpreadDescription(s.description);
                  if (s?.category) setSpreadCategory(s.category);
                  if (Array.isArray(s?.positions)) {
                    const cleaned = s.positions.map((p, i) => ({
                      name: p.name || `Position ${i + 1}`,
                      meaning: p.meaning || "",
                      x:
                        typeof p.x === "number"
                          ? Math.max(0, Math.min(100, p.x))
                          : 50,
                      y:
                        typeof p.y === "number"
                          ? Math.max(0, Math.min(100, p.y))
                          : 50,
                      rotation:
                        typeof p.rotation === "number" ? p.rotation : 0,
                    }));
                    setPositions(cleaned);
                  }
                } catch (_) {}
              }}
            />

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
              <h2 className="text-xl font-bold text-purple-300">
                Spread Details
              </h2>
              <div>
                <Label htmlFor="spread-name">Spread Name *</Label>
                <Input
                  id="spread-name"
                  value={spreadName}
                  onChange={(e) => setSpreadName(e.target.value)}
                  placeholder="e.g., Celtic Cross, Three Card Spread"
                  className="bg-black/50 border-white/20 text-white"
                />
              </div>
              <div>
                <Label htmlFor="spread-description">Description</Label>
                <Textarea
                  id="spread-description"
                  value={spreadDescription}
                  onChange={(e) => setSpreadDescription(e.target.value)}
                  placeholder="Describe what this spread is for and how to use it..."
                  className="bg-black/50 border-white/20 text-white min-h-[80px]"
                />
              </div>
              <div>
                <Label htmlFor="spread-category">Category</Label>
                <Select
                  value={spreadCategory}
                  onValueChange={setSpreadCategory}
                >
                  <SelectTrigger
                    id="spread-category"
                    className="bg-black/50 border-white/20 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-white/20 text-white">
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Love">Love & Relationships</SelectItem>
                    <SelectItem value="Career">Career & Finance</SelectItem>
                    <SelectItem value="Spiritual">Spiritual Growth</SelectItem>
                    <SelectItem value="Runes">Runes</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="requires-positions">
                    Show Position Labels
                  </Label>
                  <p className="text-xs text-white/60">
                    Display position names/meanings during readings
                  </p>
                </div>
                <Switch
                  id="requires-positions"
                  checked={requiresPositions}
                  onCheckedChange={setRequiresPositions}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="is-public">Make Public</Label>
                  <p className="text-xs text-white/60">
                    Allow others to use this spread
                  </p>
                </div>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-purple-300">
                  Position Details ({positions.length})
                </h2>
              </div>
              {positions.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p className="mb-2">No positions yet.</p>
                  <p className="text-sm">
                    Click "Add Card" in the designer to start.
                  </p>
                </div>
              ) : (
                <div
                  className="space-y-3 max-h-[500px] overflow-y-auto pr-2"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {positions.map((pos, idx) => (
                    <div
                      key={idx}
                      className="bg-black/30 rounded-lg p-4 space-y-3 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-600/50">
                          Position {idx + 1}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/60">
                            {Math.round(pos.x)}%, {Math.round(pos.y)}%,{" "}
                            {pos.rotation || 0}°
                          </span>
                          <Button
                            onClick={() => removePosition(idx)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Position Name *</Label>
                        <Input
                          value={pos.name || ""}
                          onChange={(e) =>
                            updatePositionField(idx, "name", e.target.value)
                          }
                          placeholder="e.g., Past, Present, Future"
                          className="bg-black/50 border-white/20 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Meaning *</Label>
                        <Textarea
                          value={pos.meaning || ""}
                          onChange={(e) =>
                            updatePositionField(idx, "meaning", e.target.value)
                          }
                          placeholder="What this position represents..."
                          className="bg-black/50 border-white/20 text-white text-sm min-h-[60px]"
                        />
                        <div className="mt-3">
                          <Label className="text-xs">Rotation (0–360°)</Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={360}
                              step={1}
                              value={
                                typeof pos.rotation === "number"
                                  ? pos.rotation
                                  : 0
                              }
                              onChange={(e) =>
                                updatePositionField(
                                  idx,
                                  "rotation",
                                  parseInt(e.target.value, 10)
                                )
                              }
                              className="flex-1"
                            />
                            <span className="text-xs w-10 text-right">
                              {typeof pos.rotation === "number"
                                ? pos.rotation
                                : 0}
                              °
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white py-6 text-lg font-bold"
            >
              <Save className="w-5 h-5 mr-2" />
              {isSaving
                ? "Saving..."
                : spreadId
                ? "Update Spread"
                : "Create Spread"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}