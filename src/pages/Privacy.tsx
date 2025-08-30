import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Privacy Policy
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
                  At Olamco Digital Hub ("we," "our," or "us"), we are committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                  when you visit our website olamcodigitalhub.com and use our services.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Please read this privacy policy carefully. If you do not agree with the terms of this 
                  privacy policy, please do not access the site.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Information We Collect */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-lg font-medium mb-3">2.1 Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  We may collect personal information that you voluntarily provide when you:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground mb-6">
                  <li>Register for an account</li>
                  <li>Upload digital products for sale</li>
                  <li>Make a purchase</li>
                  <li>Subscribe to our newsletter</li>
                  <li>Contact us with inquiries</li>
                  <li>Participate in our referral program</li>
                </ul>

                <p className="text-muted-foreground mb-4">This information may include:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground mb-6">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Payment information (processed securely through Paystack)</li>
                  <li>Bank account details for withdrawals</li>
                  <li>Profile information and preferences</li>
                  <li>Digital products and associated metadata</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">2.2 Automatically Collected Information</h3>
                <p className="text-muted-foreground mb-4">
                  When you access our website, we may automatically collect certain information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referring website information</li>
                  <li>Device information and identifiers</li>
                </ul>
              </section>

              <Separator className="my-8" />

              {/* How We Use Information */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We use the information we collect for various purposes, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li>Providing and maintaining our services</li>
                  <li>Processing transactions and payments</li>
                  <li>Managing user accounts and subscriptions</li>
                  <li>Facilitating product downloads and access</li>
                  <li>Processing commission payments and withdrawals</li>
                  <li>Managing our referral program</li>
                  <li>Sending administrative and promotional communications</li>
                  <li>Improving our website and services</li>
                  <li>Analyzing usage patterns and trends</li>
                  <li>Preventing fraud and ensuring security</li>
                  <li>Complying with legal obligations</li>
                </ul>
              </section>

              <Separator className="my-8" />

              {/* Information Sharing */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information in the following circumstances:
                </p>

                <h3 className="text-lg font-medium mb-3">4.1 Service Providers</h3>
                <p className="text-muted-foreground mb-4">
                  We may share your information with third-party service providers who help us operate our business:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground mb-6">
                  <li>Paystack for payment processing</li>
                  <li>Supabase for data storage and authentication</li>
                  <li>Cloud storage providers for file hosting</li>
                  <li>Email service providers for communications</li>
                  <li>Analytics providers for usage tracking</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.2 Legal Requirements</h3>
                <p className="text-muted-foreground mb-4">
                  We may disclose your information if required by law or in response to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground mb-6">
                  <li>Court orders or legal processes</li>
                  <li>Government investigations</li>
                  <li>Requests from law enforcement</li>
                  <li>Protection of our rights and property</li>
                </ul>

                <h3 className="text-lg font-medium mb-3">4.3 Business Transfers</h3>
                <p className="text-muted-foreground mb-4">
                  In the event of a merger, acquisition, or sale of assets, your information may be 
                  transferred as part of the transaction.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Data Security */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure authentication systems</li>
                  <li>Regular security audits and updates</li>
                  <li>Limited access to personal information</li>
                  <li>Secure payment processing through Paystack</li>
                  <li>Regular backup and disaster recovery procedures</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  However, no method of transmission over the Internet or electronic storage is 100% secure. 
                  While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Data Retention */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
                <p className="text-muted-foreground mb-4">
                  We retain your personal information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Maintain business records and analytics</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  When you delete your account, we will delete or anonymize your personal information, 
                  except where we are required to retain it for legal or regulatory purposes.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Your Rights */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
                <p className="text-muted-foreground mb-4">
                  Depending on your location and applicable laws, you may have the following rights:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li><span className="font-medium">Access:</span> Request copies of your personal information</li>
                  <li><span className="font-medium">Correction:</span> Request correction of inaccurate information</li>
                  <li><span className="font-medium">Deletion:</span> Request deletion of your personal information</li>
                  <li><span className="font-medium">Portability:</span> Request transfer of your data</li>
                  <li><span className="font-medium">Objection:</span> Object to processing of your information</li>
                  <li><span className="font-medium">Restriction:</span> Request restriction of processing</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  To exercise these rights, please contact us at privacy@olamcodigitalhub.com. 
                  We will respond to your request within 30 days.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Cookies */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar tracking technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                  <li><span className="font-medium">Essential Cookies:</span> Required for basic site functionality</li>
                  <li><span className="font-medium">Performance Cookies:</span> Help us analyze site usage</li>
                  <li><span className="font-medium">Functional Cookies:</span> Remember your preferences</li>
                  <li><span className="font-medium">Marketing Cookies:</span> Used for targeted advertising (with consent)</li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  You can control cookie settings through your browser preferences. Note that disabling 
                  certain cookies may affect site functionality.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Third Party Services */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
                <p className="text-muted-foreground mb-4">
                  Our website may contain links to third-party websites or integrate with third-party services. 
                  We are not responsible for the privacy practices of these external services. We encourage 
                  you to review their privacy policies.
                </p>
                <p className="text-muted-foreground">
                  Key third-party services we use include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground mt-2">
                  <li>Paystack for payment processing</li>
                  <li>Supabase for backend services</li>
                  <li>Google Analytics for website analytics</li>
                </ul>
              </section>

              <Separator className="my-8" />

              {/* Children's Privacy */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                <p className="text-muted-foreground">
                  Our services are not intended for children under 18 years of age. We do not knowingly 
                  collect personal information from children under 18. If you believe we have collected 
                  information from a child under 18, please contact us immediately.
                </p>
              </section>

              <Separator className="my-8" />

              {/* International Transfers */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. International Data Transfers</h2>
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in countries other than Nigeria. 
                  These countries may have different data protection laws. We ensure appropriate safeguards 
                  are in place to protect your information during such transfers.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Updates */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Updates to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes 
                  by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                  We encourage you to review this Privacy Policy periodically.
                </p>
              </section>

              <Separator className="my-8" />

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>If you have any questions about this Privacy Policy, please contact us:</p>
                  <p>Email: privacy@olamcodigitalhub.com</p>
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

export default Privacy;