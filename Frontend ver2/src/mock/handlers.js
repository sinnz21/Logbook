// Demo-mode request handlers: the same routes app/api/* calls on the real
// FastAPI backend, answered from the in-memory dataset in data.js.
//
// Mutations persist for the session and reset on reload — that's deliberate, so
// a demo can't be left in a broken state.
import * as seed from './data.js';

/** The records a backup covers. The audit log and the backup list itself are kept out on purpose. */
const freshRecords = () => structuredClone({
  users: seed.users,
  patients: seed.patients,
  visits: seed.visits,
  stock: seed.stock,
  requests: seed.stockRequests,
  settings: seed.settings,
});

const db = {
  ...freshRecords(),
  audit: seed.auditLogs.map((e) => ({ ...e })),
  backups: seed.backups.map((b) => ({ ...b })),
  snapshots: new Map(), // backupId → records, for backups taken during this session
  resetCodes: new Map(), // email → { code, userId, expiresAt, attempts }
  resetRequests: new Map(), // email → timestamps (ms) of recent code requests
  resetTokens: new Map(), // token → userId
  nextIds: { visit: 9000, patient: 900, specialCase: 900, request: 900, user: 900, audit: 90000, backup: 100 },
};

const RECORD_KEYS = ['users', 'patients', 'visits', 'stock', 'requests', 'settings'];
const RESET_CODE_SECONDS = 600;
// The same limits BACKEND_REQUIREMENTS.md asks the real server to enforce.
const RESET_REQUEST_LIMIT = 3; // code requests per email…
const RESET_REQUEST_WINDOW_MS = 15 * 60 * 1000; // …per 15 minutes
const RESET_MAX_WRONG = 5; // wrong guesses before a code is cancelled

const mmss = (ms) => {
  const total = Math.max(1, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/** The signed-in user for this request, from the demo token's payload. */
let currentUser = null;
function userFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return db.users.find((u) => u.username === payload.sub) || null;
  } catch {
    return null;
  }
}

function audit(user, action, entity, entityId, details) {
  db.audit.unshift(seed.auditEntry(db.nextIds.audit++, now(), user, action, entity, entityId, details));
}

class HttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

const now = () => new Date().toISOString().slice(0, 19);
const num = (v) => (v == null || v === '' ? null : Number(v));
const text = (v) => (typeof v === 'string' ? v.trim() || null : v ?? null);

function page(items, query) {
  const p = Number(query.page || 1);
  const perPage = Number(query.per_page || 50);
  return { items: items.slice((p - 1) * perPage, p * perPage), total: items.length, page: p, perPage };
}

const withStatus = (item) => ({ ...item, stockStatus: seed.stockStatusOf(item) });
const findStock = (itemType, itemId) =>
  db.stock.find((s) => s.itemType === itemType && s.itemId === Number(itemId));

/** Denormalised patient fields, refreshed onto every visit row the API returns. */
function decorate(visit) {
  const p = db.patients.find((x) => x.patientId === visit.patientId);
  if (!p) return visit;
  return {
    ...visit,
    patientName: p.fullName,
    patientNumber: p.patientNumber,
    patientTypeName: p.patientTypeName,
    sex: p.sex,
    age: p.age,
    yearLevel: p.yearLevel || null,
    program: p.program || null,
    department: p.department || null,
    specialCases: p.specialCases.filter((c) => c.active).map((c) => ({ caseName: c.caseName, notes: c.notes, active: true })),
  };
}

function patientOut(p) {
  return { ...p, visitCount: db.visits.filter((v) => v.patientId === p.patientId).length };
}

function matchesVisit(v, q) {
  const search = (q.search || '').trim().toLowerCase();
  if (search && ![v.patientName, v.patientNumber, v.chiefComplaint, ...(v.complaints || [])]
    .some((s) => s && String(s).toLowerCase().includes(search))) return false;
  if (q.patient_id && v.patientId !== Number(q.patient_id)) return false;
  if (q.status && v.status !== q.status) return false;
  if (q.sex && (v.sex || '').toLowerCase() !== q.sex.toLowerCase()) return false;
  if (q.year_level && v.yearLevel !== q.year_level) return false;
  if (q.program && v.program !== q.program) return false;
  if (q.department && v.department !== q.department) return false;
  const day = v.startedAt.slice(0, 10);
  // startedAt is UTC; the clinic day is +8, so compare on the local calendar day.
  const localDay = seed.clinicDay(new Date(`${v.startedAt}Z`));
  if (q.date_from && localDay < q.date_from) return false;
  if (q.date_to && localDay > q.date_to) return false;
  void day;
  return true;
}

