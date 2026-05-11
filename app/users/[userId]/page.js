import UserProfileView from '../../components/UserProfileView/UserProfileView';

export const metadata = { title: '프로필 — Carlog' };

export default async function UserPage({ params }) {
  const { userId } = await params;
  return <UserProfileView userId={Number(userId)} />;
}
