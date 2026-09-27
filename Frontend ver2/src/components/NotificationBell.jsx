import { useApp } from '../context/useApp';
import { useAsync } from '../hooks/useAsync';
import { listStock, listStockRequests } from '../api/stock';
import Icon from './Icon';

// Topbar bell — what needs attention for this role:
//   nurse → items at or below reorder level (click: Stock & supplies)
//   admin → restock requests awaiting approval (click: Stock requests)
// Refetches whenever the view changes, so acting on something clears it.
export default function NotificationBell() {
  const { role, currentView, navigate } = useApp();
  const alerts = useAsync(async () => {
    if (role === 'admin') {
      const res = await listStockRequests({ status: 'pending' });
      return res.items.map((r) => `Restock request: ${r.items.map((i) => i.itemName).join(', ')}`);
    }
    const res = await listStock({ perPage: 200 });
    return res.items
      .filter((i) => i.stockStatus !== 'high')
      .map((i) => `${i.name} is ${i.stockStatus === 'low' ? 'running low' : 'out of stock'}`);
  }, [role, currentView]);

  const list = alerts.data || [];
  return (
    <button
      type="button"
      className="bell"
      title={list.length ? list.join('\n') : 'No alerts'}
      aria-label={`${list.length} alerts`}
      onClick={() => navigate(role === 'admin' ? 'stock-requests' : 'stock')}
    >
      <Icon name="bell" size={21} />
      {list.length > 0 && <span className="count">{list.length > 9 ? '9+' : list.length}</span>}
    </button>
  );
}
