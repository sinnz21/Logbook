// view id → page for every Reports page (see config/reportSections.js). Both
// roles get the same Reports menu, so App.jsx spreads this into each.
import Reports from '../pages/Reports';
import FullLists from '../pages/FullLists';
import { SupplyReportPage } from '../pages/ReportPages';
import { ANALYTICS_SECTIONS, TABLE_SECTIONS } from './reportSections';

const chartsPage = (section) => () => <Reports mode="charts" section={section} />;
const tablePage = (s) => (s.list ? () => <FullLists tab={s.list} /> : () => <Reports mode="table" section={s.section} />);

export const REPORT_VIEWS = {
  ...Object.fromEntries(ANALYTICS_SECTIONS.map((s) => [s.id, chartsPage(s.section)])),
  ...Object.fromEntries(TABLE_SECTIONS.map((s) => [s.id, tablePage(s)])),
  'supply-report': SupplyReportPage,
};
