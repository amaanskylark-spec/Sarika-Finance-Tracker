import PersonDetailClient from "./client-page";

export async function generateStaticParams() {
  return [];
}

export default function Page({ params }: { params: { id: string } }) {
  return <PersonDetailClient params={params} />;
}
