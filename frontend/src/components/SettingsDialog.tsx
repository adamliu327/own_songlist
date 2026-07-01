import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useConfigStore } from '@/stores/configStore';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { config, updateConfig, resetConfig } = useConfigStore();
  const [playlistName, setPlaylistName] = useState(config.playlistName);
  const [template, setTemplate] = useState(config.danmakuTemplate);
  const [theme, setTheme] = useState(config.theme);

  useEffect(() => {
    setPlaylistName(config.playlistName);
    setTemplate(config.danmakuTemplate);
    setTheme(config.theme);
  }, [config, open]);

  const handleSave = () => {
    updateConfig({
      playlistName: playlistName.trim() || '我的点歌单',
      danmakuTemplate: template,
      theme: theme as 'light' | 'dark' | 'system',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="bg-gradient-to-r from-mint/10 via-pink/10 to-peach/10 p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-2xl font-bold text-ink">设置</DialogTitle>
            <DialogDescription className="text-ink-muted">
              配置歌单名称、点歌弹幕模板与外观。
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 p-6 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="playlist-name" className="text-ink">歌单名称</Label>
            <Input
              id="playlist-name"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="我的点歌单"
              className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="template" className="text-ink">点歌弹幕模板</Label>
            <Input
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="点歌 {name}"
              className="rounded-xl border-pink/50 bg-pink-light/30 focus:border-mint focus:ring-mint"
            />
            <p className="text-xs text-ink-muted">
              可用占位符：{'{name}'}, {'{singer}'}, {'{language}'}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="theme" className="text-ink">主题</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as 'light' | 'dark' | 'system')}>
              <SelectTrigger id="theme" className="rounded-xl border-pink/50 bg-pink-light/30 focus:ring-mint">
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="light">浅色</SelectItem>
                <SelectItem value="dark">深色</SelectItem>
                <SelectItem value="system">跟随系统</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={resetConfig}
              className="rounded-xl border-pink/50 text-ink-muted hover:text-ink"
            >
              重置
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl border-pink/50"
              >
                取消
              </Button>
              <Button
                onClick={handleSave}
                className="rounded-xl bg-mint font-bold text-ink hover:bg-mint/90"
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
