import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateInvoiceDialog({ open, onOpenChange, clients, onSuccess }) {
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [formData, setFormData] = useState({
    client_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    payment_terms: 'תשלום תוך 30 יום'
  });

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax_rate = 17;
    const tax_amount = subtotal * (tax_rate / 100);
    const total_amount = subtotal + tax_amount;
    return { subtotal, tax_rate, tax_amount, total_amount };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { subtotal, tax_rate, tax_amount, total_amount } = calculateTotals();
    
    const invoiceNumber = `INV-${Date.now()}`;
    
    await base44.entities.Invoice.create({
      ...formData,
      invoice_number: invoiceNumber,
      items: items.filter(i => i.description),
      subtotal,
      tax_rate,
      tax_amount,
      total_amount,
      status: 'draft'
    });

    toast.success('חשבונית נוצרה בהצלחה');
    onSuccess();
    onOpenChange(false);
    setItems([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
    setFormData({
      client_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      payment_terms: 'תשלום תוך 30 יום'
    });
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>חשבונית חדשה</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>לקוח *</Label>
              <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="בחר לקוח" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>תאריך הנפקה *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>תאריך לתשלום *</Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>פריטים</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="rounded-xl">
                <Plus className="w-4 h-4 ml-1" />
                הוסף פריט
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  <Input
                    placeholder="תיאור"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="כמות"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    className="rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="מחיר"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={`₪${item.total.toFixed(2)}`}
                    disabled
                    className="rounded-xl bg-gray-50"
                  />
                </div>
                <div className="col-span-1">
                  {items.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">סכום ביניים:</span>
              <span className="font-medium">₪{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">מע"ם (17%):</span>
              <span className="font-medium">₪{totals.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>סה"כ:</span>
              <span>₪{totals.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>תנאי תשלום</Label>
            <Input
              value={formData.payment_terms}
              onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label>הערות</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="rounded-xl"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-black hover:bg-gray-800 rounded-xl">
            צור חשבונית
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}