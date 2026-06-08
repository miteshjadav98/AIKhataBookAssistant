import * as XLSX from 'xlsx';

/**
 * Export array of objects to an Excel (.xlsx) file.
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  // Convert JSON to worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  // Write and trigger download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export array of objects to a CSV (.csv) file.
 */
export function exportToCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }

  // Convert JSON to worksheet to leverage xlsx's CSV export
  const ws = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(ws);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
