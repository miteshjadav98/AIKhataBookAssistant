import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
const pdfMake = require('pdfmake');

@Injectable()
export class PdfService {
  constructor() {
    pdfMake.setFonts({
      Roboto: {
        normal: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Medium.ttf'),
        italics: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto', 'Roboto-MediumItalic.ttf'),
      },
    });
  }

  async generateInvoicePdf(
    invoiceId: string,
    data: any,
    invoiceType: 'SALE' | 'PURCHASE' = 'SALE',
  ): Promise<string> {
    const docDefinition = this.buildDocDefinition(data, invoiceType);

    const filename = `${invoiceType}_${invoiceId}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');

    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, filename);

    // pdfmake v0.3.x: createPdf returns an object with a .write(path) method
    const doc = pdfMake.createPdf(docDefinition);
    await doc.write(filePath);

    return `/invoices/${filename}`;
  }

  private buildDocDefinition(data: any, invoiceType: string): any {
    const {
      shop,
      customer,
      supplier,
      items,
      subtotal,
      discount,
      dueAmount,
      paidAmount,
      paymentMode,
      invoiceNumber,
      createdAt,
    } = data;
    const client = invoiceType === 'SALE' ? customer : supplier;

    const itemsTable = {
      headerRows: 1,
      widths: ['*', 'auto', 'auto', 'auto'],
      body: [
        [
          { text: 'Item', bold: true, fillColor: '#f4f4f5' },
          { text: 'Qty', bold: true, alignment: 'right', fillColor: '#f4f4f5' },
          { text: 'Price', bold: true, alignment: 'right', fillColor: '#f4f4f5' },
          { text: 'Total', bold: true, alignment: 'right', fillColor: '#f4f4f5' },
        ],
        ...items.map((item: any) => {
          const price = item.sellingPrice || item.purchasePrice || item.price || 0;
          return [
            item.productName || item.productId?.slice(-6) || 'Item',
            { text: (item.qty ?? 0).toString(), alignment: 'right' },
            { text: `Rs.${price.toFixed(2)}`, alignment: 'right' },
            { text: `Rs.${((item.qty || 0) * price).toFixed(2)}`, alignment: 'right' },
          ];
        }),
      ],
    };

    return {
      content: [
        // Header
        {
          columns: [
            {
              text: shop?.name || 'My Shop',
              fontSize: 20,
              bold: true,
              color: '#6366f1',
            },
            {
              text: invoiceType === 'SALE' ? 'INVOICE' : 'PURCHASE ORDER',
              fontSize: 20,
              bold: true,
              alignment: 'right',
              color: '#333333',
            },
          ],
        },
        {
          text: `Invoice #: ${invoiceNumber || 'N/A'}\nDate: ${new Date(createdAt).toLocaleDateString()}`,
          alignment: 'right',
          margin: [0, 5, 0, 20],
        },
        // Bill To
        {
          text: invoiceType === 'SALE' ? 'Bill To:' : 'Supplier:',
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        {
          text: `${client?.name || 'Walk-in'}\n${client?.phone || ''}\n${client?.billingAddress || ''}`,
          margin: [0, 0, 0, 20],
        },
        // Items Table
        {
          table: itemsTable,
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 20],
        },
        // Totals
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 250,
              table: {
                widths: ['*', 'auto'],
                body: [
                  ['Subtotal', { text: `Rs.${(subtotal || 0).toFixed(2)}`, alignment: 'right' }],
                  ['Discount', { text: `Rs.${(discount || 0).toFixed(2)}`, alignment: 'right' }],
                  [
                    { text: 'Paid Amount', bold: true },
                    { text: `Rs.${(paidAmount || 0).toFixed(2)}`, alignment: 'right', bold: true, color: '#22c55e' },
                  ],
                  [
                    { text: 'Due Amount', bold: true },
                    { text: `Rs.${(dueAmount || 0).toFixed(2)}`, alignment: 'right', bold: true, color: '#ef4444' },
                  ],
                ],
              },
              layout: 'noBorders',
            },
          ],
        },
        // Footer
        {
          text: `Payment Mode: ${paymentMode || 'N/A'}`,
          margin: [0, 20, 0, 0],
          fontSize: 10,
          color: '#666666',
        },
        {
          text: 'Thank you for your business!',
          margin: [0, 30, 0, 0],
          alignment: 'center',
          fontSize: 12,
          bold: true,
        },
      ],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
      },
    };
  }
}
