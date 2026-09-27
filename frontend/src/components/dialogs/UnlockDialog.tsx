import { useState } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DialogShell } from '@/components/common/DialogShell';
import { useDialog } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

export function UnlockDialog() {
  const { open, onOpenChange } = useDialog('unlock');

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="解锁编辑"
      description="解锁后可以添加、编辑歌曲和修改设置。"
      icon={KeyRound}
      className="sm:max-w-sm"
    >
      <UnlockForm onDone={() => onOpenChange(false)} />
    </DialogShell>
  );
}

function UnlockForm({ onDone }: { onDone: () => void }) {
  const unlock = useAuthStore((s) => s.unlock);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const shake = useAnimationControls();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlock(password)) {
      onDone();
      return;
    }
    setError(true);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.35 } });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <motion.div animate={shake}>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="输入密码"
          autoFocus
          aria-invalid={error}
          className="aria-invalid:border-peach aria-invalid:ring-peach/25"
        />
      </motion.div>
      <p className="h-4 text-xs text-peach-600">{error && '密码不对，再试一次'}</p>
      <Button type="submit" size="lg" className="w-full" disabled={!password}>
        解锁
      </Button>
    </form>
  );
}
