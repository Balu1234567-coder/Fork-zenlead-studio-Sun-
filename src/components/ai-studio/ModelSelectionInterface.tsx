import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap, Target, ArrowRight, Clock } from "lucide-react";
import { BaseModel, BaseContentPreset } from "./AIStudioBase";
import { ModelGridSkeleton, ContentGridSkeleton } from "@/components/ModelCardSkeleton";
import { useNavigate } from "react-router-dom";

interface ModelSelectionInterfaceProps {
  title: string;
  subtitle: string;
  traditionalModels: BaseModel[];
  contentPresets: BaseContentPreset[];
  basePath: string; // e.g., "/text" or "/audio"
  loading?: boolean;
}

export const ModelSelectionInterface = ({
  title,
  subtitle,
  traditionalModels,
  contentPresets,
  basePath,
  loading = false
}: ModelSelectionInterfaceProps) => {
  const navigate = useNavigate();

  const handleModelSelect = (model: BaseModel) => {
    navigate(`${basePath}${model.path}`);
  };

  const handlePresetSelect = (preset: BaseContentPreset) => {
    navigate(`${basePath}${preset.path}`);
  };

  return (
    <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 lg:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-base lg:text-xl text-muted-foreground mb-6 lg:mb-8">
            {subtitle}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Processing Tools</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-600">{traditionalModels.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-green-500/20">
              <CardContent className="p-4 text-center">
                <Zap className="h-6 w-6 lg:h-8 lg:w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Content Types</p>
                <p className="text-xl lg:text-2xl font-bold text-green-600">{contentPresets.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Avg Success Rate</p>
                <p className="text-xl lg:text-2xl font-bold text-purple-600">
                  {Math.round(traditionalModels.reduce((acc, model) => acc + model.sucessrate, 0) / traditionalModels.length)}%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Traditional Processing Tools */}
        <div className="mb-8 lg:mb-12">
          <h2 className="text-xl lg:text-2xl font-bold mb-6">Processing Tools</h2>
          {loading ? (
            <ModelGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {traditionalModels.map((model) => {
                const Icon = model.icon;
                return (
                  <Card
                    key={model.key}
                    className={`cursor-pointer group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${model.bgColor} border-2 hover:border-primary/50`}
                    onClick={() => handleModelSelect(model)}
                  >
                    <CardContent className="p-4 lg:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 lg:p-3 rounded-xl bg-gradient-to-r ${model.color} shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4 lg:h-5 lg:w-5 text-white" />
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="text-xs mb-1">
                            {model.badge}
                          </Badge>
                          <p className="text-xs text-primary font-medium">{model.sucessrate}% Success</p>
                        </div>
                      </div>

                      <h3 className="font-semibold text-base lg:text-lg mb-1">{model.title}</h3>
                      <p className="text-sm text-primary mb-2">{model.titletagline}</p>
                      <p className="text-muted-foreground text-xs lg:text-sm mb-4 leading-relaxed line-clamp-3">
                        {model.description}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex flex-wrap gap-1">
                          {model.modelkeywords.slice(0, 2).map((keyword, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200"
                        >
                          Try Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Generation Presets - Only show if presets exist or loading */}
        {(contentPresets.length > 0 || loading) && (
          <div>
            <h2 className="text-xl lg:text-2xl font-bold mb-6">Content Generation</h2>
            {loading ? (
              <ContentGridSkeleton count={3} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {contentPresets.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <Card
                      key={preset.id}
                      className={`cursor-pointer group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${preset.bgColor} border-2 hover:border-primary/50`}
                      onClick={() => handlePresetSelect(preset)}
                    >
                      <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 lg:p-3 rounded-xl bg-gradient-to-r ${preset.color} shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="h-5 w-5 lg:h-6 lg:w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-base lg:text-lg">{preset.title}</h3>
                            <p className="text-sm text-muted-foreground">{preset.estimatedTime}</p>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm mb-4 leading-relaxed line-clamp-3">
                          {preset.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{preset.estimatedTime}</span>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium">Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {preset.features.slice(0, 3).map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                              {preset.features.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{preset.features.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          Start Creating
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
