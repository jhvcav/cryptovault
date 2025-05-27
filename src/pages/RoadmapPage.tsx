// src/pages/RoadmapPage.tsx
import React from 'react';
import RoadmapVisual from '../components/roadmap/RoadmapVisual';

const RoadmapPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">Feuille de Route</h1>
      <RoadmapVisual />
    </div>
  );
};

export default RoadmapPage;