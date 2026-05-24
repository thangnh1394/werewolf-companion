import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check } from 'lucide-react';
import { buildShareUrl } from '../../lib/format';

interface ShareRoomProps {
  code: string;
  /** Whether to show "CHIA SẺ PHÒNG" (host) or "MỜI BẠN BÈ" (player) label */
  isHost: boolean;
}

export function ShareRoom({ code, isHost }: ShareRoomProps) {
  const url = buildShareUrl(code);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="bg-bg-surface border border-bg-surface-hi rounded-[14px] p-3 flex items-center gap-3">
      <div className="w-[52px] h-[52px] bg-text-primary rounded-[8px] p-1 flex items-center justify-center shrink-0">
        <QRCodeSVG
          value={url}
          size={44}
          bgColor="#F5EFE0"
          fgColor="#1F2419"
          level="L"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-accent text-[11px] font-medium mb-1">
          {isHost ? 'CHIA SẺ PHÒNG' : 'MỜI BẠN BÈ'}
        </div>
        <div className="text-text-primary text-[13px] leading-snug break-all">{url}</div>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy link phòng"
        className="bg-transparent border border-bg-surface-hi rounded-[8px] p-2 text-accent shrink-0 active:scale-95"
      >
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      </button>
    </div>
  );
}
