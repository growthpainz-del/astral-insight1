import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Copy, Sparkles, Download } from "lucide-react";

export default function TemplateCard({ template, onCopy, onApplyPersona, onImportSpreads }) {
  const { name, description, category, tags = [], template_json = {}, author_name, is_public } = template || {};
  const hasPersona = !!template_json.persona;
  const hasSpreads = Array.isArray(template_json.spreads) && template_json.spreads.length > 0;

  return (
    <Card className="bg-black/30 border-white/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="text-white">{name}</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{category || "bundle"}</Badge>
            {is_public ? <Badge className="bg-emerald-600/30 text-emerald-200">Public</Badge> : null}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {description ? <p className="text-white/80 text-sm">{description}</p> : null}
        {tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((t, i) => (
              <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
        ) : null}
        {author_name ? <p className="text-xs text-white/60">By {author_name}</p> : null}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={onCopy} variant="outline" className="btn-dark-outline gap-2">
            <Copy className="w-4 h-4" /> Copy JSON
          </Button>
          {hasPersona && (
            <Button onClick={onApplyPersona} className="btn-dark-outline gap-2">
              <Sparkles className="w-4 h-4" /> Apply Persona
            </Button>
          )}
          {hasSpreads && (
            <Button onClick={onImportSpreads} className="btn-dark-outline gap-2">
              <Download className="w-4 h-4" /> Import Spreads
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}