import { Notification } from 'animal-island-ui';
import { errorText } from '@/lib/constants';

/** 操作失败时的提示：标题说哪件事没成，正文是具体原因（一般是后端给的文案） */
export const notifyError = (message: string, err: unknown) =>
  Notification.error({ message, description: errorText(err) });
