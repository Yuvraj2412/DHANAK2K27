import { redirect } from 'next/navigation';

export default async function WorkshopsDetailRedirectPage({ params }) {
  const { id } = await params;
  redirect(`/workshop/${encodeURIComponent(id)}`);
}
