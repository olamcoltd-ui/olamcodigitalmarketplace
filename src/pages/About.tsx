import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Target, Award, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            About Olamco Digital Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're building the future of digital commerce in Nigeria, empowering creators 
            and entrepreneurs to monetize their digital products with ease.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To democratize digital commerce by providing a seamless platform where 
                Nigerian creators can easily sell their digital products, earn sustainable 
                income, and build thriving online businesses.
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                To become the leading digital marketplace in Nigeria, fostering a 
                community of creators who can turn their knowledge and skills into 
                profitable digital products.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Story Section */}
        <Card className="mb-16 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Our Story</CardTitle>
            <CardDescription>How Olamco Digital Hub came to be</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Olamco Digital Hub was born out of a simple observation: there were countless 
              talented creators in Nigeria with valuable digital products, but they lacked 
              a reliable platform to reach their audience and monetize their work effectively.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Founded in 2024, we set out to bridge this gap by creating a comprehensive 
              digital marketplace that not only facilitates sales but also provides creators 
              with the tools and support they need to succeed in the digital economy.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Today, we're proud to serve a growing community of creators and customers, 
              facilitating thousands of transactions and helping build sustainable digital 
              businesses across Nigeria.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Community First</h3>
                <p className="text-muted-foreground">
                  We prioritize the success and growth of our creator community above all else.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Quality Excellence</h3>
                <p className="text-muted-foreground">
                  We maintain high standards for products and services on our platform.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-primary/20">
              <CardContent className="p-6">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Innovation</h3>
                <p className="text-muted-foreground">
                  We continuously evolve our platform to meet the changing needs of creators.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <Card className="mb-16 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Platform Statistics</CardTitle>
            <CardDescription className="text-center">Our impact so far</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-primary">1,000+</p>
                <p className="text-sm text-muted-foreground">Active Creators</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">5,000+</p>
                <p className="text-sm text-muted-foreground">Digital Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">₦50M+</p>
                <p className="text-sm text-muted-foreground">Creator Earnings</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">10,000+</p>
                <p className="text-sm text-muted-foreground">Happy Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">What Makes Us Different</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="mt-1">01</Badge>
                <div>
                  <h3 className="font-semibold mb-1">Instant Payouts</h3>
                  <p className="text-sm text-muted-foreground">
                    Get paid immediately after each sale with our automated commission system.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">02</Badge>
                <div>
                  <h3 className="font-semibold mb-1">Referral Program</h3>
                  <p className="text-sm text-muted-foreground">
                    Earn additional income by referring new creators to our platform.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">03</Badge>
                <div>
                  <h3 className="font-semibold mb-1">Flexible Subscriptions</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose the plan that works for you with varying commission rates.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="mt-1">04</Badge>
                <div>
                  <h3 className="font-semibold mb-1">Secure Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    All transactions are processed securely through Paystack.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">05</Badge>
                <div>
                  <h3 className="font-semibold mb-1">Analytics Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Track your sales, earnings, and performance with detailed analytics.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="mt-1">06</Badge>
                <div>
                  <h3 className="font-semibold mb-1">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Our dedicated support team is always ready to help you succeed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <Card className="text-center border-primary/20">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground mb-6">
              Have questions about our platform? We'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <a 
                href="mailto:hello@olamcodigitalhub.com" 
                className="text-primary hover:underline font-medium"
              >
                hello@olamcodigitalhub.com
              </a>
              <Separator orientation="vertical" className="h-4 hidden sm:block" />
              <a 
                href="tel:+2348123456789" 
                className="text-primary hover:underline font-medium"
              >
                +234 812 345 6789
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;