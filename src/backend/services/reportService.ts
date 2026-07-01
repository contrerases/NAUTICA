import ExcelJS from 'exceljs';
import type { PayrollSummary } from '../../shared/types/reports';
import { formatDuration } from '../../shared/utils/time';

/** Genera el libro Excel de la liquidación mensual (HU-13). Devuelve el buffer .xlsx. */
export const reportService = {
  async buildPayrollWorkbook(summary: PayrollSummary): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Náutica Jornada';
    const ws = wb.addWorksheet(`Liquidación ${summary.period}`);

    ws.columns = [
      { header: 'Trabajador', key: 'name', width: 28 },
      { header: 'Días', key: 'days', width: 8 },
      { header: 'Horas trabajadas', key: 'hours', width: 18 },
      { header: 'Horas extra', key: 'ot', width: 14 },
      { header: 'Sueldo base', key: 'base', width: 16 },
      { header: 'Pago extra', key: 'otpay', width: 14 },
      { header: 'Bruto', key: 'gross', width: 14 },
      { header: 'Adelantos', key: 'advances', width: 14 },
      { header: 'Líquido', key: 'net', width: 16 },
    ];
    ws.getRow(1).font = { bold: true };

    const money = '#,##0';
    for (const w of summary.workers) {
      const row = ws.addRow({
        name: w.worker_name + (w.status === 'INACTIVE' ? ' (inactivo)' : ''),
        days: w.days_worked,
        hours: formatDuration(w.total_minutes),
        ot: formatDuration(w.overtime_minutes),
        base: w.base_payment,
        otpay: w.overtime_payment,
        gross: w.gross_payment,
        advances: w.advances_amount,
        net: w.net_payment,
      });
      (['base', 'otpay', 'gross', 'advances', 'net'] as const).forEach((k) => {
        row.getCell(k).numFmt = money;
      });
      if (w.has_debt) {
        row.getCell('net').font = { color: { argb: 'FFCC0000' }, bold: true };
      }
    }

    const total = ws.addRow({
      name: 'TOTAL',
      gross: summary.total_gross,
      advances: summary.total_advances,
      net: summary.total_net,
    });
    total.font = { bold: true };
    (['gross', 'advances', 'net'] as const).forEach((k) => {
      total.getCell(k).numFmt = money;
    });

    if (summary.provisional) {
      ws.addRow({});
      ws.addRow({ name: 'Nota: cifras provisionales (hay turnos sin cerrar en el período).' });
    }

    const arrayBuffer = await wb.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  },

  suggestedFileName(period: string): string {
    return `liquidacion_${period}.xlsx`;
  },
};
