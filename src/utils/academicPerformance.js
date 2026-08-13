/**
 * Utility helper to compute exact NMC-compliant Academic Performance percentage
 * for medical (MBBS) students across ERP Results, ERP Hub, and Dashboard.
 */

export function calculateExactMedicalPerformance(records) {
  if (!records || !Array.isArray(records) || records.length === 0) return null;

  const byPhase = {};

  records.forEach(r => {
    const rawObtained = parseFloat(r.obtained_marks ?? r.obtainedMarks ?? 0);
    const pcode = String(r.paper_code || r.paperCode || '').trim();
    let rawTotal = parseFloat(r.total_marks ?? r.totalMarks ?? 100);
    if (rawTotal <= 0 || (rawTotal === 100 && ['30157', '30163', '30166', '30104'].includes(pcode))) {
      rawTotal = 30.0;
    }

    // A paper is valid if obtained > 0 or explicitly marked passed ('P'/'PASS')
    const statusStr = String(r.status || '').toUpperCase();
    const isTaken = rawObtained > 0 || statusStr === 'P' || statusStr === 'PASS';
    if (!isTaken) return;

    const paperPct = Math.min(100, Math.max(0, (rawObtained / rawTotal) * 100));
    const phaseName = r.phase || `Phase ${r.yr_fk || 1}`;
    const subjectName = r.subject_name || r.paper_name || pcode;

    if (!byPhase[phaseName]) byPhase[phaseName] = {};
    if (!byPhase[phaseName][subjectName]) byPhase[phaseName][subjectName] = [];
    byPhase[phaseName][subjectName].push(paperPct);
  });

  const phaseAverages = [];
  Object.values(byPhase).forEach(subjectMap => {
    const subjectAverages = [];
    Object.values(subjectMap).forEach(paperPcts => {
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
