import FollowListView from '../../components/FollowListView/FollowListView';

export const metadata = { title: '팔로워/팔로잉 — Carlog' };

export default async function FollowPage({ searchParams }) {
  const params = await searchParams;
  const tab = params?.tab === 'followings' ? 'followings' : 'followers';
  return <FollowListView initialTab={tab} userId={1} />;
}
