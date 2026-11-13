# Evidence Screenshots

Full system test of the final code (commit d0090cf) with the 1-year demo data
(`BackendAndDatabase/test_data/isu_infirmary_demo_data_1year.sql`: 3,000 patients, 8,901 visits), Nov 8, 2026.
Every page and main action was used as a Nurse and as an Administrator; no page showed an error.

Also dry-run on the team laptop (Nov 8, 2026): visit with medicine saved and signed out (stock 779 → 777),
delivery confirmed (stock → 1,977), request approved with an edited quantity (1,000 → 800), all 24 report pages,
backup, Export .SQL, trash restore, and maintenance mode on/off.

| Screenshot | What it shows |
|---|---|
| [01_login.png](01_login.png) | Sign-in screen |
| [02_login_show_password.png](02_login_show_password.png) | Show-password toggle |
| [03_nurse_dashboard.png](03_nurse_dashboard.png) | Nurse dashboard with one year of data |
| [04_nurse_outbreak_banner.png](04_nurse_outbreak_banner.png) | Outbreak alert: "Possible outbreak: Viral Flu in CCSICT – 18 cases this week" |
| [05_nurse_records_filtered_by_complaint.png](05_nurse_records_filtered_by_complaint.png) | Dashboard → click a complaint → Patient records filtered |
| [06_nurse_records_referred_today.png](06_nurse_records_referred_today.png) | Dashboard → Referred today → filtered records |
| [07_nurse_patient_records.png](07_nurse_patient_records.png) | Patient records with today's queue |
| [08_nurse_add_visit_empty.png](08_nurse_add_visit_empty.png) | Add visit record (empty) |
| [09_nurse_add_visit_filled.png](09_nurse_add_visit_filled.png) | Add visit record (filled, saved) |
| [10_nurse_patient_profile.png](10_nurse_patient_profile.png) | Patient profile and visit history |
| [11_nurse_priority.png](11_nurse_priority.png) | Priority & special cases (150 flagged) |
| [12_nurse_search.png](12_nurse_search.png) | Search & history |
| [13_nurse_stock.png](13_nurse_stock.png) | Stock & supplies (53 items) |
| [14_nurse_flag_patient_modal.png](14_nurse_flag_patient_modal.png) | Flag a patient dialog |
| [15_nurse_analytics_visits-per-month.png](15_nurse_analytics_visits-per-month.png) | Reports → Analytics → Visits per month |
| [16_nurse_analytics_visits-by-day-of-the-week.png](16_nurse_analytics_visits-by-day-of-the-week.png) | Reports → Analytics → Visits by day of the week |
| [17_nurse_analytics_busiest-hours.png](17_nurse_analytics_busiest-hours.png) | Reports → Analytics → Busiest hours |
| [18_nurse_analytics_visit-outcomes.png](18_nurse_analytics_visit-outcomes.png) | Reports → Analytics → Visit outcomes |
| [19_nurse_analytics_frequent-complaints.png](19_nurse_analytics_frequent-complaints.png) | Reports → Analytics → Frequent complaints |
| [20_nurse_analytics_top-requested-medicines.png](20_nurse_analytics_top-requested-medicines.png) | Reports → Analytics → Top requested medicines |
| [21_nurse_analytics_common-treatment-pairings.png](21_nurse_analytics_common-treatment-pairings.png) | Reports → Analytics → Common treatment pairings |
| [22_nurse_analytics_client-breakdown.png](22_nurse_analytics_client-breakdown.png) | Reports → Analytics → Client breakdown |
| [23_nurse_analytics_highest-visiting-departments.png](23_nurse_analytics_highest-visiting-departments.png) | Reports → Analytics → Highest visiting departments |
| [24_nurse_analytics_student-demographics.png](24_nurse_analytics_student-demographics.png) | Reports → Analytics → Student demographics |
| [25_nurse_analytics_faculty-staff-by-age.png](25_nurse_analytics_faculty-staff-by-age.png) | Reports → Analytics → Faculty staff by age |
| [26_nurse_analytics_outbreak-watch.png](26_nurse_analytics_outbreak-watch.png) | Reports → Analytics → Outbreak watch |
| [27_nurse_tables_visits-per-month.png](27_nurse_tables_visits-per-month.png) | Reports → Tables → Visits per month |
| [28_nurse_tables_visit-outcomes.png](28_nurse_tables_visit-outcomes.png) | Reports → Tables → Visit outcomes |
| [29_nurse_tables_complaints-illnesses.png](29_nurse_tables_complaints-illnesses.png) | Reports → Tables → Complaints illnesses |
| [30_nurse_tables_medicines-dispensed.png](30_nurse_tables_medicines-dispensed.png) | Reports → Tables → Medicines dispensed |
| [31_nurse_tables_departments.png](31_nurse_tables_departments.png) | Reports → Tables → Departments |
| [32_nurse_tables_common-treatment-pairings.png](32_nurse_tables_common-treatment-pairings.png) | Reports → Tables → Common treatment pairings |
| [33_nurse_tables_client-breakdown.png](33_nurse_tables_client-breakdown.png) | Reports → Tables → Client breakdown |
| [34_nurse_tables_students-by-year-level.png](34_nurse_tables_students-by-year-level.png) | Reports → Tables → Students by year level |
| [35_nurse_tables_students-by-gender.png](35_nurse_tables_students-by-gender.png) | Reports → Tables → Students by gender |
| [36_nurse_tables_faculty-staff-by-age.png](36_nurse_tables_faculty-staff-by-age.png) | Reports → Tables → Faculty staff by age |
| [37_nurse_tables_outbreak-watch.png](37_nurse_tables_outbreak-watch.png) | Reports → Tables → Outbreak watch |
| [38_nurse_monthly_supply_report.png](38_nurse_monthly_supply_report.png) | Monthly supply report |
| [39_admin_dashboard.png](39_admin_dashboard.png) | Admin dashboard |
| [40_admin_stock.png](40_admin_stock.png) | Admin → Stock requests |
| [41_admin_user.png](41_admin_user.png) | User management |
| [42_admin_audit.png](42_admin_audit.png) | Audit log |
| [43_admin_settings.png](43_admin_settings.png) | System settings |
| [44_admin_add_user_weak_password.png](44_admin_add_user_weak_password.png) | Add user — weak password fails the rules |
| [45_admin_add_user_strong_password.png](45_admin_add_user_strong_password.png) | Add user — password meets the rules |
| [46_admin_stock_requests_pending.png](46_admin_stock_requests_pending.png) | Pending restock request |
| [47_admin_stock_request_editing.png](47_admin_stock_request_editing.png) | Admin changes an approved quantity |
| [48_admin_stock_request_approved.png](48_admin_stock_request_approved.png) | Request approved |
| [49_nurse_stock_before_delivery.png](49_nurse_stock_before_delivery.png) | Nurse sees the approved delivery |
| [50_nurse_stock_after_delivery.png](50_nurse_stock_after_delivery.png) | After Confirm delivery — stock added |
| [51_nurse_request_restock_modal.png](51_nurse_request_restock_modal.png) | Create restock requisition dialog |
| [52_admin_analytics_outbreak-watch.png](52_admin_analytics_outbreak-watch.png) | Admin → Analytics → Outbreak watch |
| [53_admin_tables_departments.png](53_admin_tables_departments.png) | Admin → Tables → Departments |
| [54_admin_trash.png](54_admin_trash.png) | Trash (4 deleted records) |
| [55_admin_trash_after_restore.png](55_admin_trash_after_restore.png) | Trash after restoring one record |
| [56_admin_maintenance_on.png](56_admin_maintenance_on.png) | Maintenance mode switched on |
| [57_nurse_blocked_by_maintenance.png](57_nurse_blocked_by_maintenance.png) | Nurse sign-in blocked during maintenance |
| [58_login_inactive_account.png](58_login_inactive_account.png) | Inactive account cannot sign in |
| [59_login_wrong_password.png](59_login_wrong_password.png) | Wrong password refused |
| [60_forgot_1_email.png](60_forgot_1_email.png) | Forgot password — enter email |
| [61_forgot_2_wrong_code.png](61_forgot_2_wrong_code.png) | Wrong code: "4 attempts left" |
| [62_forgot_3_password_rules.png](62_forgot_3_password_rules.png) | New password — rules checklist |
| [63_forgot_4_rules_met.png](63_forgot_4_rules_met.png) | New password meets all rules |
| [64_forgot_5_done.png](64_forgot_5_done.png) | Password changed; signs in with the new password |
