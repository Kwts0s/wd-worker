'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ConfigurationForm } from '@/components/configuration-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, MessageSquare, HelpCircle, Bell } from 'lucide-react';
import { usePluginSettings } from '@/lib/settings-store';

export default function SettingsPage() {
  const router = useRouter();
  const {
    venueSchedule,
    smsNotifications,
    customerSupport,
    shouldSendSmsToDropoffContact,
    preparationTimeMinutes,
    updateVenueSchedule,
    updateSMSNotifications,
    updateCustomerSupport,
    setShouldSendSmsToDropoffContact,
    setPreparationTimeMinutes,
  } = usePluginSettings();

  const [openTime, setOpenTime] = useState(venueSchedule.openTime);
  const [closeTime, setCloseTime] = useState(venueSchedule.closeTime);
  const [prepTime, setPrepTime] = useState(preparationTimeMinutes.toString());
  const [smsReceived, setSmsReceived] = useState(smsNotifications.received);
  const [smsPickedUp, setSmsPickedUp] = useState(smsNotifications.picked_up);
  const [supportEmail, setSupportEmail] = useState(customerSupport.email);
  const [supportPhone, setSupportPhone] = useState(customerSupport.phone_number);
  const [supportUrl, setSupportUrl] = useState(customerSupport.url);
  const [sendSms, setSendSms] = useState(shouldSendSmsToDropoffContact);

  const handleSavePluginSettings = () => {
    updateVenueSchedule({ openTime, closeTime });
    setPreparationTimeMinutes(parseInt(prepTime) || 60);
    updateSMSNotifications({ received: smsReceived, picked_up: smsPickedUp });
    updateCustomerSupport({ email: supportEmail, phone_number: supportPhone, url: supportUrl });
    setShouldSendSmsToDropoffContact(sendSms);
    alert('Plugin settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/')} 
                variant="ghost" 
                size="sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-sm text-muted-foreground">Configure Wolt Drive API and Plugin Behavior</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* API Configuration */}
        <ConfigurationForm />

        {/* Plugin Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Venue Schedule
            </CardTitle>
            <CardDescription>
              Set your venue&apos;s operating hours. Orders placed outside these hours will be scheduled for the next opening time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Opening Time</label>
                <Input
                  type="time"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Closing Time</label>
                <Input
                  type="time"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium">Preparation Time (minutes)</label>
              <Input
                type="number"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                min="30"
                max="180"
                className="mt-1"
                placeholder="60"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum time needed to prepare orders for delivery (30-180 minutes). This prevents &quot;too early&quot; API errors.
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Current schedule: {openTime} - {closeTime} | Prep time: {prepTime} minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Customize SMS messages sent to customers. Use placeholders: {'{CUSTOMER_NAME}'}, {'{STORE_NAME}'}, {'{TRACKING_LINK}'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Order Received Message</label>
              <textarea
                value={smsReceived}
                onChange={(e) => setSmsReceived(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                placeholder="Message sent when order is received"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Order Picked Up Message</label>
              <textarea
                value={smsPickedUp}
                onChange={(e) => setSmsPickedUp(e.target.value)}
                className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px]"
                placeholder="Message sent when order is picked up"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Customer Support
            </CardTitle>
            <CardDescription>
              Contact information shown to customers for delivery support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Support Email</label>
              <Input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Support Phone</label>
              <Input
                type="tel"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+30 210 1234567"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Support URL</label>
              <Input
                type="url"
                value={supportUrl}
                onChange={(e) => setSupportUrl(e.target.value)}
                placeholder="https://example.com/support"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>
              Control how customers receive delivery notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                id="sendSms"
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="sendSms" className="text-sm font-medium">
                Send SMS to customer on delivery updates
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              When enabled, customers will receive SMS notifications for delivery status updates
            </p>
          </CardContent>
        </Card>

        <Button onClick={handleSavePluginSettings} className="w-full">
          Save Plugin Settings
        </Button>
      </main>
    </div>
  );
}
