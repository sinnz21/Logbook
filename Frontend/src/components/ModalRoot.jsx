import { useApp } from '../context/useApp';
import AddPatientModal from './modals/AddPatientModal';
import EditPatientModal from './modals/EditPatientModal';
import CheckoutModal from './modals/CheckoutModal';
import RequestRestockModal from './modals/RequestRestockModal';
import StockItemModal from './modals/StockItemModal';
import SoftDeleteModal from './modals/SoftDeleteModal';
import FlagPatientModal from './modals/FlagPatientModal';
import UserModal from './modals/UserModal';

// Each modal is only mounted while it's the active one (see Modal.jsx), so it
// always renders "open" — no per-modal visibility prop to thread through.
const MODALS = {
  addPatient: AddPatientModal,
  editPatient: EditPatientModal,
  checkout: CheckoutModal,
  requestRestock: RequestRestockModal,
  stockItem: StockItemModal,
  softDelete: SoftDeleteModal,
  flagPatient: FlagPatientModal,
  user: UserModal,
};

export default function ModalRoot() {
  const { modal } = useApp();
  const Active = modal.id && MODALS[modal.id];
  return Active ? <Active /> : null;
}
