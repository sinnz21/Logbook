from fastapi import APIRouter

from app.api.routes import auth, visits

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router)
api_router.include_router(visits.router)

# TODO for whoever picks this up next — same pattern as visits.py:
#   patients.py  list / create / update / profile with visit history
#   stock.py     inventory list, restock requisitions, approve / deny / receive
#   users.py     admin-only account management
#   insights.py  complaint frequency, treatment pairings, depletion forecast
#   lookups.py   patient types, complaints, dispositions, case types, categories
