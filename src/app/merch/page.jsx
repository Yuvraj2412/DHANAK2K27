import SimplePageShell from '../components/SimplePageShell';
import MerchSection from '../accommodation/MerchSection';

export const metadata = {
  title: 'Merch | Dhanak IIST',
  description: 'Grab official Dhanak merch — the annual cultural festival at IIST.',
};

export default function MerchPage() {
  return (
    <SimplePageShell
      title="Merch"
      subtitle="Gear up with official Dhanak merchandise."
    >
      <div className="mx-auto max-w-4xl px-5 pb-16 pt-8 text-slate-100">
        <MerchSection />
      </div>
    </SimplePageShell>
  );
}
