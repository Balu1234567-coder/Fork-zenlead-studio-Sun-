import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BaseModel, BaseContentPreset } from "./ai-studio/AIStudioBase";
import { Plus, ArrowRight, Sparkles } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  traditionalModels: BaseModel[];
  contentPresets: BaseContentPreset[];
  onModelSelect: (model: BaseModel) => void;
  onPresetSelect: (preset: BaseContentPreset) => void;
}

export const NewProjectModal = ({
  isOpen,
  onClose,
  title,
  traditionalModels,
  contentPresets,
  onModelSelect,
  onPresetSelect
}: NewProjectModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-6 w-6" />
            Start New Project - {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Processing Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Processing Tools
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {traditionalModels.map((model) => {
                const Icon = model.icon;
                return (
                  <Card
                    key={model.key}
                    className={`cursor-pointer group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] ${model.bgColor} border-2 hover:border-primary/50`}
                    onClick={() => {
                      onModelSelect(model);
                      onClose();
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${model.color} shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm truncate">{model.title}</h4>
                            <Badge variant="secondary" className="text-xs">
                              {model.badge}
                            </Badge>
                          </div>
                          <p className="text-xs text-primary mb-1">{model.titletagline}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {model.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {model.modelkeywords.slice(0, 2).map((keyword, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-green-600 font-medium">
                              {model.sucessrate}% Success
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-3 group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        Start Now
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Content Generation - Only show if presets exist */}
          {contentPresets.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Content Generation
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {contentPresets.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <Card
                        key={preset.id}
                        className={`cursor-pointer group hover:shadow-lg transition-all duration-200 hover:scale-[1.01] ${preset.bgColor} border-2 hover:border-primary/50`}
                        onClick={() => {
                          onPresetSelect(preset);
                          onClose();
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${preset.color} shadow-lg group-hover:scale-110 transition-transform`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-base">{preset.title}</h4>
                                <span className="text-sm text-muted-foreground">{preset.estimatedTime}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {preset.description}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {preset.features.slice(0, 4).map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {preset.features.length > 4 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{preset.features.length - 4} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button className="group-hover:bg-primary group-hover:text-primary-foreground">
                              Start Creating
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
