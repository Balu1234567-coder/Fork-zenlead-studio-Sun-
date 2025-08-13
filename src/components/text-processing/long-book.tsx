import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedFeature } from "@/components/ui/locked-feature";
import { ArrowRight } from "lucide-react";
import { TextProcessingState } from "@/pages/TextProcessing";
import { BookContentShimmer } from "@/components/ContentShimmer";
import { ContentGenerationShimmer } from "@/components/UploadShimmer";

const exampleBookContent = (prompt: string) => [
  { heading: "Title", content: `AI-Generated Book: ${prompt}` },
  { heading: "Chapter 1: Introduction", content: "This is a generated introduction about your chosen topic, laying the foundation for the rest of the book." },
  { heading: "Chapter 2: Deep Dive", content: "In this chapter, we'll explore the main concepts of your topic in great detail, with examples and explanations." },
  { heading: "Chapter 3: Case Studies", content: "Here, real-world examples and research findings are shared to deepen your understanding." },
  { heading: "Conclusion", content: "A summary of the book and final insights are presented here." },
];

interface LongBookProps {
  state: TextProcessingState;
  isLocked: boolean;
}

const LongBook = ({ state, isLocked }: LongBookProps) => {
  const { bookPrompt, setBookPrompt, bookContent, setBookContent, isBookLoading, setIsBookLoading } = state;

  const handleGenerateBook = () => {
    setIsBookLoading(true);
    setBookContent(null);
    setTimeout(() => {
      setBookContent(exampleBookContent(bookPrompt));
      setIsBookLoading(false);
    }, 2000);
  };

  return (
    <LockedFeature isLocked={isLocked}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Book Prompt</CardTitle>
            <CardDescription>
              Enter a topic, course, or subject. The model will generate a full book or research paper!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              className="w-full border rounded-md p-3 min-h-[100px] resize-none"
              placeholder="e.g. Advanced AI Course, Full Stack Web Development, Quantum Computing…"
              value={bookPrompt}
              onChange={(e) => setBookPrompt(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleGenerateBook} disabled={!bookPrompt.trim() || isBookLoading} className="w-full">
                {isBookLoading ? (
                  <ContentGenerationShimmer />
                ) : (
                  <>
                    Generate Book
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            You will get a full-length, structured book—great for learning, research, or publishing as a PDF.
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generated Book</CardTitle>
            <CardDescription>
              The generated content will appear here in a readable, scrollable document style.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto border bg-background rounded-md px-4 py-3 shadow-inner">
              {isBookLoading && (
                <BookContentShimmer />
              )}
              {!isBookLoading && bookContent && (
                <div className="space-y-6">
                  {bookContent.map((sec, idx) => (
                    <section key={idx}>
                      <h3 className="font-bold text-lg mb-2">{sec.heading}</h3>
                      <p className="text-base text-gray-700 whitespace-pre-wrap">{sec.content}</p>
                    </section>
                  ))}
                </div>
              )}
              {!isBookLoading && !bookContent && (
                <div className="text-muted-foreground text-sm text-center py-10">
                  No book generated yet. Enter a prompt and start!
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-end space-x-2 pt-2">
            <Button variant="outline" disabled={!bookContent} className="text-xs px-3 py-1">
              Download PDF
            </Button>
          </CardFooter>
        </Card>
      </div>
    </LockedFeature>
  );
};

export default LongBook;
