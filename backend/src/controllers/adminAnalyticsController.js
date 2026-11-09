import { dashboard } from '../services/dashboard.js';
import { report, exportReport } from '../services/reports.js';
const wrap = action => async (req, res, next) => { try { await action(req, res); } catch (error) { next(error); } };
export const getDashboard = wrap(async (req, res) => res.json(await dashboard(req.query)));
export const getReport = wrap(async (req, res) => res.json(await report(req.params.type, req.query)));
export const downloadReport = wrap(async (req, res) => exportReport(req.params.type, req.query, res));
