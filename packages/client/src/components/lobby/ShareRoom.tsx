import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X } from 'lucide-react';
import { buildShareUrl } from '../../lib/format';
import { Dialog } from '../ui/Dialog';

interface ShareRoomProps {
  code: string;
  /** Whether to show "CHIA SẺ PHÒNG" (host) or "MỜI BẠN BÈ" (player) label */
  isHost: boolean;
}

export function ShareRoom({ code, isHost }: ShareRoomProps) {
  const url = buildShareUrl(code);
  const [copied, setCopied] = useState(false);
  const [qrExpanded, setQrExpanded] = useState(false);

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
    <>
      <div className="bg-bg-surface border border-bg-surface-hi rounded-[14px] p-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setQrExpanded(true)}
          aria-label="Phóng to mã QR để quét"
          className="w-[52px] h-[52px] bg-text-primary rounded-[8px] p-1 flex items-center justify-center shrink-0 active:scale-95 border-0"
        >
          <QRCodeSVG
            value={url}
            size={44}
            bgColor="#F5EFE0"
            fgColor="#1F2419"
            level="L"
          />
        </button>
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

      {/* QR expand dialog — large for physical scanning */}
      <Dialog
        open={qrExpanded}
        onClose={() => setQrExpanded(false)}
        ariaLabel="Mã QR phòng phóng to"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary text-base font-medium m-0">Quét để vào phòng</h2>
          <button
            type="button"
            onClick={() => setQrExpanded(false)}
            aria-label="Đóng"
            className="bg-transparent border-none p-1 text-text-secondary active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Big QR — sized by viewport so it scales on all phones */}
        <div className="bg-text-primary rounded-[14px] p-4 flex items-center justify-center mb-3">
          <QRCodeSVG
            value={url}
            size={260}
            bgColor="#F5EFE0"
            fgColor="#1F2419"
            level="M"
            style={{
              width: 'min(70vw, 320px)',
              height: 'auto',
            }}
          />
        </div>

        <div className="text-center mb-2">
          <div className="text-text-secondary text-[11px] mb-1">MÃ PHÒNG</div>
          <div className="text-text-primary text-2xl font-medium tracking-[0.3em]">
            {code.slice(0, 3)} {code.slice(3)}
          </div>
        </div>

        <div className="text-text-secondary text-[11px] text-center italic">
          Để người chơi khác quét bằng camera điện thoại
        </div>
      </Dialog>
    </>
  );
}
