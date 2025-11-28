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
import { Label } from '@/components/ui/label';
import { useWallet } from '@/hooks/useWallet';
import { useNWC } from '@/hooks/useNWCContext';
import { useToast } from '@/hooks/useToast';
import { Gift, Zap, ExternalLink, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

const LIGHTNING_ADDRESS = 'sethd@getalby.com';

// Convert lightning address to LNURL
function lightningAddressToLnurl(lightningAddress: string): string {
  const [name, domain] = lightningAddress.split('@');
  return `https://${domain}/.well-known/lnurlp/${name}`;
}

// Fetch invoice from LNURL
async function fetchInvoice(lightningAddress: string, amount: number, comment?: string): Promise<string> {
  const lnurl = lightningAddressToLnurl(lightningAddress);

  // Step 1: Fetch LNURL endpoint
  const response = await fetch(lnurl);
  if (!response.ok) {
    throw new Error('Failed to fetch LNURL endpoint');
  }

  const data = await response.json();

  if (data.status === 'ERROR') {
    throw new Error(data.reason || 'LNURL error');
  }

  // Step 2: Request invoice
  const callbackUrl = data.callback;
  const amountMillisats = amount * 1000;

  const invoiceUrl = new URL(callbackUrl);
  invoiceUrl.searchParams.set('amount', amountMillisats.toString());
  if (comment) {
    invoiceUrl.searchParams.set('comment', comment);
  }

  const invoiceResponse = await fetch(invoiceUrl.toString());
  if (!invoiceResponse.ok) {
    throw new Error('Failed to fetch invoice');
  }

  const invoiceData = await invoiceResponse.json();

  if (invoiceData.status === 'ERROR') {
    throw new Error(invoiceData.reason || 'Failed to generate invoice');
  }

  return invoiceData.pr; // pr = payment request (invoice)
}

export function ChristmasGiftButton() {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [comment, setComment] = useState('🎄 Christmas Gift');
  const [invoice, setInvoice] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();
  const { webln, activeNWC } = useWallet();
  const { sendPayment } = useNWC();

  const handleOpen = () => {
    setOpen(true);
    setInvoice(null);
    setQrCodeUrl('');
    setAmount(100);
    setComment('🎄 Christmas Gift');
  };

  const handleGenerateInvoice = async () => {
    if (amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount in sats',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const paymentRequest = await fetchInvoice(LIGHTNING_ADDRESS, amount, comment);
      setInvoice(paymentRequest);

      // Generate QR code
      const qr = await QRCode.toDataURL(paymentRequest.toUpperCase(), {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeUrl(qr);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate invoice',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!invoice) {
      await handleGenerateInvoice();
      return;
    }

    setIsPaying(true);
    try {
      // Try WebLN first
      if (webln) {
        await webln.sendPayment(invoice);
        toast({
          title: 'Payment sent! 🎉',
          description: `Sent ${amount} sats to ${LIGHTNING_ADDRESS}`,
        });
        setOpen(false);
        setInvoice(null);
        setQrCodeUrl('');
        return;
      }

      // Try NWC
      if (activeNWC) {
        await sendPayment(activeNWC, invoice);
        toast({
          title: 'Payment sent! 🎉',
          description: `Sent ${amount} sats to ${LIGHTNING_ADDRESS}`,
        });
        setOpen(false);
        setInvoice(null);
        setQrCodeUrl('');
        return;
      }

      // No wallet available
      toast({
        title: 'No wallet found',
        description: 'Please install a WebLN wallet or connect NWC',
        variant: 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Failed to send payment',
        variant: 'destructive',
      });
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopy = async () => {
    if (invoice) {
      await navigator.clipboard.writeText(invoice);
      setCopied(true);
      toast({
        title: 'Invoice copied',
        description: 'Lightning invoice copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenInWallet = () => {
    if (invoice) {
      const lightningUrl = `lightning:${invoice}`;
      window.open(lightningUrl, '_blank');
    }
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white border-0 shadow-lg whitespace-nowrap text-sm sm:text-base px-3 sm:px-4"
      >
        <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
        <span className="hidden xs:inline">🎁 Christmas Gift</span>
        <span className="xs:hidden">🎁 Gift</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-red-500" />
              Send a Christmas Gift
            </DialogTitle>
            <DialogDescription>
              Send a lightning payment to {LIGHTNING_ADDRESS}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!invoice ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (sats)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value, 10) || 0)}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Input
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="🎄 Christmas Gift"
                  />
                </div>

                <Button
                  onClick={handleGenerateInvoice}
                  disabled={isLoading || amount <= 0}
                  className="w-full"
                >
                  {isLoading ? 'Generating...' : 'Generate Invoice'}
                </Button>
              </>
            ) : (
              <>
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <img src={qrCodeUrl} alt="Invoice QR Code" className="w-48 h-48" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Lightning Invoice</Label>
                  <div className="flex gap-2">
                    <Input
                      value={invoice}
                      readOnly
                      className="font-mono text-xs"
                      onClick={(e) => e.currentTarget.select()}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {(webln || activeNWC) && (
                    <Button
                      onClick={handlePay}
                      disabled={isPaying}
                      className="w-full"
                      size="lg"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {isPaying ? 'Processing...' : 'Pay with Wallet'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleOpenInWallet}
                    className="w-full"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Lightning Wallet
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

