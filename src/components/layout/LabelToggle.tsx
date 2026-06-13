import { Tag } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';

/** Toggle chart data labels on / off. */
export function LabelToggle() {
  const showLabels = useStore((s) => s.showLabels);
  const setShowLabels = useStore((s) => s.setShowLabels);
  const t = useT();

  const label = showLabels ? t.hideLabelsBtn : t.showLabelsBtn;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setShowLabels(!showLabels)}
      aria-label={label}
      title={label}
      className={`h-9 w-9 px-0 ${showLabels ? 'text-accent' : 'text-muted'}`}
    >
      <Tag className="h-4 w-4" />
    </Button>
  );
}
