import { Skeleton } from "@/components/ui/skeleton";

export const BookContentShimmer = () => {
  return (
    <div className="space-y-6 py-4">
      {/* Title */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      
      {/* Chapter 1 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
      
      {/* Chapter 2 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
      
      {/* Chapter 3 */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
};

export const ResumeAnalysisShimmer = () => {
  return (
    <div className="space-y-6 py-4">
      {/* Best Practices Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-2 pl-5">
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
      
      {/* Tailored Suggestions Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2 pl-5">
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
      
      {/* General Recommendations Section */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-56" />
        <div className="space-y-2 pl-5">
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex items-start gap-2">
            <Skeleton className="h-2 w-2 rounded-full mt-2 flex-shrink-0" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const AtsScoreShimmer = () => {
  return (
    <div className="space-y-4 py-4">
      {/* Score Title */}
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
      </div>
      
      {/* Score Description */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      {/* Additional metrics shimmer */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
};

export const TextContentShimmer = () => {
  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
};
