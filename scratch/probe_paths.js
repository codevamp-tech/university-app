const filename = "Physiology2026-07-07dummy.jpg";

const candidates = [
  `https://myportal.srms.ac.in/ops/Uploads/${filename}`,
  `https://myportal.srms.ac.in/ops/Faculty/Uploads/${filename}`,
  `https://myportal.srms.ac.in/ops/Uploads/LectureMaterial/${filename}`,
  `https://myportal.srms.ac.in/Uploads/${filename}`,
  `https://myportal.srms.ac.in/Uploads/LectureMaterial/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Faculty/Uploads/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Faculty/Uploads/LectureMaterial/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Uploads/LectureMaterial/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Faculty/UploadLectureMaterial/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Faculty/UploadLectureMaterial/Uploads/${filename}`,
  `https://myportal.srms.ac.in/SRMSERP/Faculty/LectureMaterial/${filename}`,
];

async function run() {
  console.log("Probing with GET requests...");
  for (const url of candidates) {
    try {
      const res = await fetch(url);
      console.log(`GET status for ${url} -> ${res.status}`);
      if (res.status === 200) {
        console.log(`FOUND! -> ${url}`);
        return;
      }
    } catch(e) {
      console.log(`Error probing ${url}: ${e.message}`);
    }
  }
}

run();
