# Strict Build & Deployment Rules

- **STRICT PROHIBITION ON AUTOMATIC BINARY / APK BUILDS**:
  NEVER execute `eas build`, `npx eas build`, `expo build`, `./gradlew assemble`, or any Android/iOS binary compilation command automatically.
  Even if code changes or OTA updates are published, DO NOT trigger an APK or binary build unless the user explicitly types a directive in their current turn instructing to build an APK.
  Always ask for explicit confirmation and wait for approval before running any build command.

---

# 🔒 LOCKED: MBBS Professional Year Subject Classification — DO NOT MODIFY

> **This rule is PERMANENT and INVIOLABLE. No agent may alter the subject → phase mapping below under ANY circumstance, regardless of other task requirements. Any code change that touches `ERPAttendanceScreen.js` or `ERPResultsScreen.js` MUST preserve this exact mapping.**

## Canonical MBBS Phase-to-Subject List

### 1st Prof (EXACTLY 4 parent subjects)
1. Anatomy
2. Physiology
3. Biochemistry *(CBME 2024 and CBME 2019 variants are both 1st Prof)*
4. Community Medicine *(Theory + Practical only: codes 84401, 84402, Family Adoption Program)*

**CRITICAL**: General Medicine, General Surgery, Pathology, Pharmacology, Microbiology, or ANY other clinical subject MUST NEVER appear in 1st Prof — not in attendance, not in results, not in any grouping logic.

### 2nd Prof (EXACTLY 9 parent subjects)
1. Pathology
2. Pharmacology
3. Microbiology
4. General Medicine *(codes 85796, 85804)*
5. General Surgery *(codes 85798, 85805)*
6. Obstetrics & Gynaecology *(codes 85800, 85806)*
7. Paediatrics *(code 85807)*
8. Dermatology, Venereology & Leprosy *(code 85809)*
9. Orthopedics *(code 85810)*

### 3rd Prof Part I (EXACTLY 11 parent subjects)
1. Community Medicine *(Clinical Postings: codes 85808, 87259, 87260)*
2. Forensic Medicine & Toxicology (FMT) *(codes 85802, 85803, 87258)*
3. Ophthalmology *(codes 87247, 87249, 87255)*
4. ENT / Otorhinolaryngology *(codes 87248, 87250, 87256, 87574)*
5. General Medicine *(code 85797)*
6. General Surgery *(code 85799)*
7. Obstetrics & Gynaecology *(code 85801)*
8. Paediatrics *(codes 87253, 87254)*
9. Orthopedics *(codes 87251, 87252, 87575)*
10. Dermatology, Venereology & Leprosy *(clone from 2nd Prof via DERM CLONE block)*
11. Dentistry *(code 85811)*

## 🚨 Coding Rules — ERPAttendanceScreen.js (src/screens/student/ERPAttendanceScreen.js)

These rules MUST be preserved in every edit to this file:

1. **PHASE1 block** (`PHASE1_CODES` Set and its `if` guard) MUST only return `'1st Prof'`.  
   It MUST contain ONLY Anatomy, Physiology, Biochemistry and Community Medicine Theory/Practical/FAP codes (84395–84400, 84817–84822, 87224–87232, 84401, 84402).
   
2. **2nd Prof parent name guard** — The block `if (currentPhaseName === '2nd Prof')` that forces General Medicine/Surgery/OBG/Paeds/Derm/Ortho into `'2nd Prof'` MUST remain restricted to `currentPhaseName === '2nd Prof'` ONLY and MUST run **before** `PHASE3_CODES`.
   - **DO NOT** change this to `currentPhaseName !== '1st Prof'` — doing so intercepts 3rd Prof clinical subjects (General Medicine code 85797, Gen Surg 85799, OBG 85801, Paeds 87253/87254, Ortho 87251/87252/87575) before PHASE3_CODES can classify them as 3rd Prof Part I, which breaks the 11-subject count.
   - General Medicine CANNOT reach `'1st Prof'` from this function because `PHASE1_CODES` contains no clinical codes and `parentName 'General Medicine'` is not in `['Anatomy','Physiology','Biochemistry']`.

3. `'General Medicine'` parentName MUST NEVER return `'1st Prof'`. It must always be intercepted by PHASE3_CODES (code 85797 → 3rd Prof Part I) or PHASE2_CODES (codes 85796, 85804 → 2nd Prof) or the 2nd Prof parent name guard.

4. **Shared clinical subjects step** — The block AFTER `PHASE3_CODES` and `PHASE2_CODES` that catches `['General Medicine', 'GENERAL SURGERY', 'Obstetrics & Gynaecology', 'PAEDIATRICS', 'Orthopedics']` by parentName MUST remain restricted to `currentPhaseName === '2nd Prof'` ONLY:
   ```js
   if (currentPhaseName === '2nd Prof' && ['General Medicine', 'GENERAL SURGERY', ...].includes(parentName)) {
     return '2nd Prof';
   }
   ```
   - This runs AFTER `PHASE3_CODES`, so Phase 3 specific codes (85797, 85799, 85801, 87253/87254, 87251/87252/87575) have already returned `'3rd Prof Part I'` and never reach this block.
   - Only subjects with abbreviation codes (`IM`, `SU`, `OG`, `PE`, `OR`) or unknown codes fall through to this step. For them, `'2nd Prof'` is the correct classification for 2nd Prof students.
   - **DO NOT remove `currentPhaseName === '2nd Prof'`** — without it, 3rd Prof students lose Gen Med/Surgery/OBG/Paeds/Ortho from 3rd Prof Part I (the step-7 catch-all never fires), reducing 3rd Prof Part I to 6 subjects.
   - For 3rd Prof students, the 2nd Prof history (9 subjects) is handled by the **CLINICAL HISTORY CLONE block** in the `forEach` loop (not by this step).

