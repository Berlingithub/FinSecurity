interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export default function SkeletonCard({ lines = 3, className = "" }: SkeletonCardProps) {
  return (
    <div className={`p-6 border rounded-lg space-y-3 ${className}`}>
      <div className="skeleton h-5 w-3/4"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton h-4 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`}></div>
      ))}
      <div className="flex space-x-2 pt-2">
        <div className="skeleton h-8 w-20"></div>
        <div className="skeleton h-8 w-16"></div>
      </div>
    </div>
  );
}