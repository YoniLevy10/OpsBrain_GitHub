import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceTemplate({ invoice, client, business }) {
  const invoiceRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    const canvas = await html2canvas(invoiceRef.current, {
      scale: 2,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save(`invoice-${invoice.invoice_number}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4 print:hidden">
        <Button onClick={handleDownloadPDF} variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 ml-1" />
          הורד PDF
        </Button>
        <Button onClick={handlePrint} variant="outline" className="rounded-xl">
          <Printer className="w-4 h-4 ml-1" />
          הדפס
        </Button>
      </div>

      <Card ref={invoiceRef} className="border-2 border-gray-900 shadow-none bg-white">
        <CardContent className="p-12">
          {/* Header */}
          <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-gray-900">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-2">חשבונית</h1>
              <p className="text-xl text-gray-600">#{invoice.invoice_number}</p>
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{business?.business_name || 'החברה שלי'}</h2>
              <p className="text-gray-600">{business?.owner_name}</p>
              <p className="text-gray-600">{business?.industry}</p>
            </div>
          </div>

          {/* Client & Dates */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <p className="text-sm font-semibold text-gray-500 mb-2">לכבוד:</p>
              <p className="text-xl font-bold text-gray-900">{client?.name}</p>
              {client?.company && <p className="text-gray-600">{client.company}</p>}
              {client?.email && <p className="text-gray-600">{client.email}</p>}
              {client?.phone && <p className="text-gray-600">{client.phone}</p>}
            </div>
            <div className="text-left">
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">תאריך הנפקה: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(invoice.issue_date).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">תאריך לתשלום: </span>
                  <span className="font-medium text-gray-900">
                    {new Date(invoice.due_date).toLocaleDateString('he-IL')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-12">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-right py-3 text-sm font-semibold text-gray-900">תיאור</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-900">כמות</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-900">מחיר יחידה</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-900">סה"כ</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="py-4 text-gray-900">{item.description}</td>
                    <td className="py-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-4 text-center text-gray-900">₪{item.unit_price.toLocaleString()}</td>
                    <td className="py-4 text-left font-medium text-gray-900">₪{item.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-80 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">סכום ביניים:</span>
                <span className="font-medium text-gray-900">₪{invoice.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">מע"ם ({invoice.tax_rate}%):</span>
                <span className="font-medium text-gray-900">₪{invoice.tax_amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-4 border-t-2 border-gray-900">
                <span className="text-xl font-bold text-gray-900">סה"כ לתשלום:</span>
                <span className="text-3xl font-bold text-gray-900">₪{invoice.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Notes & Payment Terms */}
          <div className="space-y-6 pt-8 border-t border-gray-200">
            {invoice.payment_terms && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">תנאי תשלום:</p>
                <p className="text-gray-600">{invoice.payment_terms}</p>
              </div>
            )}
            {invoice.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">הערות:</p>
                <p className="text-gray-600">{invoice.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>תודה על עסקיך! לשאלות ניתן לפנות במייל או בטלפון.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}