import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Sparkles, Building, User, FileText, Palette } from "lucide-react";

const LetterGeneration = () => {
  const [letterPurpose, setLetterPurpose] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedTone, setSelectedTone] = useState("");
  const [recipientInfo, setRecipientInfo] = useState("");
  const [senderInfo, setSenderInfo] = useState("");

  const letterPurposes = [
    "Job application and cover letter",
    "Business proposal or partnership inquiry", 
    "Complaint or customer service issue",
    "Thank you letter or appreciation",
    "Resignation letter",
    "Recommendation letter",
    "Follow-up after meeting or interview",
    "Request for information or assistance"
  ];

  const letterTypes = [
    { id: "business", label: "Business Letter", desc: "Professional correspondence", icon: Building },
    { id: "personal", label: "Personal Letter", desc: "Informal personal communication", icon: User },
    { id: "formal", label: "Formal Letter", desc: "Official or legal correspondence", icon: FileText },
    { id: "cover", label: "Cover Letter", desc: "Job application letter", icon: Mail }
  ];

  const tones = [
    { id: "professional", label: "Professional", desc: "Formal business tone" },
    { id: "friendly", label: "Friendly", desc: "Warm and approachable" },
    { id: "formal", label: "Formal", desc: "Official and respectful" },
    { id: "persuasive", label: "Persuasive", desc: "Convincing and compelling" },
    { id: "apologetic", label: "Apologetic", desc: "Remorseful and understanding" },
    { id: "enthusiastic", label: "Enthusiastic", desc: "Energetic and positive" }
  ];

  const templates = [
    { id: "modern", label: "Modern", preview: "Clean, minimalist design" },
    { id: "classic", label: "Classic", preview: "Traditional business format" },
    { id: "creative", label: "Creative", preview: "Stylish with subtle design elements" },
    { id: "simple", label: "Simple", preview: "Plain text, no formatting" }
  ];

  const letterFeatures = [
    { id: "letterhead", label: "Company Letterhead", desc: "Include logo and company info" },
    { id: "signature", label: "Digital Signature", desc: "Add signature block" },
    { id: "date", label: "Date Formatting", desc: "Proper date placement" },
    { id: "address", label: "Address Block", desc: "Sender and recipient addresses" },
    { id: "subject", label: "Subject Line", desc: "Clear subject reference" },
    { id: "enclosures", label: "Enclosure Notice", desc: "List attached documents" }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mail className="h-8 w-8" />
          Professional Letter Generation
        </h1>
        <p className="text-muted-foreground">Create formal and informal letters with custom branding and formatting</p>
      </div>

      {/* Letter Purpose */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            What's the purpose of your letter?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe what you want to communicate
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: I want to write a cover letter for a software engineer position at a tech startup..."
            value={letterPurpose}
            onChange={(e) => setLetterPurpose(e.target.value)}
            className="min-h-24"
          />
          
          <div className="space-y-3">
            <p className="text-sm font-medium">Common letter purposes:</p>
            <div className="grid grid-cols-1 gap-2">
              {letterPurposes.map((purpose, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setLetterPurpose(purpose)}
                  className="text-left h-auto p-3 whitespace-normal justify-start"
                >
                  {purpose}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Letter Type */}
      <Card>
        <CardHeader>
          <CardTitle>Letter Type</CardTitle>
          <p className="text-sm text-muted-foreground">Choose the appropriate format</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {letterTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all ${
                  selectedType === type.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => setSelectedType(type.id)}
              >
                <CardContent className="p-4 text-center space-y-3">
                  <type.icon className="h-8 w-8 mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold text-sm">{type.label}</h3>
                    <p className="text-xs text-muted-foreground">{type.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sender & Recipient Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sender Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Your Name" />
            <Input placeholder="Job Title" />
            <Input placeholder="Company/Organization" />
            <Input placeholder="Email Address" />
            <Input placeholder="Phone Number" />
            <Textarea placeholder="Address" className="min-h-20" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Recipient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Recipient Name" />
            <Input placeholder="Title/Position" />
            <Input placeholder="Company/Organization" />
            <Input placeholder="Email Address" />
            <Textarea placeholder="Address" className="min-h-20" />
            <Input placeholder="Reference/Subject Line" />
          </CardContent>
        </Card>
      </div>

      {/* Tone & Style */}
      <Card>
        <CardHeader>
          <CardTitle>Tone & Style</CardTitle>
          <p className="text-sm text-muted-foreground">Set the communication style</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tones.map((tone) => (
              <Card
                key={tone.id}
                className={`cursor-pointer transition-all p-4 ${
                  selectedTone === tone.id 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'hover:shadow-sm'
                }`}
                onClick={() => setSelectedTone(tone.id)}
              >
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-sm">{tone.label}</h3>
                  <p className="text-xs text-muted-foreground">{tone.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Template Design
          </CardTitle>
          <p className="text-sm text-muted-foreground">Choose visual formatting</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-md transition-all">
                <CardContent className="p-4 text-center space-y-3">
                  <div className="h-16 bg-gradient-to-br from-muted to-muted-foreground/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{template.label}</h3>
                    <p className="text-xs text-muted-foreground">{template.preview}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Letter Features */}
      <Card>
        <CardHeader>
          <CardTitle>Letter Features</CardTitle>
          <p className="text-sm text-muted-foreground">Customize letter components</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {letterFeatures.map((feature) => (
              <div key={feature.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <input type="checkbox" className="mt-1" defaultChecked />
                <div>
                  <h4 className="font-medium text-sm">{feature.label}</h4>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Instructions</CardTitle>
          <p className="text-sm text-muted-foreground">Any specific requirements or details</p>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="Add any specific instructions, key points to include, or special formatting requirements..."
            className="min-h-20"
          />
        </CardContent>
      </Card>

      {/* Generate Button */}
      <div className="flex justify-center">
        <Button size="lg" className="px-8">
          <Mail className="mr-2 h-5 w-5" />
          Generate Letter
        </Button>
      </div>
    </div>
  );
};

export default LetterGeneration;
