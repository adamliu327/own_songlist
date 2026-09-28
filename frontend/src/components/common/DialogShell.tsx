import type { ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface DialogShellProps extends Omit<ComponentProps<typeof DialogContent>, 'title'> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: LucideIcon;
  /** 固定在底部、不随内容滚动的操作栏 */
  footer?: ReactNode;
  bodyClassName?: string;
}

/** 所有弹窗共用的外壳：渐变标题区 + 可滚动内容 + 可选底栏 */
export function DialogShell({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  footer,
  className,
  bodyClassName,
  children,
  ...contentProps
}: DialogShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} {...contentProps}>
        <header className="shrink-0 bg-gradient-to-r from-mint/15 via-pink/20 to-peach/15 px-6 pt-4 pr-14 pb-4 sm:pt-6 dark:from-mint/10 dark:via-pink/5 dark:to-peach/10">
          <DialogTitle className="flex items-center gap-2.5 font-display text-xl font-bold text-fg sm:text-2xl">
            {Icon && (
              <span className="flex size-9 items-center justify-center rounded-xl bg-surface/80 shadow-sm">
                <Icon className="size-5 text-mint-600" />
              </span>
            )}
            {title}
          </DialogTitle>
          {description ? (
            <DialogDescription className="mt-1.5 leading-relaxed">{description}</DialogDescription>
          ) : (
            <DialogDescription className="sr-only">{title}</DialogDescription>
          )}
        </header>

        <div className={cn('min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6', bodyClassName)}>
          {children}
        </div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-line px-6 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}
