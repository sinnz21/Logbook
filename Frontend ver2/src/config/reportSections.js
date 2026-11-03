// The Reports pages, one per chart or table. Drives the sidebar's Analytics
// and Tables sub-menus (config/navs.js), the page list (config/reportViews.jsx)
// and each page's title (pages/Reports.jsx).
//
// `section` is what pages/Reports.jsx renders; `list` sends a Tables page to
// pages/FullLists.jsx (the complete ranked lists) instead.
export const ANALYTICS_SECTIONS = [
  { id: 'analytics-months', section: 'months', label: 'Visits per month', sub: 'How many patients the clinic sees each month' },
  { id: 'analytics-weekday', section: 'weekday', label: 'Visits by day of the week', sub: 'Which days of the week are busiest' },
  { id: 'analytics-hours', section: 'hours', label: 'Busiest hours', sub: 'Arrivals by hour of the day, for planning staff cover' },
  { id: 'analytics-outcomes', section: 'outcomes', label: 'Visit outcomes', sub: 'Where patients went after their visit' },
  { id: 'analytics-complaints', section: 'complaints', label: 'Frequent complaints', sub: 'The illnesses and complaints seen most often' },
  { id: 'analytics-medicines', section: 'medicines', label: 'Top requested medicines', sub: 'Units dispensed per medicine' },
  { id: 'analytics-pairings', section: 'pairings', label: 'Common treatment pairings', sub: 'How often each complaint receives the same treatment' },
  { id: 'analytics-clients', section: 'clients', label: 'Client breakdown', sub: 'Students, faculty, staff and visitors' },
  { id: 'analytics-departments', section: 'departments', label: 'Highest visiting departments', sub: 'Visits per department or college' },
  { id: 'analytics-students', section: 'students', label: 'Student demographics', sub: 'Student visits by gender and year level' },
  { id: 'analytics-staff-ages', section: 'staffAges', label: 'Faculty & staff by age', sub: 'Faculty and staff visits by age group' },
  { id: 'analytics-outbreak', section: 'outbreak', label: 'Outbreak watch', sub: 'Weekly cases of each watched illness against the normal level' },
];

export const TABLE_SECTIONS = [
  { id: 'table-months', section: 'months', label: 'Visits per month' },
  { id: 'table-outcomes', section: 'outcomes', label: 'Visit outcomes' },
  { id: 'list-complaints', list: 'complaints', label: 'Complaints / illnesses' },
  { id: 'list-medicines', list: 'medicines', label: 'Medicines dispensed' },
  { id: 'list-departments', list: 'departments', label: 'Departments' },
  { id: 'table-pairings', section: 'pairings', label: 'Common treatment pairings' },
  { id: 'table-clients', section: 'clients', label: 'Client breakdown' },
  { id: 'table-student-years', section: 'studentYears', label: 'Students by year level' },
  { id: 'table-student-gender', section: 'studentGender', label: 'Students by gender' },
  { id: 'table-staff-ages', section: 'staffAges', label: 'Faculty & staff by age' },
  { id: 'table-outbreak', section: 'outbreak', label: 'Outbreak watch' },
];

const bySection = (list) => Object.fromEntries(list.filter((s) => s.section).map((s) => [s.section, s]));

/** mode ('charts' | 'table') → section → { id, label, sub } */
export const SECTION_INFO = {
  charts: bySection(ANALYTICS_SECTIONS),
  table: bySection(TABLE_SECTIONS),
};
