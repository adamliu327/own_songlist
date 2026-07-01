import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/authStore';

interface UnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnlockDialog({ open, onOpenChange }: UnlockDialogProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const unlock = useAuthStore((s) => s.unlock);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(password)) {
      setPassword('');
      setError(false);
      onOpenChange(false);
    } else {
      setError(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-2xl font-bold text-ink">输入密码</DialogTitle>
            <DialogDescription className="text-ink-muted">
              解锁后可添加、编辑歌曲和修改设置。
            </DialogDescription>
          </DialogHeader>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-4">
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="密码"
            className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
          />
          {error && (
            <p className="text-xs text-peach-600">密码错误</p>
          )}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-pink/50"
            >
              取消
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-mint font-bold text-ink hover:bg-mint/90"
            >
              解锁
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
