import React from 'react';
import { BookOpen, Calendar, Users } from 'lucide-react';

type ResourceType = 'book' | 'coaching' | 'workshop';

interface Resource {
  title: string;
  subtitle: string;
  category: string;
  date: string;
  type: ResourceType;
}

interface ResourceRecommendationsProps {
  resources?: Resource[];
}

const DEFAULT_RESOURCES: Resource[] = [
  {
    title: 'The First 90 Days',
    subtitle: 'Michael Watkins',
    category: 'Book',
    date: 'Recommended',
    type: 'book',
  },
  {
    title: 'Executive Coaching Session #5',
    subtitle: 'Coaching',
    category: '1:1 Coaching',
    date: 'Jul 15',
    type: 'coaching',
  },
  {
    title: 'Board Readiness Workshop',
    subtitle: 'Workshop',
    category: 'Leadership Workshop',
    date: 'Aug 20',
    type: 'workshop',
  },
];

export function ResourceRecommendations({
  resources = DEFAULT_RESOURCES,
}: ResourceRecommendationsProps) {
  const getIcon = (type: ResourceType) => {
    switch (type) {
      case 'book':
        return <BookOpen className="w-4 h-4 text-accent shrink-0" />;
      case 'coaching':
        return <Calendar className="w-4 h-4 text-teal shrink-0" />;
      case 'workshop':
        return <Users className="w-4 h-4 text-ocean shrink-0" />;
    }
  };

  return (
    <div className="bg-bg-primary border border-bg-tertiary p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-accent" />
        <h3 className="font-serif text-lg font-bold text-text-primary">
          RECOMMENDED RESOURCES
        </h3>
      </div>

      <div className="space-y-0">
        {resources.map((resource, index) => (
          <div
            key={`${resource.title}-${index}`}
            className="flex items-start gap-3 py-3 border-b border-bg-tertiary last:border-b-0"
          >
            <div className="mt-0.5">{getIcon(resource.type)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary">{resource.title}</div>
              <div className="text-xs text-text-muted">{resource.subtitle}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-text-secondary font-medium">{resource.date}</div>
              <div className="text-xs text-text-muted">{resource.category}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
