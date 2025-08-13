import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const UploadButtonShimmer = () => {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md">
      <Skeleton className="h-4 w-4 rounded-full" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
};

export const DocumentUploadShimmer = () => {
  return (
    <Card className="border-2 border-border p-4">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <Skeleton className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-36 mx-auto" />
              <Skeleton className="h-3 w-44 mx-auto" />
            </div>
            <UploadButtonShimmer />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const AudioUploadShimmer = () => {
  return (
    <Card className="border-2 border-border p-4">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <Skeleton className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-36 mx-auto" />
              <Skeleton className="h-3 w-40 mx-auto" />
            </div>
            <UploadButtonShimmer />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ContentGenerationShimmer = () => {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2">
      <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
};
