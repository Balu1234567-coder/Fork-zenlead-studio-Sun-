import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Sparkles, Search, BarChart, Users, BookOpen } from "lucide-react";

const ResearchGeneration = () => {
  const [researchTopic, setResearchTopic] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLength, setSelectedLength] = useState("");
  const [methodology, setMethodology] = useState("");

  const exampleTopics = [
    "Impact of artificial intelligence on healthcare outcomes",
    "Sustainable energy solutions for urban environments", 
    "Social media influence on consumer behavior patterns",
    "Climate change effects on agricultural productivity",
    "Blockchain technology applications in financial services"
  ];

  const researchFields = [
    "Computer Science", "Medicine", "Psychology", "Business", "Engineering",
    "Environmental Science", "Economics", "Education", "Social Sciences", "Biology"
  ];

  const paperTypes = [
    { id: "empirical", label: "Empirical Research", desc: "Data-driven analysis and experiments" },
    { id: "theoretical", label: "Theoretical Paper", desc: "Conceptual framework and theory development" },
    { id: "review", label: "Literature Review", desc: "Comprehensive review of existing research" },
    { id: "case-study", label: "Case Study", desc: "In-depth analysis of specific cases" },
    { id: "meta-analysis", label: "Meta-Analysis", desc: "Statistical analysis of multiple studies" }
  ];

  const paperLengths = [
    { id: "short", label: "Short Paper", pages: "8-12 pages", desc: "Conference paper format" },
    { id: "medium", label: "Standard Paper", pages: "15-25 pages", desc: "Journal article format" },
    { id: "long", label: "Extended Paper", pages: "30-50 pages", desc: "Comprehensive research" },
    { id: "thesis", label: "Thesis/Dissertation", pages: "60+ pages", desc: "Academic thesis format" }
  ];

  const methodologies = [
    "Quantitative", "Qualitative", "Mixed Methods", "Experimental", 
    "Survey", "Interview", "Observational", "Comparative"
  ];

  const sections = [
    { id: "abstract", label: "Abstract", required: true },
    { id: "intro", label: "Introduction", required: true },
    { id: "literature", label: "Literature Review", required: true },
    { id: "methodology", label: "Methodology", required: true },
    { id: "results", label: "Results", required: true },
    { id: "discussion", label: "Discussion", required: true },
    { id: "conclusion", label: "Conclusion", required: true },
    { id: "references", label: "References", required: true },
    { id: "appendix", label: "Appendix", required: false }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <FileCheck className="h-8 w-8" />
          Research Paper Generation
        </h1>
        <p className="text-muted-foreground">Create academic papers with proper structure and citations</p>
      </div>

      {/* Research Topic */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Research Topic & Question
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Define your research question or hypothesis
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: Impact of artificial intelligence on healthcare outcomes..."
            value={researchTopic}
            onChange={(e) => setResearchTopic(e.target.value)}
            className="min-h-24"
          />
          
          <div className="space-y-3">
            <p className="text-sm font-medium">Research topic examples:</p>
            <div className="grid grid-cols-1 gap-2">
              {exampleTopics.map((topic, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setResearchTopic(topic)}
                  className="text-left h-auto p-3 whitespace-normal justify-start"
                >
                  {topic}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field & Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Research Field
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {researchFields.map((field) => (
                <Button
                  key={field}
                  variant={selectedField === field ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedField(field)}
                  className="h-auto p-2 text-xs"
                >
                  {field}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Research Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {paperTypes.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all p-3 ${
                    selectedType === type.id 
                      ? 'ring-2 ring-primary border-primary' 
                      : 'hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedType(type.id)}
                >
                  <div>
                    <h4 className="font-medium text-sm">{type.label}</h4>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Research Methodology
          </CardTitle>
          <p className="text-sm text-muted-foreground">Choose your research approach</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {methodologies.map((method) => (
              <Button
                key={method}
                variant={methodology === method ? "default" : "outline"}
                size="sm"
                onClick={() => setMethodology(method)}
                className="h-auto p-3"
              >
                {method}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paper Length */}
      <Card>
        <CardHeader>
          <CardTitle>Paper Length</CardTitle>
          <p className="text-sm text-muted-foreground">Select the scope and format</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paperLengths.map((length) => (
              <Card
                key={length.id}
                className={`cursor-pointer transition-all ${
                  selectedLength === length.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedLength(length.id)}
              >
                <CardContent className="p-4 text-center space-y-2">
                  <h3 className="font-semibold text-sm">{length.label}</h3>
                  <p className="text-sm text-primary">{length.pages}</p>
                  <p className="text-xs text-muted-foreground">{length.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Paper Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Paper Structure</CardTitle>
          <p className="text-sm text-muted-foreground">Standard academic sections to include</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sections.map((section) => (
              <div key={section.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">{section.label}</span>
                <Badge variant={section.required ? "default" : "secondary"}>
                  {section.required ? "Required" : "Optional"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Citation Style */}
      <Card>
        <CardHeader>
          <CardTitle>Citation Style & Format</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Citation Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">APA</SelectItem>
                <SelectItem value="mla">MLA</SelectItem>
                <SelectItem value="chicago">Chicago</SelectItem>
                <SelectItem value="harvard">Harvard</SelectItem>
                <SelectItem value="ieee">IEEE</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Academic Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="undergraduate">Undergraduate</SelectItem>
                <SelectItem value="graduate">Graduate</SelectItem>
                <SelectItem value="phd">PhD Level</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Target Venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="journal">Academic Journal</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
                <SelectItem value="thesis">Thesis/Dissertation</SelectItem>
                <SelectItem value="preprint">Preprint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button size="lg" className="px-8">
          <FileCheck className="mr-2 h-5 w-5" />
          Generate Research Paper
        </Button>
      </div>
    </div>
  );
};

export default ResearchGeneration;
