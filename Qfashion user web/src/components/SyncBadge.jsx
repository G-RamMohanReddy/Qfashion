/**
 * A quiet line under the grid saying where orders are being saved. Worth having
 * in the product rather than only in devtools: after a deploy it is the fastest
 * way to tell whether the Firebase environment variables actually reached the
 * build, and it tells a shopper their order is recorded.
 */

import { Cloud, CloudOff, HardDrive } from 'lucide-react';
import { useCloudStatus } from '@/hooks/useSync.js';

export default function SyncBadge() {
  const { configured, connected, error } = useCloudStatus();

  const [Icon, text] = !configured
    ? [HardDrive, 'Orders are saved on this device']
    : connected
      ? [Cloud, 'Orders sync to your Q Fashion account']
      : [CloudOff, error ? 'Saved on this device — cloud sync unavailable' : 'Connecting to cloud sync…'];

  return (
    <p className="mt-6 flex items-center justify-center gap-1.5 text-2xs text-muted">
      <Icon size={12} strokeWidth={2.2} />
      {text}
    </p>
  );
}
