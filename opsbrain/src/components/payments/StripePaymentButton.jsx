import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import { opsbrain } from '@/api/client';
import { toast } from 'sonner';

export default function StripePaymentButton({ invoice, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const generatePaymentLink = async () => {
    setLoading(true);
    try {
      // יצירת קישור תשלום Stripe
      const paymentLink = `https://buy.stripe.com/demo-${invoice.id}`;
      
      // שמירת Payment record
      await opsbrain.entities.Payment.create({
        invoice_id: invoice.id,
        client_id: invoice.client_id,
        amount: invoice.total_amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'stripe',
        status: 'pending',
        payment_link: paymentLink
      });

      // פתיחת הקישור
      window.open(paymentLink, '_blank');
      
      toast.success('קישור תשלום נוצר בהצלחה');
      onSuccess?.();
    } catch (error) {
      toast.error('שגיאה ביצירת קישור תשלום');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={generatePaymentLink}
      disabled={loading || invoice.status === 'paid'}
      className="bg-indigo-600 hover:bg-indigo-700"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          יוצר קישור...
        </>
      ) : (
        <>
          <CreditCard className="w-4 h-4 ml-2" />
          שלח ותגבה דרך Stripe
        </>
      )}
    </Button>
  );
}