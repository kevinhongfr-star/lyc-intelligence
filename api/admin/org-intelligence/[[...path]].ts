import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handler as handleCompaniesUpload } from '../../_lib/companiesUploadHandler.js';
import { handler as handleGridReportsGenerate } from '../../_lib/gridReportsGenerateHandler.js';
import { handler as handleScoringCompute } from '../../_lib/scoringComputeHandler.js';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathArr = (req.query.path as string[]) || [];
  const key = pathArr.join('/');

  if (key === 'companies/upload' || pathArr[0] === 'companies') {
    return handleCompaniesUpload(req, res);
  }
  if (key === 'grid-reports/generate' || pathArr[0] === 'grid-reports') {
    return handleGridReportsGenerate(req, res);
  }
  if (key === 'scoring/compute' || pathArr[0] === 'scoring') {
    return handleScoringCompute(req, res);
  }
  return res.status(404).json({ error: 'Not found' });
}
