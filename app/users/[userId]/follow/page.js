import FollowListView from '../../../components/FollowListView/FollowListView';

export const metadata = { title: '팔로워/팔로잉 — Carlog' };

export default async function UserFollowPage({ params, searchParams }) {
  const { userId } = await params;
  const sp = await searchParams;
  const tab = sp?.tab === 'followings' ? 'followings' : 'followers';
  return <FollowListView initialTab={tab} userId={Number(userId)} />;
}
