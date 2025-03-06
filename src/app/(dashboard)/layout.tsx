import { ProductivityTracker } from '../../components/productivity-tracker';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <ProductivityTracker />
      {children}
    </div>
  );
}
