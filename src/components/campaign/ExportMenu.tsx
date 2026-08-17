import { Copy, Download, FileText, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  printPdf,
  toAsana,
  toJira,
  toMarkdown,
  type ExportPayload,
} from "@/lib/campaign/export";

type Props = {
  payload: ExportPayload;
  onSave: () => void;
};

export function ExportMenu({ payload, onSave }: Props) {
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard.`);
    } catch {
      toast.error("Clipboard unavailable in this browser.");
    }
  };

  return (
    <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-panel)]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <Copy className="mr-2 size-4" /> Export brief
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => copy(toMarkdown(payload), "Full brief markdown")}>
            <FileText className="mr-2 size-4" /> Copy Full Brief as Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(toJira(payload), "Jira format")}>
            <Copy className="mr-2 size-4" /> Copy Jira-Friendly Format
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => copy(toAsana(payload), "Asana format")}>
            <Copy className="mr-2 size-4" /> Copy Asana-Friendly Format
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (!printPdf(payload)) toast.error("Allow pop-ups to generate the PDF.");
            }}
          >
            <Download className="mr-2 size-4" /> Download PDF Brief
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={onSave}>
        <Save className="mr-2 size-4" /> Save Campaign
      </Button>
      <p className="text-xs text-muted-foreground">
        Everything stays in this browser — no account needed.
      </p>
    </section>
  );
}
