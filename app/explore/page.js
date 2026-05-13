import { Suspense } from 'react';
import ExploreGrid from '../components/ExploreGrid/ExploreGrid';

export const metadata = { title: '탐색 — Carlog' };

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreGrid />
    </Suspense>
  );
}
