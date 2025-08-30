import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Users, Zap, Star, CheckCircle } from 'lucide-react';
import olamcoLogo from '@/assets/olamco-logo.png';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={olamcoLogo} alt="Olamco Digital Hub" className="h-10 w-10" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Olamco Digital Hub
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/products">
              <Button variant="ghost">Browse Products</Button>
            </Link>
            <Link to="/auth">
              <Button variant="glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-white/20 text-white hover:bg-white/30">
            🚀 Start Earning Today
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Earn Up To
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
              50% Commission
            </span>
            Selling Digital Products
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Join Nigeria's premier digital marketplace. Share products, earn commissions, and build your passive income stream.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button variant="hero" size="lg" className="group">
                Start Earning Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Why Choose Olamco Digital Hub?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build a successful digital business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Easy Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Share products on social media with your unique referral links. No technical skills required.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-success rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Instant Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get paid instantly when someone buys through your link. Withdraw to your bank account anytime.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-glow transition-all duration-300 group">
              <CardHeader>
                <div className="h-12 w-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Referral Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Earn 15% commission from people you refer, plus 25% of their subscription revenue.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground">
              Higher plans = Higher commissions
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free Plan */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-center">Free</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">20% commission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Basic analytics</span>
                </div>
                <Link to="/auth">
                  <Button variant="outline" className="w-full mt-4">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Monthly Plan */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="text-center">Monthly</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦2,500</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">30% commission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Priority support</span>
                </div>
                <Link to="/auth">
                  <Button variant="default" className="w-full mt-4">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 6-Month Plan */}
            <Card className="shadow-elegant border-primary">
              <CardHeader>
                <Badge className="w-fit mx-auto mb-2 bg-gradient-primary">Popular</Badge>
                <CardTitle className="text-center">6-Month</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦5,500</span>
                  <span className="text-muted-foreground">/6 months</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">40% commission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Bulk upload</span>
                </div>
                <Link to="/auth">
                  <Button variant="glow" className="w-full mt-4">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Annual Plan */}
            <Card className="shadow-elegant">
              <CardHeader>
                <Badge className="w-fit mx-auto mb-2 bg-gradient-success">Best Value</Badge>
                <CardTitle className="text-center">Annual</CardTitle>
                <div className="text-center">
                  <span className="text-3xl font-bold">₦7,000</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">50% commission</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Premium features</span>
                </div>
                <Link to="/auth">
                  <Button variant="success" className="w-full mt-4">
                    Choose Plan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful digital entrepreneurs
          </p>
          <Link to="/auth">
            <Button variant="hero" size="lg" className="bg-white text-primary hover:bg-white/90">
              Start Your Journey Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={olamcoLogo} alt="Olamco Digital Hub" className="h-8 w-8" />
                <span className="font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Olamco Digital Hub
                </span>
              </div>
              <p className="text-muted-foreground">
                Nigeria's premier digital marketplace for earning commissions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/products" className="hover:text-primary transition-colors">Browse Products</Link></li>
                <li><Link to="/categories" className="hover:text-primary transition-colors">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground">
            <p>&copy; 2024 Olamco Digital Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;