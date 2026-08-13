/**
 * Utility helper to compute exact NMC-compliant Academic Performance percentage
 * for medical (MBBS) students across ERP Results, ERP Hub, and Dashboard.
 * Filters out un-taken future phases beyond the student's current prof year.
 */

export function calculateExactMedicalPerformance(records, student = {}) {
  if (!records || !Array.isArray(records) || records.length === 0) return null;

  // Determine current professional year limit for medical student
  const studentYear = (() => {
    const by = parseInt(student?.batch_year || student?.batchYear || 0, 10);
    if (by >= 2025) return 1;
    if (by === 2024) return 2;
    if (by === 2023) return 3;
    if (by > 0 && by <= 2022) return 4;

    const cy = parseInt(student?.current_year || student?.year || (student?.semester ? Math.ceil(parseInt(student.semester) / 2) : 0), 10);
    if (cy && cy >= 1 && cy <= 4) return cy;
    return 2; // Default to 2 for active 2nd prof
  })();

  const byPhase = {};

  records.forEach(r => {
    const yrFk = parseInt(r.yr_fk || r.yrFk || (r.phase ? r.phase.replace(/\D/g, '') : 1), 10);
    // Ignore future phases beyond student's current prof year
    if (yrFk > studentYear) return;

    const rawObtained = parseFloat(r.obtained_marks ?? r.obtainedMarks ?? 0);
    const pcode = String(r.paper_code || r.paperCode || '').trim();
    let rawTotal = parseFloat(r.total_marks ?? r.totalMarks ?? 100);
    if (rawTotal <= 0 || (rawTotal === 100 && ['30157', '30163', '30166', '30104'].includes(pcode))) {
      rawTotal = 30.0;
    }

    const statusStr = String(r.status || '').toUpperCase();
    const isTaken = rawObtained > 0 || statusStr === 'P' || statusStr === 'PASS';
    if (!isTaken) return;

    const paperPct = Math.min(100, Math.max(0, (rawObtained / rawTotal) * 100));
    const phaseName = r.phase || `Phase ${yrFk}`;
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
