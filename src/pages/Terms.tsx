import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              {/* Introduction */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Welcome to Olamco Digital Hub ("we," "our," or "us"). These Terms of Service ("Terms") 
                  govern your use of our website and services located at olamcodigitalhub.com (the "Service") 
                  operated by Olamco Digital Hub.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                  with any part of these terms, then you may not access the Service.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Definitions */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">"Platform"</span> - refers to Olamco Digital Hub website and services
                  </div>
                  <div>
                    <span className="font-medium">"Creator"</span> - users who upload and sell digital products on our platform
                  </div>
                  <div>
                    <span className="font-medium">"Buyer"</span> - users who purchase digital products from our platform
                  </div>
                  <div>
                    <span className="font-medium">"Digital Products"</span> - downloadable files, courses, templates, and other digital content
                  </div>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Account Registration */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>To access certain features of our Service, you must register for an account. When you register:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You must provide accurate, current, and complete information</li>
                    <li>You must maintain and update your information to keep it accurate</li>
                    <li>You are responsible for maintaining the confidentiality of your account password</li>
                    <li>You must be at least 18 years old to create an account</li>
                    <li>You are responsible for all activities that occur under your account</li>
                  </ul>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Creator Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Creator Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-medium text-foreground">4.1 Product Upload</h3>
                  <p>As a Creator, you represent and warrant that:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You own or have the legal right to sell all uploaded digital products</li>
                    <li>Your products do not infringe on any intellectual property rights</li>
                    <li>Your products comply with all applicable laws and regulations</li>
                    <li>Product descriptions are accurate and not misleading</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">4.2 Commission Structure</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Commission rates vary based on your subscription plan</li>
                    <li>Free plan: 20% commission rate</li>
                    <li>Premium plans: Higher commission rates as specified in subscription details</li>
                    <li>Commissions are paid automatically after successful sales</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">4.3 Prohibited Content</h3>
                  <p>You may not upload products that contain:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Illegal, harmful, or offensive content</li>
                    <li>Copyrighted material without proper authorization</li>
                    <li>Malware, viruses, or harmful software</li>
                    <li>Adult content or material inappropriate for general audiences</li>
                  </ul>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Payment Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Payment Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <h3 className="text-lg font-medium text-foreground">5.1 Processing</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All payments are processed through Paystack</li>
                    <li>Prices are listed in Nigerian Naira (₦)</li>
                    <li>Payment confirmation is required before product download</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">5.2 Refunds</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Digital products are generally non-refundable due to their nature</li>
                    <li>Refunds may be considered on a case-by-case basis for technical issues</li>
                    <li>Refund requests must be submitted within 24 hours of purchase</li>
                  </ul>

                  <h3 className="text-lg font-medium text-foreground mt-6">5.3 Withdrawals</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Minimum withdrawal amount: ₦500</li>
                    <li>Withdrawal processing fee: ₦50</li>
                    <li>Withdrawals are processed within 1-3 business days</li>
                  </ul>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Referral Program */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Referral Program</h2>
                <div className="space-y-4 text-muted-foreground">
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Earn 15% commission on sales made by users you refer</li>
                    <li>Referral commissions are paid automatically</li>
                    <li>Fraudulent referral activities will result in account termination</li>
                    <li>We reserve the right to modify the referral program at any time</li>
                  </ul>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Intellectual Property */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    The Service and its original content, features, and functionality are and will remain 
                    the exclusive property of Olamco Digital Hub and its licensors. The Service is 
                    protected by copyright, trademark, and other laws.
                  </p>
                  <p>
                    Creators retain ownership of their uploaded digital products but grant us a 
                    non-exclusive license to distribute and market these products on our platform.
                  </p>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Termination */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Termination</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may terminate or suspend your account immediately, without prior notice, for:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Violation of these Terms</li>
                    <li>Fraudulent or illegal activities</li>
                    <li>Uploading prohibited content</li>
                    <li>Abuse of the referral system</li>
                  </ul>
                  <p>
                    Upon termination, your right to use the Service will cease immediately. 
                    Any outstanding payments owed to you may be processed after a review period.
                  </p>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Disclaimers */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Disclaimers</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    The information on this Service is provided on an "as is" basis. We make no 
                    warranties, expressed or implied, and hereby disclaim all other warranties 
                    including implied warranties of merchantability, fitness for a particular 
                    purpose, and non-infringement of intellectual property.
                  </p>
                  <p>
                    We do not guarantee the quality, accuracy, or completeness of digital products 
                    sold by Creators on our platform.
                  </p>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Limitation of Liability */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    In no case shall Olamco Digital Hub be liable for any direct, indirect, 
                    incidental, punitive, or consequential damages arising from your use of the Service.
                  </p>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Changes to Terms */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    We reserve the right to update these Terms at any time. We will notify users 
                    of any changes by posting the new Terms on this page and updating the "Last updated" date.
                  </p>
                  <p>
                    Continued use of the Service after changes become effective constitutes 
                    acceptance of the new Terms.
                  </p>
                </div>
              </section>

              <Separator className="my-8" />

              {/* Contact Information */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>If you have any questions about these Terms, please contact us at:</p>
                  <p>Email: legal@olamcodigitalhub.com</p>
                  <p>Phone: +234 812 345 6789</p>
                  <p>Address: Lagos, Nigeria</p>
                </div>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Terms;