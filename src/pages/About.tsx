import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { InfoIcon, Target, Users, Heart, Lightbulb, Award, Globe, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-8">
          <InfoIcon className="h-8 w-8" />
          <h1 className="text-4xl font-bold">About Us</h1>
        </div>
        <div className="max-w-4xl mx-auto">

          {/* Hero Section */}
          <section className="mb-16 text-center">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Revolutionizing content creation through the power of artificial intelligence and voice technology.
              We're building the future where ideas become reality at the speed of thought.
            </p>
          </section>

          {/* Our Story */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              <p className="mb-6">
                Founded in 2023, Vocal Verse AI Studio emerged from a vision to transform how we interact with digital content through voice technology.
                What started as a simple idea to make content creation more accessible has evolved into a comprehensive AI-powered platform that serves
                creators, businesses, and individuals worldwide.
              </p>
              <p className="mb-6">
                Our journey began when our founders recognized the growing gap between the speed of human creativity and the limitations of traditional
                content creation tools. We envisioned a world where anyone could transform their ideas into professional-quality content using just their voice,
                regardless of their technical expertise or resources.
              </p>
              <p>
                Today, we're proud to be at the forefront of the AI revolution, continuously pushing the boundaries of what's possible in content generation,
                voice synthesis, and intelligent automation.
              </p>
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mb-16">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Target className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Our Mission</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize content creation by providing cutting-edge AI tools that empower everyone to bring their ideas to life.
                  We believe that creativity should never be limited by technical barriers or resource constraints.
                </p>
              </div>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                  <h3 className="text-2xl font-semibold">Our Vision</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  A world where artificial intelligence seamlessly amplifies human creativity, making professional-quality content creation
                  accessible to billions of people and transforming how we communicate and share knowledge.
                </p>
              </div>
            </div>
          </section>

          {/* Core Values */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-8 text-center">Our Core Values</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">User-Centric</h4>
                <p className="text-sm text-muted-foreground">Every decision we make starts with our users' needs and experiences.</p>
              </div>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Innovation</h4>
                <p className="text-sm text-muted-foreground">We constantly push boundaries to deliver breakthrough technologies.</p>
              </div>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Integrity</h4>
                <p className="text-sm text-muted-foreground">We build trust through transparency, honesty, and ethical practices.</p>
              </div>
              <div className="text-center p-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Excellence</h4>
                <p className="text-sm text-muted-foreground">We strive for the highest quality in everything we create and deliver.</p>
              </div>
            </div>
          </section>

          {/* Leadership Team */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-8">Leadership Team</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  SJ
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">Sarah Johnson</h3>
                <p className="text-sm text-muted-foreground text-center mb-3">CEO & Co-founder</p>
                <p className="text-sm text-muted-foreground">
                  Former VP of Product at a leading tech company, Sarah brings 15+ years of experience in scaling innovative products.
                  She holds an MBA from Stanford and is passionate about democratizing technology.
                </p>
              </div>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  MC
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">Michael Chen</h3>
                <p className="text-sm text-muted-foreground text-center mb-3">CTO & Co-founder</p>
                <p className="text-sm text-muted-foreground">
                  A former AI research scientist at Google, Michael holds a PhD in Machine Learning from MIT.
                  He has published 50+ papers in top-tier conferences and holds several patents in AI and NLP.
                </p>
              </div>
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                  AR
                </div>
                <h3 className="text-xl font-medium mb-2 text-center">Alex Rodriguez</h3>
                <p className="text-sm text-muted-foreground text-center mb-3">VP of Engineering</p>
                <p className="text-sm text-muted-foreground">
                  Previously Lead Engineer at Netflix, Alex specializes in building scalable systems that serve millions of users.
                  Passionate about clean code and mentoring the next generation of engineers.
                </p>
              </div>
            </div>
          </section>

          {/* What Sets Us Apart */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-8">What Sets Us Apart</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Global Accessibility</h4>
                    <p className="text-sm text-muted-foreground">
                      Our platform supports 50+ languages and is designed to work seamlessly across different cultures and regions.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Privacy-First Approach</h4>
                    <p className="text-sm text-muted-foreground">
                      We implement industry-leading security measures and give users complete control over their data and content.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Cutting-Edge AI</h4>
                    <p className="text-sm text-muted-foreground">
                      Our proprietary AI models are trained on diverse, high-quality datasets to deliver superior results across all content types.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Community-Driven</h4>
                    <p className="text-sm text-muted-foreground">
                      We actively listen to our community and iterate based on real user feedback and emerging needs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Company Stats */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold mb-8 text-center">By the Numbers</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">500K+</div>
                <p className="text-muted-foreground">Active Users</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">10M+</div>
                <p className="text-muted-foreground">Content Pieces Generated</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">50+</div>
                <p className="text-muted-foreground">Supported Languages</p>
              </div>
              <div className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
                <p className="text-muted-foreground">Uptime</p>
              </div>
            </div>
          </section>

          {/* Future Vision */}
          <section className="mb-16">
            <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-secondary/5 p-8 text-center">
              <h2 className="text-3xl font-semibold mb-4">Looking Ahead</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                We're just getting started. Our roadmap includes groundbreaking features like real-time collaboration,
                advanced personalization, and integration with emerging technologies like AR/VR. Join us on this exciting journey
                as we continue to push the boundaries of what's possible with AI-powered content creation.
              </p>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