/** Deducts what a visit dispensed, so the stock screen reacts to new records. */
function applyDispense({ medicines = [], supplies = [] }) {
  for (const m of medicines) {
    const item = findStock('medicine', m.medicineId);
    if (item) item.quantity = Math.max(0, Number(item.quantity) - Number(m.quantityGiven)).toFixed(2);
  }
  for (const s of supplies) {
    const item = findStock('supply', s.supplyId);
    if (item) item.quantity = Math.max(0, Number(item.quantity) - Number(s.quantityUsed)).toFixed(2);
  }
}

// A structurally valid JWT (unsigned) — lib/session.js decodes the payload and
// checks `exp` before restoring a session, so an opaque string wouldn't survive
// a page refresh.
function fakeJwt(user) {
  const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600; // one shift
  return `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: user.username, role: user.role, exp })}.demo`;
}

// ───────────────────────────── routes ─────────────────────────────
// Order matters: literal paths are listed before their :param siblings.

const routes = [
  ['POST', /^\/auth\/login$/, (_m, _q, body) => {
    const username = (body.username || '').trim().toLowerCase();
    const user = db.users.find((u) => u.username === username);
    if (!user) {
      audit(null, 'login_failed', 'session', null, `Unknown username "${username}"`);
      throw new HttpError(401, 'Incorrect username or password.');
    }
    if (user.status !== 'active') {
      audit(user, 'login_failed', 'session', null, 'Account is inactive');
      throw new HttpError(401, 'This account is inactive. Ask an admin to reactivate it.');
    }
    user.lastLoginAt = now();
    audit(user, 'login', 'session', null, 'Signed in');
    return {
      accessToken: fakeJwt(user), tokenType: 'bearer',
      userId: user.userId, username: user.username, fullName: user.fullName, role: user.role,
    };
  }],

  // ── password reset by email ──
  ['POST', /^\/auth\/forgot-password$/, (_m, _q, body) => {
    const email = (body.email || '').trim().toLowerCase();
    // Rate limit per email, registered or not, so the limit itself can't tell
    // anyone which emails have accounts.
    const at = Date.now();
    const recent = (db.resetRequests.get(email) || []).filter((t) => at - t < RESET_REQUEST_WINDOW_MS);
    if (recent.length >= RESET_REQUEST_LIMIT) {
      db.resetRequests.set(email, recent);
      throw new HttpError(429, `Too many code requests for this email. Try again in ${mmss(recent[0] + RESET_REQUEST_WINDOW_MS - at)}.`);
    }
    db.resetRequests.set(email, [...recent, at]);

    const user = db.users.find((u) => u.email?.toLowerCase() === email && u.status === 'active');
    if (!user) {
      // No code can match, but wrong guesses are still counted the same way.
      db.resetCodes.set(email, { code: null, userId: null, expiresAt: at + RESET_CODE_SECONDS * 1000, attempts: 0 });
      return { expiresInSeconds: RESET_CODE_SECONDS }; // same answer either way
    }
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
    db.resetCodes.set(email, { code, userId: user.userId, expiresAt: at + RESET_CODE_SECONDS * 1000, attempts: 0 });
    // A real backend emails the code. Demo mode has no mail server, so it hands
    // the code back for the login screen to show.
    return { expiresInSeconds: RESET_CODE_SECONDS, demoCode: code };
  }],
  ['POST', /^\/auth\/verify-reset-code$/, (_m, _q, body) => {
    const email = (body.email || '').trim().toLowerCase();
    const entry = db.resetCodes.get(email);
    if (!entry) throw new HttpError(400, 'That code is incorrect. Check the email and try again.');
    if (Date.now() > entry.expiresAt) throw new HttpError(400, 'That code has expired. Send a new one.');
    if (!entry.code || entry.code !== body.code) {
      entry.attempts += 1;
      if (entry.attempts >= RESET_MAX_WRONG) {
        db.resetCodes.delete(email);
        throw new HttpError(429, 'Too many wrong attempts. This code was cancelled. Request a new code.');
      }
      const left = RESET_MAX_WRONG - entry.attempts;
      throw new HttpError(400, `That code is incorrect. ${left} attempt${left === 1 ? '' : 's'} left.`);
    }
    db.resetCodes.delete(email);
    const token = `reset-${Math.random().toString(36).slice(2)}`;
    db.resetTokens.set(token, entry.userId);
    return { resetToken: token };
  }],
  ['POST', /^\/auth\/reset-password$/, (_m, _q, body) => {
    const userId = db.resetTokens.get(body.resetToken);
    if (!userId) throw new HttpError(400, 'This reset has expired. Start again.');
    db.resetTokens.delete(body.resetToken);
    const user = db.users.find((u) => u.userId === userId);
    audit(user, 'update', 'user', userId, 'Reset own password by email');
    return { ok: true };
  }],

  // ── audit log ──
  ['GET', /^\/audit-logs$/, (_m, q) => {
    const search = (q.search || '').trim().toLowerCase();
    const rows = db.audit.filter((e) => {
      if (q.action && e.action !== q.action) return false;
      if (q.user_id && e.userId !== Number(q.user_id)) return false;
      const day = seed.clinicDay(new Date(`${e.at}Z`));
      if (q.date_from && day < q.date_from) return false;
      if (q.date_to && day > q.date_to) return false;
      return !search || [e.fullName, e.username, e.details, e.entity].some((s) => s && s.toLowerCase().includes(search));
    });
    return page(rows, q);
  }],

  // ── backup and recovery ──
  ['GET', /^\/backups$/, () => db.backups],
  ['POST', /^\/backups$/, () => takeBackup('manual')],
  ['POST', /^\/backups\/(\d+)\/restore$/, (m) => {
    const backup = db.backups.find((b) => b.backupId === Number(m[1]));
    if (!backup) throw new HttpError(404, 'Backup not found');
    takeBackup('manual', 'Safety backup before restore');
    // Backups seeded with the demo have no snapshot; they restore the demo's starting data.
    const records = structuredClone(db.snapshots.get(backup.backupId) || freshRecords());
    for (const key of RECORD_KEYS) db[key] = records[key];
    audit(currentUser, 'restore', 'backup', backup.backupId, `Restored backup ${backup.fileName}`);
    return { ok: true, restoredAt: now() };
  }],

  ['GET', /^\/lookups$/, () => ({
    patientTypes: seed.patientTypes,
    dispositions: seed.dispositions,
    complaints: seed.complaints,
    specialCaseTypes: seed.specialCaseTypes,
    itemCategories: seed.itemCategories,
  })],

  ['GET', /^\/settings$/, () => db.settings],
  ['PATCH', /^\/settings$/, (_m, _q, body) => Object.assign(db.settings, body)],

  ['GET', /^\/insights\/patterns$/, () => seed.patterns],

  // ── visits ──
  ['GET', /^\/visits$/, (_m, q) => {
    const rows = db.visits.filter((v) => matchesVisit(v, q)).map(decorate);
    const dir = q.order === 'asc' ? 1 : -1;
    const key = q.sort_by === 'patient_name' ? (v) => v.patientName.toLowerCase() : (v) => v.startedAt;
    rows.sort((a, b) => (key(a) < key(b) ? -dir : key(a) > key(b) ? dir : 0));
    return page(rows, q);
  }],
  ['POST', /^\/visits$/, (_m, _q, body) => {
    const patient = db.patients.find((p) => p.patientId === Number(body.patientId));
    if (!patient) throw new HttpError(404, 'Patient not found');
    const complaintNames = (body.complaintIds || [])
      .map((id) => seed.complaints.find((c) => c.complaintId === id)?.complaintName)
      .filter(Boolean);
    const visit = decorate({
      visitId: db.nextIds.visit++,
      patientId: patient.patientId,
      chiefComplaint: body.chiefComplaint,
      complaints: complaintNames,
      management: text(body.management),
      treatmentNotes: text(body.treatmentNotes),
      bloodPressure: text(body.bloodPressure),
      temperature: body.temperature ?? null,
      pulseRate: num(body.pulseRate),
      startedAt: now(),
      endedAt: null,
      durationMinutes: null,
      status: 'in_care',
      dispositionId: null,
      dispositionName: null,
      attendingName: 'Santos, Nina',
      createdAt: now(),
      updatedAt: now(),
      medicines: (body.medicines || []).map((m) => ({
        medicineId: m.medicineId, medicineName: findStock('medicine', m.medicineId)?.name, quantityGiven: m.quantityGiven, dosage: m.dosage,
      })),
      supplies: (body.supplies || []).map((s) => ({
        supplyId: s.supplyId, supplyName: findStock('supply', s.supplyId)?.name, quantityUsed: s.quantityUsed,
      })),
    });
    applyDispense(visit);
    db.visits.unshift(visit);
    return visit;
  }],
  ['POST', /^\/visits\/(\d+)\/sign-out$/, (m, _q, body) => {
    const visit = db.visits.find((v) => v.visitId === Number(m[1]));
    if (!visit) throw new HttpError(404, 'Visit not found');
    const ended = new Date();
    visit.endedAt = ended.toISOString().slice(0, 19);
    visit.durationMinutes = Math.max(0, Math.round((ended - new Date(`${visit.startedAt}Z`)) / 60000));
    visit.status = 'completed';
    visit.dispositionId = Number(body.dispositionId);
    visit.dispositionName = seed.dispositions.find((d) => d.dispositionId === visit.dispositionId)?.dispositionName;
    if (body.treatmentNotes) visit.treatmentNotes = body.treatmentNotes;
    visit.updatedAt = now();
    return decorate(visit);
  }],
  ['PATCH', /^\/visits\/(\d+)$/, (m, _q, body) => {
    const visit = db.visits.find((v) => v.visitId === Number(m[1]));
    if (!visit) throw new HttpError(404, 'Visit not found');
    Object.assign(visit, body, { updatedAt: now() });
    if (body.complaintIds) {
      visit.complaints = body.complaintIds
        .map((id) => seed.complaints.find((c) => c.complaintId === id)?.complaintName)
        .filter(Boolean);
    }
    return decorate(visit);
  }],
  ['DELETE', /^\/visits\/(\d+)$/, (m) => {
    const i = db.visits.findIndex((v) => v.visitId === Number(m[1]));
    if (i === -1) throw new HttpError(404, 'Visit not found');
    const removed = decorate(db.visits.splice(i, 1)[0]);
    return { ok: true, ...removed };
  }],

  // ── patients ── (literal /special-cases must precede /:id)
  ['GET', /^\/patients\/special-cases$/, (_m, q) => {
    const wantActive = q.active === undefined ? null : q.active !== 'false';
    const rows = [];
    for (const p of db.patients) {
      for (const c of p.specialCases) {
        if (wantActive !== null && c.active !== wantActive) continue;
        rows.push({
          ...c,
          patientId: p.patientId,
          patientName: p.fullName,
          patientNumber: p.patientNumber,
          patientTypeName: p.patientTypeName,
        });
      }
    }
    return rows.sort((a, b) => (a.flaggedAt < b.flaggedAt ? 1 : -1));
  }],
  ['GET', /^\/patients$/, (_m, q) => {
    const search = (q.search || '').trim().toLowerCase();
    const rows = db.patients
      .filter((p) => !search || [p.fullName, p.patientNumber, p.program, p.department]
        .some((s) => s && s.toLowerCase().includes(search)))
      .map(patientOut);
    return page(rows, q);
  }],
  ['POST', /^\/patients$/, (_m, _q, body) => {
    const type = seed.patientTypes.find((t) => t.patientTypeId === Number(body.patientTypeId));
    const middle = body.middleName ? ` ${body.middleName[0]}.` : '';
    const patient = {
      ...body,
      patientId: db.nextIds.patient++,
      patientTypeName: type?.typeName || 'Student',
      patientNumber: body.patientNumber || `VIS-${new Date().getFullYear()}-${String(db.nextIds.patient).padStart(4, '0')}`,
      fullName: `${body.lastName}, ${body.firstName}${middle}`,
      age: body.dateOfBirth ? new Date().getFullYear() - Number(body.dateOfBirth.slice(0, 4)) : null,
      specialCases: [],
    };
    db.patients.push(patient);
    return patientOut(patient);
  }],
  ['GET', /^\/patients\/(\d+)$/, (m) => {
    const p = db.patients.find((x) => x.patientId === Number(m[1]));
    if (!p) throw new HttpError(404, 'Patient not found');
    return patientOut(p);
  }],
  ['PATCH', /^\/patients\/(\d+)$/, (m, _q, body) => {
    const p = db.patients.find((x) => x.patientId === Number(m[1]));
    if (!p) throw new HttpError(404, 'Patient not found');
    Object.assign(p, body);
    const middle = p.middleName ? ` ${p.middleName[0]}.` : '';
    p.fullName = `${p.lastName}, ${p.firstName}${middle}`;
    return patientOut(p);
  }],
  ['DELETE', /^\/patients\/(\d+)$/, (m) => {
    const i = db.patients.findIndex((x) => x.patientId === Number(m[1]));
    if (i === -1) throw new HttpError(404, 'Patient not found');
    const removed = db.patients.splice(i, 1)[0];
    return { ok: true, ...removed };
  }],
  ['POST', /^\/patients\/(\d+)\/special-cases$/, (m, _q, body) => {
    const p = db.patients.find((x) => x.patientId === Number(m[1]));
    if (!p) throw new HttpError(404, 'Patient not found');
    const type = seed.specialCaseTypes.find((t) => t.specialCaseTypeId === Number(body.specialCaseTypeId));
    const existing = p.specialCases.find((c) => c.caseName === type?.caseName);
    if (existing) {
      // Re-posting an existing flag reactivates it and refreshes the note.
      existing.active = true;
      existing.notes = body.notes ?? existing.notes;
      existing.flaggedAt = now();
      return existing;
    }
    const flag = {
      patientSpecialCaseId: db.nextIds.specialCase++,
      specialCaseTypeId: type?.specialCaseTypeId,
      caseName: type?.caseName || 'Other',
      notes: body.notes ?? null,
      active: true,
      flaggedAt: now(),
      flaggedByName: 'N. Santos',
    };
    p.specialCases.push(flag);
    return flag;
  }],
  ['PATCH', /^\/patients\/(\d+)\/special-cases\/(\d+)$/, (m, _q, body) => {
    const p = db.patients.find((x) => x.patientId === Number(m[1]));
    const flag = p?.specialCases.find((c) => c.patientSpecialCaseId === Number(m[2]));
    if (!flag) throw new HttpError(404, 'Special case not found');
    Object.assign(flag, body);
    return flag;
  }],

  // ── stock ── (literal /requests must precede /:type/:id)
  ['GET', /^\/stock\/requests$/, (_m, q) => {
    const rows = db.requests.filter((r) => !q.status || r.status === q.status);
    return page([...rows].sort((a, b) => (a.requestDate < b.requestDate ? 1 : -1)), q);
  }],
  ['POST', /^\/stock\/requests$/, (_m, _q, body) => {
    const id = db.nextIds.request++;
    const request = {
      requestId: id,
      requestNumber: `REQ-${String(id).padStart(4, '0')}`,
      status: 'pending',
      requestedByName: 'N. Santos',
      requestDate: now(),
      requestedAt: now(),
      approvedByName: null,
      approvedAt: null,
      receivedByName: null,
      remarks: body.remarks ?? null,
      items: (body.items || []).map((i) => {
        const itemId = i.medicineId ?? i.supplyId;
        const item = findStock(i.itemType, itemId);
        return {
          ...i,
          itemId,
          itemName: item?.name || 'Unknown item',
          unit: item?.unit || 'box',
          categoryName: item?.categoryName || null,
          approvedQuantity: null,
        };
      }),
    };
    db.requests.unshift(request);
    return request;
  }],
  ['POST', /^\/stock\/requests\/(\d+)\/approve$/, (m, _q, body) => {
    const r = db.requests.find((x) => x.requestId === Number(m[1]));
    if (!r) throw new HttpError(404, 'Request not found');
    r.status = 'approved';
    r.approvedByName = 'A. Cruz';
    r.approvedAt = now();
    if (body?.adminResponse) r.remarks = body.adminResponse;
    for (const approved of body?.items || []) {
      const id = approved.medicineId ?? approved.supplyId;
      const line = r.items.find((i) => i.itemType === approved.itemType && i.itemId === id);
      if (line) line.approvedQuantity = approved.approvedQuantity;
    }
    for (const line of r.items) line.approvedQuantity ??= line.requestedQuantity;
    return r;
  }],
  ['POST', /^\/stock\/requests\/(\d+)\/deny$/, (m, _q, body) => {
    const r = db.requests.find((x) => x.requestId === Number(m[1]));
    if (!r) throw new HttpError(404, 'Request not found');
    r.status = 'denied';
    r.approvedByName = 'A. Cruz';
    r.approvedAt = now();
    if (body?.adminResponse) r.remarks = body.adminResponse;
    return r;
  }],
  ['POST', /^\/stock\/requests\/(\d+)\/receive$/, (m) => {
    const r = db.requests.find((x) => x.requestId === Number(m[1]));
    if (!r) throw new HttpError(404, 'Request not found');
    r.status = 'completed';
    r.receivedByName = 'N. Santos';
    r.receivedAt = now();
    // Delivery arrived: the approved quantity lands in stock.
    for (const line of r.items) {
      const item = findStock(line.itemType, line.itemId);
      if (item) item.quantity = (Number(item.quantity) + Number(line.approvedQuantity ?? line.requestedQuantity)).toFixed(2);
    }
    return r;
  }],
  ['GET', /^\/stock$/, (_m, q) => {
    const search = (q.search || '').trim().toLowerCase();
    const rows = db.stock
      .map(withStatus)
      .filter((i) => {
        if (q.item_type && i.itemType !== q.item_type) return false;
        if (q.status && i.stockStatus !== q.status) return false;
        if (q.category_id && i.categoryId !== Number(q.category_id)) return false;
        return !search || [i.name, i.categoryName].some((s) => s && s.toLowerCase().includes(search));
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return page(rows, q);
  }],
  ['POST', /^\/stock$/, (_m, _q, body) => {
    const itemType = body.itemType === 'supply' ? 'supply' : 'medicine';
    const itemId = Math.max(0, ...db.stock.filter((s) => s.itemType === itemType).map((s) => s.itemId)) + 1;
    const item = {
      itemType,
      itemId,
      name: body.name,
      categoryId: body.categoryId ?? null,
      categoryName: seed.itemCategories.find((c) => c.categoryId === Number(body.categoryId))?.categoryName || null,
      unit: body.unit || 'pcs',
      quantity: Number(body.quantity || 0).toFixed(2),
      reorderLevel: Number(body.reorderLevel || 0).toFixed(2),
      expiryDate: body.expiryDate || null,
      updatedByName: 'N. Santos',
    };
    db.stock.push(item);
    return withStatus(item);
  }],
  ['POST', /^\/stock\/(medicine|supply)\/(\d+)\/restock$/, (m, _q, body) => {
    const item = findStock(m[1], m[2]);
    if (!item) throw new HttpError(404, 'Item not found');
    item.quantity = (Number(item.quantity) + Number(body.quantity || 0)).toFixed(2);
    if (body.expiryDate) item.expiryDate = body.expiryDate;
    item.updatedByName = 'N. Santos';
    return withStatus(item);
  }],
  ['POST', /^\/stock\/(medicine|supply)\/(\d+)\/adjust$/, (m, _q, body) => {
    const item = findStock(m[1], m[2]);
    if (!item) throw new HttpError(404, 'Item not found');
    item.quantity = Math.max(0, Number(item.quantity) + Number(body.delta || 0)).toFixed(2);
    item.updatedByName = 'N. Santos';
    return withStatus(item);
  }],
  ['PATCH', /^\/stock\/(medicine|supply)\/(\d+)$/, (m, _q, body) => {
    const item = findStock(m[1], m[2]);
    if (!item) throw new HttpError(404, 'Item not found');
    Object.assign(item, body);
    item.updatedByName = 'N. Santos';
    return withStatus(item);
  }],

  // ── users ──
  ['GET', /^\/users$/, (_m, q) => page(db.users, q)],
  ['POST', /^\/users$/, (_m, _q, body) => {
    if (db.users.some((u) => u.username === body.username)) {
      throw new HttpError(409, 'That username is already taken.');
    }
    const user = {
      ...body,
      userId: db.nextIds.user++,
      fullName: `${body.lastName}, ${body.firstName}`,
      createdAt: now(),
      lastLoginAt: null,
    };
    delete user.password;
    db.users.push(user);
    return user;
  }],
  ['PATCH', /^\/users\/(\d+)$/, (m, _q, body) => {
    const user = db.users.find((u) => u.userId === Number(m[1]));
    if (!user) throw new HttpError(404, 'User not found');
    const { password, ...rest } = body;
    void password;
    Object.assign(user, rest);
    user.fullName = `${user.lastName}, ${user.firstName}`;
    return user;
  }],
];

function takeBackup(kind, details = 'Took a manual backup') {
  const backupId = db.nextIds.backup++;
  const stamp = now().replace(/[-:]/g, '').replace('T', '_').slice(0, 13);
  db.snapshots.set(backupId, structuredClone(Object.fromEntries(RECORD_KEYS.map((k) => [k, db[k]]))));
  const backup = {
    backupId,
    fileName: `isu_infirmary_${stamp}_${kind}.sql.gz`,
    createdAt: now(),
    sizeBytes: 4_800_000 + db.visits.length * 600,
    kind,
    createdByName: currentUser?.fullName || null,
  };
  db.backups.unshift(backup);
  audit(currentUser, 'backup', 'backup', backupId, `${details} (${backup.fileName})`);
  return backup;
}

// What a mutation did, for the audit log. Routes that log for themselves
// (sign-in, password reset, backups) are skipped in handle().
const AUDITED = [
  [/^\/visits\/(\d+)\/sign-out$/, 'update', 'visit', (r) => `Signed out ${r.patientName}: ${r.dispositionName}`],
  [/^\/visits(?:\/(\d+))?$/, null, 'visit', (r, verb) => (r?.patientName ? `${verb} a visit for ${r.patientName}` : `${verb} a visit record`)],
  [/^\/patients\/(\d+)\/special-cases(?:\/(\d+))?$/, null, 'special_case', (r, verb) => `${verb} a special-case flag: ${r?.caseName || ''}`],
  [/^\/patients(?:\/(\d+))?$/, null, 'patient', (r, verb) => `${verb} patient ${r?.fullName || 'record'}`],
  [/^\/stock\/requests\/(\d+)\/(approve|deny|receive)$/, 'update', 'stock_request', (r) => `Restock request ${r.requestNumber} is now ${r.status}`],
  [/^\/stock\/requests$/, 'create', 'stock_request', (r) => `Requested restock ${r.requestNumber} (${r.items.length} items)`],
  [/^\/stock\/(?:medicine|supply)\/(\d+)\/(restock|adjust)$/, 'update', 'stock', (r) => `Updated stock of ${r.name} to ${Number(r.quantity)} ${r.unit}`],
  [/^\/stock(?:\/(?:medicine|supply)\/(\d+))?$/, null, 'stock', (r, verb) => `${verb} stock item ${r?.name || ''}`],
  [/^\/users(?:\/(\d+))?$/, null, 'user', (r, verb) => `${verb} account ${r?.username || ''}`],
  [/^\/settings$/, 'update', 'settings', () => 'Changed system settings'],
];
const VERB = { create: 'Added', update: 'Edited', delete: 'Deleted' };

function auditMutation(method, path, result) {
  for (const [pattern, fixed, entity, describe] of AUDITED) {
    const m = pattern.exec(path);
    if (!m) continue;
    const action = fixed || (method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update');
    const id = result?.visitId ?? result?.patientId ?? result?.requestId ?? result?.userId ?? result?.itemId ?? (m[1] ? Number(m[1]) : null);
    audit(currentUser, action, entity, id, describe(result, VERB[action]));
    return;
  }
}

/**
 * Resolves one API call. `path` is everything after /api, query already parsed,
 * `token` the bearer token (if any). Throws HttpError for anything the real
 * backend would reject.
 */
export function handle(method, path, query, body, token) {
  currentUser = token ? userFromToken(token) : null;
  for (const [verb, pattern, run] of routes) {
    if (verb !== method) continue;
    const match = pattern.exec(path);
    if (match) {
      const result = run(match, query, body);
      if (method !== 'GET' && !/^\/(auth|backups)\b/.test(path)) auditMutation(method, path, result);
      return result;
    }
  }
  throw new HttpError(404, 'Not Found');
}

export { HttpError };
