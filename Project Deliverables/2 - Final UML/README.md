# Final UML

All diagrams were drawn from the final code (commit d0090cf), not from the early plan.
Open `ISU_Infirmary_UML_Diagrams.pdf` to see all of them with a short explanation each.

| # | Diagram | Files |
|---|---|---|
| 1 | Use case | `1_Use_Case_Diagram.png` / `.svg` |
| 2 | Class (22 database tables + surveillance model) | `2_Class_Diagram.png` / `.svg` |
| 3 | Activity — recording a patient visit | `3_Activity_Diagram_Record_Visit.png` / `.svg` |
| 4 | Activity — restock requisition | `4_Activity_Diagram_Restock_Requisition.png` / `.svg` |
| 5 | Sequence — saving a visit with medicine | `5_Sequence_Diagram_Save_Visit.png` / `.svg` |
| 6 | Sequence — outbreak alert on the nurse dashboard | `6_Sequence_Diagram_Outbreak_Alert.png` / `.svg` |
| 7 | Deployment | `7_Deployment_Diagram.png` / `.svg`, explanation in `7_Deployment_Diagram_Explanation.docx` |

`source/` has the editable sources: PlantUML (`.puml`), the draw.io file for the deployment diagram
(open at app.diagrams.net), and `make_usecase.py`, which draws the use case diagram.