5. **MULTI-PHASE SUBJECT CLONING block** — In `attendanceData.subjects.forEach`, after `addToGroup(phaseName, sub)`, there MUST be a block that clones multi-phase subjects for 3rd Prof students:
   ```js
   if (isMedical && currentPhaseName.includes('3rd Prof')) {
     const parentN = getParentSubjectName(sub.name, sub.code);
     if (parentN === 'Community Medicine' && phaseName === '1st Prof') {
       addToGroup('3rd Prof Part I', { ...sub, _clonedForPhase3: true });
     }
     const SHARED_CLINICAL_PARENTS = [
       'General Medicine', 'GENERAL SURGERY', 'Obstetrics & Gynaecology',
       'PAEDIATRICS', 'Orthopedics', 'Dermatology, Venereology & Leprosy',
     ];
     if (SHARED_CLINICAL_PARENTS.includes(parentN)) {
       if (phaseName === '3rd Prof Part I') {
         addToGroup('2nd Prof', { ...sub, _clonedForPhase2History: true });
       } else if (phaseName === '2nd Prof') {
         addToGroup('3rd Prof Part I', { ...sub, _clonedForPhase3: true });
       }
     }
   }
   ```
   - **Why needed**: `GetUGSubjectCode` returns single records with abbreviation/numeric codes. For 3rd Prof students:
     - `Community Medicine` belongs in BOTH 1st Prof (history) and 3rd Prof Part I (ongoing).
     - Clinical subjects (`General Medicine`, `GENERAL SURGERY`, `Obstetrics & Gynaecology`, `PAEDIATRICS`, `Orthopedics`, `Dermatology`) belong in BOTH 2nd Prof (history) and 3rd Prof Part I (ongoing).
   - **DO NOT REMOVE OR ALTER** this block — without it, 3rd Prof students will lose subjects from either 2nd Prof history or 3rd Prof Part I ongoing.

6. **CANONICAL MBBS PHASE SUBJECT GUARANTEE (STRICT WHITELIST & FILLER)** — In `displayData`, right after `parentMap` is populated from `data.subjects`, `parentMap` MUST be filtered to contain ONLY AND EXACTLY the items in `CANONICAL_PHASE_PARENTS[phase]`:
   ```js
   if (isMedical) {
     const CANONICAL_PHASE_PARENTS = {
       '1st Prof': ['Anatomy', 'Physiology', 'Biochemistry_(CBME 2024)', 'Community Medicine'],
       '2nd Prof': ['Pathology', 'Pharmacology', 'Microbiology', 'General Medicine', 'GENERAL SURGERY', 'Obstetrics & Gynaecology', 'PAEDIATRICS', 'Dermatology, Venereology & Leprosy', 'Orthopedics'],
       '3rd Prof Part I': ['Community Medicine', 'FORENSIC MEDICINE', 'Ophthalmology', 'Otorhinolaryngology', 'General Medicine', 'GENERAL SURGERY', 'Obstetrics & Gynaecology', 'PAEDIATRICS', 'Orthopedics', 'Dermatology, Venereology & Leprosy', 'Dentistry'],
     };
     // 1. Discard non-canonical subjects from phase display
     // 2. Insert default 0% placeholder for any missing canonical subject
   }
   ```
   - **Why needed**: Guarantees that EVERY student in EVERY year gets EXACTLY 4 subjects in 1st Prof, EXACTLY 9 subjects in 2nd Prof, and EXACTLY 11 subjects in 3rd Prof Part I. Non-canonical subjects or misclassified API payloads cannot expand any phase beyond its canonical count.
   - **DO NOT REMOVE OR ALTER** this block.

## 🚨 Coding Rules — ERPResultsScreen.js (src/screens/student/ERPResultsScreen.js)

These rules MUST be preserved in every edit to this file:

1. `getPhaseForPaper` uses `defaultPhase` (from `getPhaseForSubject(subjectName)`) to gate `dbYrFk` for the `'1st Prof'` case ONLY:
   ```js
   if (yr === '1') {
     if (defaultPhase === '3rd Prof Part II') return defaultPhase; // clinical subject, suppress leak
     return '1st Prof';
   }
   ```
   - `defaultPhase === '3rd Prof Part II'` is the clinical subject fallback (General Medicine, General Surgery, etc.). These must never go to 1st Prof via a stale `Yr_FK=1`.
   - `defaultPhase === '3rd Prof Part I'` (Community Medicine) with `Yr_FK=1` MUST still return `'1st Prof'` because Community Medicine Theory/Practical exams ARE in 1st Prof. Do NOT gate this on `subjectPhaseByName === '1st Prof'`.
   - `defaultPhase === '1st Prof'` (Anatomy, Physiology, Biochemistry) with `Yr_FK=1` → `'1st Prof'` ✓

2. `getPhaseForSubject` itself must NEVER return `'1st Prof'` for General Medicine, Pathology, Pharmacology, Microbiology, or any clinical subject. The fallback `return '3rd Prof Part II'` at the end ensures this — do NOT add any case above it that could catch clinical subjects into 1st Prof.
