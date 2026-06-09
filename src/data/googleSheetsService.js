import { APP_CONFIG } from '../config/appConfig';

let COL = {};

function buildColMap(headers) {
  COL = {};
  headers.forEach((h, i) => {
    // Normalize header to something like STUDENTID, NAME, SGPA_S1, TARGETCAREER
    const key = h.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    COL[key] = i;
  });
}

function get(row, key) {
  if (COL[key] === undefined) return '';
  return (row[COL[key]] || '').toString().trim();
}

function getNum(row, key) {
  if (COL[key] === undefined) return 0;
  return parseFloat(get(row, key)) || 0;
}

function getList(row, key) {
  if (COL[key] === undefined) return [];
  return get(row, key)
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function parseRow(row) {
  const sgpaHistory = [];
  for (let i = 1; i <= 10; i++) {
    const v = getNum(row, `SGPAS${i}`);
    if (v > 0) sgpaHistory.push(v);
  }

  const cgpa =
    sgpaHistory.length > 0
      ? parseFloat(
          (sgpaHistory.reduce((a, b) => a + b, 0) / sgpaHistory.length).toFixed(2),
        )
      : 0;

  const attendance = getNum(row, 'ATTENDANCE');

  let personaType = get(row, 'PERSONATYPE');
  if (!personaType) {
    if (cgpa >= 8.5) {
      personaType = 'topperformer';
    } else if (cgpa >= 7.5) {
      personaType = 'highpotential';
    } else if (attendance < 75 || cgpa < 6.0) {
      personaType = 'atrisk';
    } else {
      personaType = 'average';
    }
  }

  return {
    id: get(row, 'ROLLNO') || get(row, 'STUDENTID') || get(row, 'ROLLNUMBER'),
    name: get(row, 'NAME'),
    email: get(row, 'EMAIL'),
    gender: get(row, 'GENDER'),
    phone: get(row, 'PHONE'),
    course: get(row, 'COURSE'),
    branch: get(row, 'BRANCH'),
    year: get(row, 'YEAR'),
    semester: get(row, 'SEMESTER'),
    category: get(row, 'CATEGORY').toLowerCase(),
    personaType,
    sgpaHistory,
    cgpa,
    attendance,
    currentSkills: getList(row, 'CURRENTSKILLS'),
    targetCareer: get(row, 'TARGETCAREER'),
    missingSkills: getList(row, 'MISSINGSKILLS'),
    certsDone: getList(row, 'CERTIFICATESDONE') || getList(row, 'CERTSDONE'),
    certsInProgress: getList(row, 'CERTIFICATESINPROGRESS') || getList(row, 'CERTSINPROGRESS'),
    extracurricular: getList(row, 'EXTRACURRICULAR'),
    leadership: getList(row, 'LEADERSHIP'),
  };
}


function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (char === '\n' || char === '\r') {
        row.push(cell.trim());
        if (row.length > 1 || row[0]) {
          result.push(row);
        }
        row = [];
        cell = '';
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n after \r
        }
      } else {
        cell += char;
      }
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    result.push(row);
  }

  return result;
}

export async function fetchStudentsFromSheet() {
  const { GOOGLE_SHEETS_SPREADSHEET_ID } = APP_CONFIG;

  if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
    throw new Error(
      'Spreadsheet ID is not configured.\n\nOpen src/config/appConfig.js and set GOOGLE_SHEETS_SPREADSHEET_ID.',
    );
  }

  const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEETS_SPREADSHEET_ID}/export?format=csv`;

  let response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error('Network error. Please check your internet connection and try again.');
  }

  if (!response.ok) {
    throw new Error(`Google Sheets error: HTTP ${response.status}. Make sure the sheet is set to "Anyone with the link can view".`);
  }

  const csvText = await response.text();

  const parsedRows = parseCSV(csvText);

  if (parsedRows.length < 2) {
    throw new Error(
      'The spreadsheet appears to be empty.\nMake sure Row 1 contains headers and Row 2+ contains student data.',
    );
  }

  // Row 0 = headers
  if (parsedRows.length > 0) {
    buildColMap(parsedRows[0]);
  }

  return parsedRows
    .slice(1)
    .filter(row => row.length > 2 && row[0])
    .map(parseRow);
}

// Spreadsheet column guide for the client-facing setup UI
export const SHEET_COLUMNS = [
  { col: 'A', field: 'StudentID', example: 'UC-CSE-001' },
  { col: 'B', field: 'Name', example: 'Aryan Kumar' },
  { col: 'C', field: 'Gender', example: 'M / F' },
  { col: 'D', field: 'Phone', example: '9876543210' },
  { col: 'E', field: 'Course', example: 'B.Tech CSE' },
  { col: 'F', field: 'Branch', example: 'Computer Science' },
  { col: 'G', field: 'Year', example: '3' },
  { col: 'H', field: 'Semester', example: '6' },
  { col: 'I', field: 'Category', example: 'Engineering' },
  { col: 'J', field: 'PersonaType', example: 'TopPerformer' },
  { col: 'K-R', field: 'SGPA_S1 … SGPA_S8', example: '8.5, 8.2, 7.9, …' },
  { col: 'S', field: 'Attendance', example: '85' },
  { col: 'T', field: 'CurrentSkills', example: 'Python, SQL, Git' },
  { col: 'U', field: 'TargetCareer', example: 'Software Engineer' },
  { col: 'V', field: 'MissingSkills', example: 'DSA, System Design' },
  { col: 'W', field: 'Certs_Done', example: 'AWS, NPTEL Python' },
  { col: 'X', field: 'Certs_InProgress', example: 'Google Cloud' },
  { col: 'Y', field: 'Extracurricular', example: 'Coding Club, Hackathons' },
  { col: 'Z', field: 'Leadership', example: 'Club President' },
];

export async function updateStudentSheet(studentId, interests) {
  // In a real application, you would use Google Sheets API with OAuth/Service Account
  // or post to a Google Apps Script Web App to write data back to the sheet.
  // For this prototype, we simulate a successful API call.
  console.log(`[GoogleSheetsService] Successfully updated student ${studentId} with interests: ${interests}`);
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}
