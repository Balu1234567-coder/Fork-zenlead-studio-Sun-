import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight } from "lucide-react";
import { apiService } from "@/lib/apiService";
import { useToast } from "@/hooks/use-toast";

interface FieldConfig {
  type: string;
  label: string;
  description: string;
  required: boolean;
  placeholder?: string;
  default?: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  validation?: {
    min_length?: number;
    max_length?: number;
  };
}

interface SectionConfig {
  title: string;
  fields: string[];
  collapsible: boolean;
}

interface ModelSettings {
  model_slug: string;
  model_name: string;
  version: string;
  settings_schema: Record<string, any>;
  ui_layout: {
    sections: SectionConfig[];
  };
  pricing: {
    credits_per_use: number;
    premium_credits: number;
  };
  estimated_time: string;
}

interface DynamicFormGeneratorProps {
  modelSlug: string;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

const DynamicFormGenerator: React.FC<DynamicFormGeneratorProps> = ({
  modelSlug,
  onSubmit,
  isLoading = false,
  submitButtonText = "Generate"
}) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ModelSettings | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    loadModelSettings();
  }, [modelSlug]);

  const loadModelSettings = async () => {
    try {
      setLoadingSettings(true);
      console.log(`🔧 Loading settings for model: ${modelSlug}`);
      const response = await apiService.getModelSettings(modelSlug);
      
      if (response.success && response.data) {
        setSettings(response.data);
        initializeFormData(response.data);
        initializeExpandedSections(response.data.ui_layout.sections);
        console.log('⚙️ Settings loaded:', response.data);
      } else {
        throw new Error(response.message || 'Failed to load settings');
      }
    } catch (error: any) {
      console.error('❌ Failed to load model settings:', error);
      toast({
        title: "Error",
        description: `Failed to load settings for ${modelSlug}: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  const initializeFormData = (settings: ModelSettings) => {
    const initialData: Record<string, any> = {};
    const flattenedSchema = flattenSchema(settings.settings_schema);
    
    Object.entries(flattenedSchema).forEach(([path, config]) => {
      if (config.default !== undefined) {
        setNestedValue(initialData, path, config.default);
      }
    });
    
    setFormData(initialData);
  };

  const initializeExpandedSections = (sections: SectionConfig[]) => {
    const expanded: Record<string, boolean> = {};
    sections.forEach(section => {
      expanded[section.title] = !section.collapsible; // Auto-expand non-collapsible sections
    });
    setExpandedSections(expanded);
  };

  const flattenSchema = (schema: Record<string, any>, prefix = ''): Record<string, FieldConfig> => {
    const flattened: Record<string, FieldConfig> = {};
    
    Object.entries(schema).forEach(([key, value]) => {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && 'type' in value) {
        // This is a field definition
        flattened[currentPath] = value as FieldConfig;
      } else if (value && typeof value === 'object') {
        // This is a nested group, recurse
        Object.assign(flattened, flattenSchema(value, currentPath));
      }
    });
    
    return flattened;
  };

  const getNestedValue = (obj: Record<string, any>, path: string): any => {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  };

  const setNestedValue = (obj: Record<string, any>, path: string, value: any) => {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  };

  const updateFormData = (path: string, value: any) => {
    const newFormData = { ...formData };
    setNestedValue(newFormData, path, value);
    setFormData(newFormData);
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const renderField = (path: string, config: FieldConfig) => {
    const value = getNestedValue(formData, path);
    const fieldId = path.replace(/\./g, '_');

    switch (config.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => updateFormData(path, e.target.value)}
              placeholder={config.placeholder}
            />
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value || ''}
              onChange={(e) => updateFormData(path, e.target.value)}
              placeholder={config.placeholder}
              className="min-h-20"
            />
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {config.label} {config.required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(newValue) => updateFormData(path, newValue)}>
              <SelectTrigger>
                <SelectValue placeholder={config.placeholder || `Select ${config.label}`} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={fieldId}>
                {config.label} {config.required && <span className="text-red-500">*</span>}
              </Label>
              {config.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
            </div>
            <Switch
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => updateFormData(path, checked)}
            />
          </div>
        );

      case 'range':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId}>
              {config.label} ({value || config.default || config.min || 0})
              {config.required && <span className="text-red-500">*</span>}
            </Label>
            <input
              id={fieldId}
              type="range"
              min={config.min}
              max={config.max}
              step={config.step || 1}
              value={value || config.default || config.min || 0}
              onChange={(e) => updateFormData(path, parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{config.min}</span>
              <span>{config.max}</span>
            </div>
            {config.description && (
              <p className="text-xs text-muted-foreground">{config.description}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>Unknown field type: {config.type}</Label>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </div>
        );
    }
  };

  const handleSubmit = async () => {
    if (!settings) return;

    try {
      // Check user credits first
      console.log('💰 Checking user credits...');

      // For now, we'll proceed with validation and let the backend handle credit checking
      // The backend will return appropriate error messages if credits are insufficient

      // Validate input before submitting
      console.log('🔍 Validating form data:', formData);
      const validationResponse = await apiService.validateUserInput(modelSlug, formData);

      if (validationResponse.success && validationResponse.data.valid) {
        await onSubmit(validationResponse.data.validated_data);
      } else {
        const errors = validationResponse.data?.errors || ['Validation failed'];
        toast({
          title: "Validation Error",
          description: errors.join(', '),
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive"
      });
    }
  };

  if (loadingSettings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading model settings...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Failed to load settings for {modelSlug}</p>
            <Button onClick={loadModelSettings} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const flattenedSchema = flattenSchema(settings.settings_schema);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">{settings.model_name}</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span>{settings.pricing.credits_per_use} Credits</span>
          <span>{settings.estimated_time}</span>
          <span>v{settings.version}</span>
        </div>
      </div>

      {/* Dynamic Form Sections */}
      {settings.ui_layout.sections.map((section) => (
        <Card key={section.title}>
          <CardHeader>
            {section.collapsible ? (
              <div 
                className="flex items-center cursor-pointer"
                onClick={() => toggleSection(section.title)}
              >
                {expandedSections[section.title] ? (
                  <ChevronDown className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2" />
                )}
                <CardTitle>{section.title}</CardTitle>
              </div>
            ) : (
              <CardTitle>{section.title}</CardTitle>
            )}
          </CardHeader>
          
          {(!section.collapsible || expandedSections[section.title]) && (
            <CardContent className="space-y-4">
              {section.fields.map((fieldPath) => {
                const fieldConfig = flattenedSchema[fieldPath];
                if (!fieldConfig) {
                  console.warn(`Field config not found for: ${fieldPath}`);
                  return null;
                }
                return (
                  <div key={fieldPath}>
                    {renderField(fieldPath, fieldConfig)}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      ))}

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button 
          size="lg" 
          className="px-8"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </div>
  );
};

export default DynamicFormGenerator;
