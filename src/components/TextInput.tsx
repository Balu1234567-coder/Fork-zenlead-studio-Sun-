import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ContentGenerationShimmer } from "@/components/UploadShimmer";

export const TextInput = ({ onSubmit, isLoading }: { onSubmit?: (text: string) => void; isLoading?: boolean }) => {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit?.(text);
    }
  };

  return (
    <Card className="border-2 border-border p-4">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Convert Text to Speech</h3>
          <p className="text-sm text-gray-500">
            Enter your text below and convert it to natural-sounding speech
          </p>
          <Textarea
            placeholder="Type or paste your text here..."
            className="min-h-[200px] resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit} 
              disabled={!text.trim() || isLoading}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <ContentGenerationShimmer />
              ) : (
                "Convert to Speech"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
