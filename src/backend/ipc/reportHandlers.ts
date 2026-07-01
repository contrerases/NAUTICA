import { ipcMain, dialog, BrowserWindow } from 'electron';
import fs from 'fs';
import { ReportChannels } from '../../shared/types/ipc';
import { periodSchema } from '../../shared/validators';
import { payrollService } from '../services/payrollService';
import { reportService } from '../services/reportService';
import { ok, fail } from './helpers';

export function registerReportHandlers(): void {
  ipcMain.handle(ReportChannels.PAYROLL, (_e, payload) => {
    try {
      const { year, month } = periodSchema.parse(payload);
      return ok(payrollService.getPayroll(year, month));
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(ReportChannels.DASHBOARD, () => {
    try {
      return ok(payrollService.getDashboard());
    } catch (e) {
      return fail(e);
    }
  });

  ipcMain.handle(ReportChannels.EXPORT_EXCEL, async (_e, payload) => {
    try {
      const { year, month } = periodSchema.parse(payload);
      const summary = payrollService.getPayroll(year, month);
      const buffer = await reportService.buildPayrollWorkbook(summary);

      const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
      const result = await dialog.showSaveDialog(win!, {
        title: 'Exportar liquidación',
        defaultPath: reportService.suggestedFileName(summary.period),
        filters: [{ name: 'Excel', extensions: ['xlsx'] }],
      });
      if (result.canceled || !result.filePath) return ok({ canceled: true });

      fs.writeFileSync(result.filePath, buffer);
      return ok({ canceled: false, path: result.filePath });
    } catch (e) {
      return fail(e);
    }
  });
}
