import { Copy, FolderOpen, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/brief";
import type { SavedCampaign } from "@/lib/campaign/types";

type Props = {
  campaigns: SavedCampaign[];
  activeId: string | null;
  onLoad: (c: SavedCampaign) => void;
  onRename: (c: SavedCampaign) => void;
  onDuplicate: (c: SavedCampaign) => void;
  onDelete: (c: SavedCampaign) => void;
};

export function SavedCampaigns({
  campaigns,
  activeId,
  onLoad,
  onRename,
  onDuplicate,
  onDelete,
}: Props) {
  return (
    <div className="mt-6 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Saved Campaigns
      </p>
      {campaigns.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          No saved campaigns yet. Generate a brief and choose Save Campaign.
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className={`rounded-lg border px-3 py-2 ${
                activeId === c.id ? "border-primary bg-primary/5" : "border-border bg-secondary/60"
              }`}
            >
              <div className="min-w-0">
                <span className="block truncate text-sm font-medium">{c.label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {c.config.weeks} weeks · {formatCurrency(c.config.budget)} ·{" "}
                  {new Date(c.savedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onLoad(c)}>
                  <FolderOpen className="mr-1 size-3" /> Load
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onRename(c)}
                  aria-label={`Rename ${c.label}`}
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onDuplicate(c)}
                  aria-label={`Duplicate ${c.label}`}
                >
                  <Copy className="size-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => onDelete(c)}
                  aria-label={`Delete ${c.label}`}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
