type PartnerInvitePageProps = { params: Promise<{ token: string }> };

export default async function PartnerInvitePage({ params }: PartnerInvitePageProps) {
  const { token } = await params;
  return (
    <main className="page-shell">
      <h1>Partner invitation</h1>
      <p>Partner invitation placeholder for token: {token}</p>
    </main>
  );
}
