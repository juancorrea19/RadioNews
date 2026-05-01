import React from 'react'
import { CategorySection } from './CategorySection.tsx'
import type { CategoryData } from '../data/news'

interface NewsCategoriesGridProps {
  categories: CategoryData[]
}

export const NewsCategoriesGrid: React.FC<NewsCategoriesGridProps> = ({ categories }) => {
  return (
    <div className="w-full divide-y divide-white/5">
      {categories.map((category, index) => (
        <CategorySection
          key={category.slug}
          title={category.title}
          slug={category.slug}
          news={category.news}
          accentColor={category.accentColor}
          layoutIndex={index}
        />
      ))}
    </div>
  )
}

export default NewsCategoriesGrid
