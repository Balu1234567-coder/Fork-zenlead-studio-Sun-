import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ModelCardSkeleton = () => {
  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 animate-pulse">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Icon skeleton */}
          <div className="p-2 lg:p-3 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
            <Skeleton className="h-4 w-4 lg:h-5 lg:w-5" />
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
        
        {/* Title and tagline */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
        
        {/* Bottom section */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
};

export const ContentPresetSkeleton = () => {
  return (
    <Card className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 animate-pulse">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          {/* Icon skeleton */}
          <div className="p-2 lg:p-3 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600">
            <Skeleton className="h-5 w-5 lg:h-6 lg:w-6" />
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        
        {/* Features section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
        
        <Skeleton className="w-full h-9 mt-4" />
      </CardContent>
    </Card>
  );
};

export const ProjectCardSkeleton = () => {
  return (
    <Card className="cursor-pointer hover:bg-muted/50 transition-colors animate-pulse">
      <CardContent className="p-3 lg:p-4">
        <div className="flex items-start gap-3">
          {/* Icon skeleton */}
          <div className="p-2 rounded-lg bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex-shrink-0">
            <Skeleton className="h-3 w-3 lg:h-4 lg:w-4" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Grid of skeleton cards
export const ModelGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ModelCardSkeleton key={index} />
      ))}
    </div>
  );
};

export const ContentGridSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ContentPresetSkeleton key={index} />
      ))}
    </div>
  );
};

export const ProjectListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
};
