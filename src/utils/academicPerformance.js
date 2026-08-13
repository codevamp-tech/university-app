/**
 * Utility helper to compute exact NMC-compliant Academic Performance percentage
 * for medical (MBBS) students across ERP Results, ERP Hub, and Dashboard.
 * Includes all phases that have taken paper results (matching ERPResultsScreen).
 */

export function calculateExactMedicalPerformance(records) {
  if (!records || !Array.isArray(records) || records.length === 0) return null;

  const thirtyMarkCodes = ['30157', '30163', '30166', '30104'];
  const byPhase = {};

  records.forEach(r => {
    const rawObtained = r.obtained_marks !== null && r.obtained_marks !== undefined
      ? parseFloat(r.obtained_marks)
      : (r.obtainedMarks !== null && r.obtainedMarks !== undefined ? parseFloat(r.obtainedMarks) : null);
    
    const statusStr = String(r.status || '').toUpperCase();
    const isTaken = (rawObtained !== null && rawObtained > 0) || statusStr === 'P' || statusStr === 'PASS';
    
    // Ignore un-taken papers
    if (!isTaken) return;

    const pcode = String(r.paper_code || r.paperCode || r.subject_code || '').trim();
    const nameLower = String(r.paper_name || r.paperName || r.subject_name || '').toLowerCase();
    
    let rawTotal = parseFloat(r.total_marks ?? r.totalMarks ?? 0);
    
    // Auto-detect 30-mark sessional papers if total_marks is 100 or <= 0
    if (rawTotal <= 0 || rawTotal === 100) {
      if (thirtyMarkCodes.includes(pcode) ||
          ((nameLower.includes('community medicine') || nameLower.includes('surgery') || nameLower.includes('general medicine')) &&
           (nameLower.includes('sessional') || nameLower.includes('internal')) &&
           !nameLower.includes('pre-uni') && !nameLower.includes('university'))) {
        rawTotal = 30.0;
      } else if (rawTotal <= 0) {
        rawTotal = 100.0;
      }
    }

    const paperPct = Math.min(100, Math.max(0, (rawObtained / rawTotal) * 100));
    const yrFk = parseInt(r.yr_fk || r.yrFk || (r.phase ? r.phase.replace(/\D/g, '') : 1), 10);
    const phaseName = r.phase || `Phase ${yrFk}`;
    const subjectName = r.subject_name || r.paper_name || pcode;

    if (!byPhase[phaseName]) {
      byPhase[phaseName] = { yr_fk: yrFk, subjectsMap: {} };
    }
    if (!byPhase[phaseName].subjectsMap[subjectName]) {
      byPhase[phaseName].subjectsMap[subjectName] = [];
    }
    byPhase[phaseName].subjectsMap[subjectName].push(paperPct);
  });

  // Compute average across all phases that have taken paper results
  const phaseAverages = [];
  Object.values(byPhase).forEach(pInfo => {
    const subjectAverages = [];
    Object.values(pInfo.subjectsMap).forEach(paperPcts => {
      if (paperPcts.length > 0) {
        const subAvg = paperPcts.reduce((a, b) => a + b, 0) / paperPcts.length;
        subjectAverages.push(subAvg);
      }
    });

    if (subjectAverages.length > 0) {
      const phaseAvg = subjectAverages.reduce((a, b) => a + b, 0) / subjectAverages.length;
      phaseAverages.push(phaseAvg);
    }
  });

  if (phaseAverages.length > 0) {
    return Math.round(phaseAverages.reduce((a, b) => a + b, 0) / phaseAverages.length);
  }
  return null;
}
