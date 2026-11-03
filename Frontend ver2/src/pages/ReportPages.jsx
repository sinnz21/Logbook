// Reports / Monthly supply report (see the Reports group in config/navs.js).
// The Analytics and Tables pages are built in config/reportViews.jsx.
import MonthlySupplyReport from '../components/MonthlySupplyReport';

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
