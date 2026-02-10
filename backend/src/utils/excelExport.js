const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

/**
 * Export inventory data to Excel
 */
async function exportInventoryToExcel(products, shopName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Set column headers
    worksheet.columns = [
        { header: 'Product Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Barcode', key: 'barcode', width: 15 },
        { header: 'Quantity Type', key: 'quantityType', width: 15 },
        { header: 'Current Stock', key: 'stock', width: 15 },
        { header: 'Reorder Level', key: 'reorderLevel', width: 15 },
        { header: 'Cost Price', key: 'costPrice', width: 15 },
        { header: 'Selling Price', key: 'sellingPrice', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    products.forEach(product => {
        worksheet.addRow({
            name: product.name,
            category: product.category?.name || 'Uncategorized',
            sku: product.sku || 'N/A',
            barcode: product.barcode || 'N/A',
            quantityType: product.quantityType,
            stock: product.stock,
            reorderLevel: product.reorderLevel,
            costPrice: parseFloat(product.costPrice),
            sellingPrice: parseFloat(product.sellingPrice),
            status: product.isActive ? 'Active' : 'Inactive'
        });
    });

    // Format currency columns
    worksheet.getColumn('costPrice').numFmt = '₹#,##0.00';
    worksheet.getColumn('sellingPrice').numFmt = '₹#,##0.00';

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Add summary at the bottom
    const summaryRow = worksheet.addRow([]);
    summaryRow.getCell(1).value = 'Total Products:';
    summaryRow.getCell(1).font = { bold: true };
    summaryRow.getCell(2).value = products.length;

    const lowStockCount = products.filter(p => p.stock <= p.reorderLevel).length;
    const lowStockRow = worksheet.addRow([]);
    lowStockRow.getCell(1).value = 'Low Stock Items:';
    lowStockRow.getCell(1).font = { bold: true };
    lowStockRow.getCell(2).value = lowStockCount;
    lowStockRow.getCell(2).font = { color: { argb: 'FFFF0000' } };

    return workbook;
}

/**
 * Export bills data to Excel
 */
async function exportBillsToExcel(bills, shopName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Bills');

    // Set column headers
    worksheet.columns = [
        { header: 'Bill Number', key: 'billNumber', width: 15 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Customer Name', key: 'customerName', width: 25 },
        { header: 'Customer Mobile', key: 'customerMobile', width: 15 },
        { header: 'Payment Mode', key: 'paymentMode', width: 15 },
        { header: 'Sub Total', key: 'subTotal', width: 15 },
        { header: 'CGST', key: 'cgst', width: 12 },
        { header: 'SGST', key: 'sgst', width: 12 },
        { header: 'IGST', key: 'igst', width: 12 },
        { header: 'Total Tax', key: 'taxAmount', width: 15 },
        { header: 'Grand Total', key: 'totalAmount', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF70AD47' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    bills.forEach(bill => {
        worksheet.addRow({
            billNumber: bill.billNumber,
            date: new Date(bill.createdAt).toLocaleString('en-IN'),
            customerName: bill.customerName || 'Walk-in Customer',
            customerMobile: bill.customerMobile || 'N/A',
            paymentMode: bill.paymentMode,
            subTotal: parseFloat(bill.subTotal),
            cgst: parseFloat(bill.cgst),
            sgst: parseFloat(bill.sgst),
            igst: parseFloat(bill.igst),
            taxAmount: parseFloat(bill.taxAmount),
            totalAmount: parseFloat(bill.totalAmount),
            status: bill.status
        });
    });

    // Format currency columns
    ['subTotal', 'cgst', 'sgst', 'igst', 'taxAmount', 'totalAmount'].forEach(col => {
        worksheet.getColumn(col).numFmt = '₹#,##0.00';
    });

    // Add borders
    worksheet.eachRow((row) => {
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Add summary
    const totalSales = bills.reduce((sum, bill) => sum + parseFloat(bill.totalAmount), 0);
    const totalTax = bills.reduce((sum, bill) => sum + parseFloat(bill.taxAmount), 0);

    worksheet.addRow([]);
    const summaryRow1 = worksheet.addRow([]);
    summaryRow1.getCell(1).value = 'Total Bills:';
    summaryRow1.getCell(1).font = { bold: true };
    summaryRow1.getCell(2).value = bills.length;

    const summaryRow2 = worksheet.addRow([]);
    summaryRow2.getCell(1).value = 'Total Sales:';
    summaryRow2.getCell(1).font = { bold: true };
    summaryRow2.getCell(2).value = totalSales;
    summaryRow2.getCell(2).numFmt = '₹#,##0.00';

    const summaryRow3 = worksheet.addRow([]);
    summaryRow3.getCell(1).value = 'Total Tax Collected:';
    summaryRow3.getCell(1).font = { bold: true };
    summaryRow3.getCell(2).value = totalTax;
    summaryRow3.getCell(2).numFmt = '₹#,##0.00';

    return workbook;
}

/**
 * Export sales report to Excel
 */
async function exportSalesReportToExcel(reportData, shopName, dateRange) {
    const workbook = new ExcelJS.Workbook();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 }
    ];

    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B9BD5' }
    };

    summarySheet.addRow({ metric: 'Shop Name', value: shopName });
    summarySheet.addRow({ metric: 'Report Period', value: dateRange });
    summarySheet.addRow({ metric: 'Total Bills', value: reportData.totalBills || 0 });
    summarySheet.addRow({ metric: 'Total Revenue', value: reportData.totalRevenue || 0 });
    summarySheet.addRow({ metric: 'Total Tax Collected', value: reportData.totalTax || 0 });
    summarySheet.addRow({ metric: 'Total Profit', value: reportData.totalProfit || 0 });

    summarySheet.getColumn('value').numFmt = '₹#,##0.00';

    // Product-wise Sales Sheet
    if (reportData.productSales && reportData.productSales.length > 0) {
        const productSheet = workbook.addWorksheet('Product-wise Sales');
        productSheet.columns = [
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Quantity Sold', key: 'quantitySold', width: 15 },
            { header: 'Revenue', key: 'revenue', width: 15 },
            { header: 'Profit', key: 'profit', width: 15 }
        ];

        productSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        productSheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFED7D31' }
        };

        reportData.productSales.forEach(item => {
            productSheet.addRow({
                productName: item.productName,
                quantitySold: item.quantitySold,
                revenue: parseFloat(item.revenue),
                profit: parseFloat(item.profit || 0)
            });
        });

        productSheet.getColumn('revenue').numFmt = '₹#,##0.00';
        productSheet.getColumn('profit').numFmt = '₹#,##0.00';
    }

    return workbook;
}

/**
 * Save workbook to file
 */
async function saveWorkbook(workbook, fileName) {
    const backupDir = path.join(__dirname, '../../backups');

    // Ensure backup directory exists
    try {
        await fs.access(backupDir);
    } catch {
        await fs.mkdir(backupDir, { recursive: true });
    }

    const filePath = path.join(backupDir, fileName);
    await workbook.xlsx.writeFile(filePath);

    const stats = await fs.stat(filePath);

    return {
        filePath,
        fileName,
        fileSize: stats.size
    };
}

module.exports = {
    exportInventoryToExcel,
    exportBillsToExcel,
    exportSalesReportToExcel,
    saveWorkbook
};
