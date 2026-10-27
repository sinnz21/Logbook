// The three Reports sub-menu pages (see the Reports group in config/navs.js).
import Reports from './Reports';
import MonthlySupplyReport from '../components/MonthlySupplyReport';

export function AnalyticsPage() {
  return <Reports mode="charts" />;
}

export function ReportTablesPage() {
  return <Reports mode="table" />;
}

export function SupplyReportPage() {
  return (
    <div className="view active">
      <div className="page-head">
        <div>
          <h1>Monthly supply report</h1>
          <div className="sub">Beginning stock, received, issued and ending stock for each medicine and supply</div>
        </div>
      </div>
      <MonthlySupplyReport />
    </div>
  );
}
