import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Printer, Download, FileText, Building, Phone, Mail, MapPin, Globe, User } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import { useShop } from '@/hooks/useShop';

export function GSTInvoice({ open, onClose, sale, shopDetails }) {
  const invoiceRef = useRef(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const { shop: fetchedShop } = useShop();

  // Default shop details (use fetched shop if available, otherwise placeholders)
  const defaultShopDetails = fetchedShop ? {
    name: fetchedShop.name,
    address: fetchedShop.address || "Address not available",
    city: fetchedShop.city || "-",
    state: fetchedShop.state || "-",
    pincode: fetchedShop.pincode || "-",
    phone: fetchedShop.mobile || "-",
    email: fetchedShop.email || "-",
    gstin: fetchedShop.gstin || "-",
    stateCode: fetchedShop.stateCode || "-"
  } : {
    name: "IntelliMart Store", // Fallback name
    address: "Please configure shop details",
    city: "-",
    state: "-",
    pincode: "-",
    phone: "-",
    email: "-",
    gstin: "-",
    stateCode: "-"
  };

  const shop = shopDetails || defaultShopDetails;
  
  // DRIVER: Derive the actual tax rate from the billed data to ensure summary matches table
  const derivedRate = sale?.taxRate ? Number(sale.taxRate) : 
                     (sale?.items?.[0]?.taxRate ? Number(sale.items[0].taxRate) : 
                     (sale?.totalAmount > sale?.subTotal ? Math.round(((sale.totalAmount - sale.subTotal) / sale.subTotal) * 100) : 18));
  
  const currentTaxRate = derivedRate;

  // GST calculation helper
  const calculateGST = (amount, ratePercent = currentTaxRate) => {
    const rate = ratePercent / 100;
    const cgst = amount * rate / 2;
    const sgst = amount * rate / 2;
    return { cgst, sgst, total: cgst + sgst };
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${sale.billNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
            .invoice { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .shop-details { margin-bottom: 20px; }
            .billing-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .items-table th { background-color: #f5f5f5; font-weight: bold; }
            .totals { text-align: right; margin-bottom: 20px; }
            .gst-summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            @media print { body { padding: 10px; } }
          </style>
        </head>
        <body>
          <div class="invoice">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      // ─── COLOR PALETTE ────────────────────────────────────────────────────
      const PRIMARY   = [26,  54,  93];   // Deep navy
      const ACCENT    = [212, 160,  23];   // Gold
      const LIGHT_BG  = [245, 247, 250];   // Light grey
      const MED_GREY  = [107, 114, 128];   // Medium grey
      const BORDER    = [209, 213, 219];   // Border grey
      const WHITE     = [255, 255, 255];
      const TEXT_DARK = [17,  24,  39];
      const TEXT_MED  = [55,  65,  81];
      const ALT_ROW   = [249, 250, 251];

      // ─── HEADER BAND ──────────────────────────────────────────────────────
      pdf.setFillColor(...PRIMARY);
      pdf.rect(0, 0, pageWidth, 38, 'F');

      // Gold accent bar
      pdf.setFillColor(...ACCENT);
      pdf.rect(0, 38, pageWidth, 2, 'F');

      // Shop name (white, large)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(20);
      pdf.setTextColor(...WHITE);
      pdf.text(shop.name.toUpperCase(), margin, 16);

      // "TAX INVOICE" label on right
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...ACCENT);
      pdf.text('TAX INVOICE', pageWidth - margin, 16, { align: 'right' });

      // GST number under shop name
      pdf.setFontSize(8.5);
      pdf.setTextColor(180, 200, 230);
      pdf.text(`GSTIN: ${shop.gstin}`, margin, 24);

      // Address line
      const addrLine = [shop.address, shop.city, shop.state].filter(v => v && v !== '-').join(', ');
      pdf.text(addrLine, margin, 30);
      pdf.text(`Ph: ${shop.phone}`, margin, 35.5);

      let y = 48; // below header band + accent line

      // ─── INVOICE META BOX ─────────────────────────────────────────────────
      // Left: Billed To  |  Right: Invoice Details
      const colMid = pageWidth / 2 - 2;

      // Left column label
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...MED_GREY);
      pdf.text('BILLED TO', margin, y + 5);

      // Right column label
      pdf.text('INVOICE DETAILS', colMid + 6, y + 5);

      y += 8;
      const boxTop = y;
      const boxH = 42;

      // Draw two side-by-side boxes
      pdf.setDrawColor(...BORDER);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(...LIGHT_BG);
      pdf.roundedRect(margin, boxTop, colMid - margin - 2, boxH, 2, 2, 'FD');
      pdf.roundedRect(colMid + 4, boxTop, pageWidth - colMid - 4 - margin, boxH, 2, 2, 'FD');

      // ── Billed To (left box) ──
      let lx = margin + 5;
      let ly = boxTop + 8;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...TEXT_DARK);
      pdf.text(sale.customerName || 'Walk-in Customer', lx, ly);
      ly += 5.5;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT_MED);
      if (sale.customerFirm) { pdf.text(sale.customerFirm, lx, ly); ly += 5; }
      if (sale.customerMobile) { pdf.text(`Mobile: ${sale.customerMobile}`, lx, ly); ly += 5; }
      const custGstin = sale.customerGstin || sale.customer_gstin;
      if (custGstin) {
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(`GSTIN: ${custGstin}`, lx, ly);
      }

      // ── Invoice Details (right box) ──
      let rx = colMid + 10;
      let ry = boxTop + 7;
      const labelW = 28;

      const metaRow = (label, value) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(...MED_GREY);
        pdf.text(label, rx, ry);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(String(value), rx + labelW, ry);
        ry += 5.5;
      };

      metaRow('Invoice No:', `#${sale.billNumber}`);
      metaRow('Date:', format(new Date(sale.createdAt || new Date()), 'dd MMM yyyy'));
      metaRow('Payment:', (sale.paymentMode || 'CASH').replace('_', ' '));
      metaRow('Items:', String(sale.items?.length || 0));

      y = boxTop + boxH + 8;

      // ─── ITEMS TABLE ──────────────────────────────────────────────────────
      const subtotalVal = Number(sale.subTotal || (Number(sale.totalAmount) - Number(sale.taxAmount)));
      const taxAmountVal = Number(sale.taxAmount);
      const totalVal     = Number(sale.totalAmount);

      const tableRows = (sale.items || []).map((item, idx) => {
        const productName = item.product?.name || item.name || item.product_name || 'Unknown Product';
        const unitPrice   = Number(item.price || item.unit_price || 0);
        const qty         = Number(item.quantity || 0);
        const amount      = unitPrice * qty;
        const itemTaxRate = Number(item.taxRate || currentTaxRate);
        const gst         = calculateGST(amount, itemTaxRate);

        return {
          no:      String(idx + 1),
          name:    productName,
          hsn:     item.hsnCode || item.hsn || '-',
          qty:     String(qty),
          rate:    unitPrice.toFixed(2),
          amount:  amount.toFixed(2),
          taxRate: `${itemTaxRate}%`,
          cgst:    gst.cgst.toFixed(2),
          sgst:    gst.sgst.toFixed(2),
          total:   (amount + gst.total).toFixed(2),
        };
      });

      // Column definitions
      const cols = [
        { header: '#',       key: 'no',      w: 8,  align: 'center' },
        { header: 'Item',    key: 'name',    w: 52, align: 'left'   },
        { header: 'HSN',     key: 'hsn',     w: 16, align: 'center' },
        { header: 'Qty',     key: 'qty',     w: 12, align: 'center' },
        { header: 'Rate',    key: 'rate',    w: 18, align: 'right'  },
        { header: 'CGST',    key: 'cgst',    w: 16, align: 'right'  },
        { header: 'SGST',    key: 'sgst',    w: 16, align: 'right'  },
        { header: 'Total',   key: 'total',   w: 24, align: 'right'  },
      ];

      // Draw table header
      const tableHeaderH = 8;
      pdf.setFillColor(...PRIMARY);
      pdf.rect(margin, y, contentWidth, tableHeaderH, 'F');

      let cx = margin;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...WHITE);
      cols.forEach(col => {
        const tx = col.align === 'right'  ? cx + col.w - 2
                 : col.align === 'center' ? cx + col.w / 2
                 : cx + 2;
        pdf.text(col.header, tx, y + 5.5, { align: col.align === 'left' ? 'left' : col.align });
        cx += col.w;
      });

      y += tableHeaderH;

      // Draw table rows
      const rowH = 7.5;
      pdf.setFontSize(8);
      tableRows.forEach((row, i) => {
        // Alternating row bg
        if (i % 2 === 0) {
          pdf.setFillColor(...ALT_ROW);
          pdf.rect(margin, y, contentWidth, rowH, 'F');
        }

        // Row border
        pdf.setDrawColor(...BORDER);
        pdf.setLineWidth(0.2);
        pdf.line(margin, y + rowH, margin + contentWidth, y + rowH);

        let cx2 = margin;
        cols.forEach(col => {
          let val = row[col.key] || '';
          // Prepend ₹ for money cols
          if (['rate','cgst','sgst','total','amount'].includes(col.key)) val = 'Rs.' + val;

          pdf.setFont('helvetica', col.key === 'total' ? 'bold' : 'normal');
          pdf.setTextColor(...TEXT_DARK);

          const tx2 = col.align === 'right'  ? cx2 + col.w - 2
                    : col.align === 'center' ? cx2 + col.w / 2
                    : cx2 + 2;

          // Clip long item names
          if (col.key === 'name' && val.length > 28) val = val.substring(0, 25) + '...';

          pdf.text(val, tx2, y + 5, { align: col.align === 'left' ? 'left' : col.align });
          cx2 += col.w;
        });

        y += rowH;
      });

      // Table outer border
      pdf.setDrawColor(...PRIMARY);
      pdf.setLineWidth(0.4);
      pdf.rect(margin, y - tableRows.length * rowH - tableHeaderH, contentWidth, tableHeaderH + tableRows.length * rowH, 'S');

      y += 6;

      // ─── TOTALS + GST SUMMARY ─────────────────────────────────────────────
      const summaryColX = pageWidth - margin - 72;
      const summaryW    = 72;

      // GST Summary box (left)
      const gstBoxX = margin;
      const gstBoxW = summaryColX - margin - 6;
      const gstBoxY = y;

      pdf.setFillColor(...LIGHT_BG);
      pdf.setDrawColor(...BORDER);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(gstBoxX, gstBoxY, gstBoxW, 36, 2, 2, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...PRIMARY);
      pdf.text('GST SUMMARY', gstBoxX + 5, gstBoxY + 7);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT_MED);

      const gstRate = currentTaxRate;
      pdf.text(`CGST @ ${gstRate / 2}%`, gstBoxX + 5, gstBoxY + 15);
      pdf.text(`SGST @ ${gstRate / 2}%`, gstBoxX + 5, gstBoxY + 22);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...TEXT_DARK);
      pdf.text('Total GST', gstBoxX + 5, gstBoxY + 29);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...TEXT_MED);
      pdf.text(`Rs.${(taxAmountVal / 2).toFixed(2)}`, gstBoxX + gstBoxW - 5, gstBoxY + 15, { align: 'right' });
      pdf.text(`Rs.${(taxAmountVal / 2).toFixed(2)}`, gstBoxX + gstBoxW - 5, gstBoxY + 22, { align: 'right' });
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...TEXT_DARK);
      pdf.text(`Rs.${taxAmountVal.toFixed(2)}`, gstBoxX + gstBoxW - 5, gstBoxY + 29, { align: 'right' });

      // Totals box (right)
      const totalsX = summaryColX;
      const totalsY = y;

      pdf.setFillColor(...LIGHT_BG);
      pdf.roundedRect(totalsX, totalsY, summaryW, 36, 2, 2, 'FD');

      const drawTotalRow = (label, value, bold = false, ry2) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.setFontSize(bold ? 9 : 8.5);
        pdf.setTextColor(bold ? TEXT_DARK[0] : TEXT_MED[0], bold ? TEXT_DARK[1] : TEXT_MED[1], bold ? TEXT_DARK[2] : TEXT_MED[2]);
        pdf.text(label, totalsX + 5, ry2);
        pdf.text(value, totalsX + summaryW - 5, ry2, { align: 'right' });
      };

      drawTotalRow('Subtotal',  `Rs.${subtotalVal.toFixed(2)}`,  false, totalsY + 10);
      drawTotalRow(`GST (${gstRate}%)`, `Rs.${taxAmountVal.toFixed(2)}`, false, totalsY + 18);

      // Divider inside totals box
      pdf.setDrawColor(...BORDER);
      pdf.line(totalsX + 4, totalsY + 22, totalsX + summaryW - 4, totalsY + 22);

      // Grand Total row – highlighted
      pdf.setFillColor(...PRIMARY);
      pdf.roundedRect(totalsX, totalsY + 23, summaryW, 13, 2, 2, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...WHITE);
      pdf.text('GRAND TOTAL', totalsX + 5, totalsY + 31.5);
      pdf.text(`Rs.${totalVal.toFixed(2)}`, totalsX + summaryW - 5, totalsY + 31.5, { align: 'right' });

      y = gstBoxY + 36 + 8;

      // ─── TERMS & FOOTER ───────────────────────────────────────────────────
      const footerBandY = pageHeight - 22;

      // Thin gold divider
      pdf.setFillColor(...ACCENT);
      pdf.rect(0, footerBandY - 2, pageWidth, 1, 'F');

      // Footer band
      pdf.setFillColor(...PRIMARY);
      pdf.rect(0, footerBandY, pageWidth, 22, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...WHITE);
      pdf.text('Thank you for your business!', pageWidth / 2, footerBandY + 8, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(180, 200, 230);
      pdf.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerBandY + 14.5, { align: 'center' });

      // ─── WATERMARK BORDER ─────────────────────────────────────────────────
      pdf.setDrawColor(...PRIMARY);
      pdf.setLineWidth(1);
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10, 'S');
      pdf.setDrawColor(...ACCENT);
      pdf.setLineWidth(0.4);
      pdf.rect(6.5, 6.5, pageWidth - 13, pageHeight - 13, 'S');

      // ─── SAVE ─────────────────────────────────────────────────────────────
      pdf.save(`Invoice-${sale.billNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = () => {
    generatePDF();
  };

  if (!sale) return null;

  const subtotal = Number(sale.subTotal || (sale.totalAmount - sale.taxAmount));
  const taxAmount = Number(sale.taxAmount);
  const total = Number(sale.totalAmount);
  const gstBreakdown = {
    cgst: taxAmount / 2,
    sgst: taxAmount / 2,
    total: taxAmount
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            GST Invoice - {sale.billNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Tax invoice details for {sale.customerName || "Walk-in Customer"} including GST breakdown.
          </DialogDescription>
        </DialogHeader>

        <div id="invoice-content" className="space-y-6" ref={invoiceRef}>
          {/* Header */}
          <div className="text-center space-y-2 border-b pb-4">
            <h1 className="text-2xl font-bold text-primary">{shop.name}</h1>
            <p className="text-sm text-muted-foreground font-semibold">TAX INVOICE</p>
          </div>

          {/* Shop Details */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Shop Details:</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {shop.address}, {shop.city}<br />
                    {shop.state} - {shop.pincode}
                  </p>
                  <div className="flex items-center gap-2 ml-6">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{shop.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-6">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{shop.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Invoice Details:</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-sm"><strong>Invoice #:</strong> {sale.billNumber}</p>
                    <p className="text-sm"><strong>Date:</strong> {format(new Date(sale.createdAt || new Date()), 'PPP')}</p>
                    <div className="text-sm flex items-center gap-1">
                      <strong>Payment:</strong> 
                      <Badge variant="secondary">{sale.paymentMode?.toUpperCase() || 'CASH'}</Badge>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">Billed To:</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    <p className="text-sm font-bold">{sale.customerName || 'Walk-in Customer'}</p>
                    {sale.customerFirm && <p className="text-sm">{sale.customerFirm}</p>}
                    {sale.customerMobile && <p className="text-sm">Ph: {sale.customerMobile}</p>}
                    {(sale.customerGstin || sale.customer_gstin) && (
                      <p className="text-sm mt-1">
                         <strong>Customer GSTIN:</strong> {sale.customerGstin || sale.customer_gstin}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm"><strong>Shop GSTIN:</strong> {shop.gstin}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Item</th>
                      <th className="text-center p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Price</th>
                      <th className="text-right p-2 font-medium">Amount</th>
                      <th className="text-right p-2 font-medium">CGST</th>
                      <th className="text-right p-2 font-medium">SGST</th>
                      <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item, index) => {
                      const productName = item.product?.name || item.name || item.product_name || 'Unknown Product';
                      const unitPrice = Number(item.price || item.unit_price || 0);
                      const quantity = Number(item.quantity || 0);
                      const itemSubtotal = unitPrice * quantity;
                      // Use item-level tax rate if available, fallback to sale level
                      const itemTaxRate = Number(item.taxRate || currentTaxRate);
                      const itemGST = calculateGST(itemSubtotal, itemTaxRate);

                      return (
                        <tr key={index} className="border-b">
                          <td className="p-2">{productName}</td>
                          <td className="text-center p-2">{quantity}</td>
                          <td className="text-right p-2">₹{unitPrice.toFixed(2)}</td>
                          <td className="text-right p-2">₹{itemSubtotal.toFixed(2)}</td>
                          <td className="text-right p-2">₹{itemGST.cgst.toFixed(2)}</td>
                          <td className="text-right p-2">₹{itemGST.sgst.toFixed(2)}</td>
                          <td className="text-right p-2 font-medium">₹{(itemSubtotal + itemGST.total).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* GST Summary */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-semibold mb-3">GST Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>CGST ({currentTaxRate / 2}%):</span>
                    <span>₹{gstBreakdown.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({currentTaxRate / 2}%):</span>
                    <span>₹{gstBreakdown.sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total GST:</span>
                    <span>₹{gstBreakdown.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>Total Amount:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t">
            <p>Thank you for your business!</p>
            <p className="text-xs mt-1">This is a computer-generated invoice</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
            <Download className="w-4 h-4 mr-2" />
            {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
