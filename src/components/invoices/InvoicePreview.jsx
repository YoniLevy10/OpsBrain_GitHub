import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';

export default function InvoicePreview({ invoice, client, onClose }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h3 className="font-semibold">תצוגה מקדימה - חשבונית #{invoice.invoice_number}</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-xl">
              <Download className="w-4 h-4 ml-1" />
              הורד PDF
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-8 bg-white" style={{ direction: 'rtl' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">חשבונית מס</h1>
              <p className="text-gray-600">מספר: {invoice.invoice_number}</p>
              <p className="text-gray-600">תאריך: {new Date(invoice.issue_date).toLocaleDateString('he-IL')}</p>
            </div>
            <div className="text-left">
              <p className="font-bold text-lg">העסק שלי</p>
              <p className="text-gray-600">ע.מ: 123456789</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600 mb-1">לכבוד:</p>
            <p className="font-semibold text-lg">{client?.name}</p>
            {client?.company && <p className="text-gray-600">{client.company}</p>}
            {client?.email && <p className="text-gray-600">{client.email}</p>}
          </div>

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-right p-3 rounded-r-lg">תיאור</th>
                <th className="text-center p-3">כמות</th>
                <th className="text-center p-3">מחיר יחידה</th>
                <th className="text-left p-3 rounded-l-lg">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-3">{item.description}</td>
                  <td className="text-center p-3">{item.quantity}</td>
                  <td className="text-center p-3">₪{item.unit_price?.toFixed(2)}</td>
                  <td className="text-left p-3">₪{item.total?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">סכום ביניים:</span>
                <span className="font-medium">₪{invoice.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">מע"ם ({invoice.tax_rate}%):</span>
                <span className="font-medium">₪{invoice.tax_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 border-t-2 text-lg font-bold">
                <span>סה"כ לתשלום:</span>
                <span>₪{invoice.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div className="space-y-4">
            {invoice.payment_terms && (
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-semibold text-blue-900 mb-1">תנאי תשלום:</p>
                <p className="text-sm text-blue-800">{invoice.payment_terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900 mb-1">הערות:</p>
                <p className="text-sm text-gray-700">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
            <p>תודה על העסקה!</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}