'use client';

import { useState } from 'react';
import { useCreateDelivery, useAvailableVenues, useShipmentPromiseMutation } from '@/hooks/use-wolt-api';
import { useWoltDriveStore } from '@/store/wolt-store';
import { useFormStore } from '@/store/form-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StepIndicator } from '@/components/ui/step-indicator';
import { Step1Promise } from '@/components/steps/step-1-promise';
import { Step2SelectVenue } from '@/components/steps/step-2-select-venue';
import { Step3CreateDelivery } from '@/components/steps/step-3-create-delivery';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CreateDeliveryRequest, AvailableVenue } from '@/types/wolt-drive';

const steps = [
  {
    id: 1,
    title: 'Get Quote',
    description: 'Get shipment promise',
  },
  {
    id: 2,
    title: 'Select Venue',
    description: 'Choose pickup location',
  },
  {
    id: 3,
    title: 'Create Order',
    description: 'Complete delivery details',
  },
];

export function MultiStepDeliveryForm() {
  const { apiToken, merchantId, venueId } = useWoltDriveStore();
  const createDelivery = useCreateDelivery();
  const shipmentPromiseMutation = useShipmentPromiseMutation();
  const availableVenuesMutation = useAvailableVenues();

  const {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    shipmentPromiseId,
    setShipmentPromiseId,
    selectedVenueId,
    setSelectedVenueId,
    scheduledPickupTime,
    setScheduledPickupTime,
    scheduledDropoffTime,
    setScheduledDropoffTime,
    resetForm,
    generateNewOrderRef,
  } = useFormStore();

  const [selectedVenue, setSelectedVenue] = useState<AvailableVenue | null>(null);

  if (!apiToken || !merchantId || !venueId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Delivery</CardTitle>
          <CardDescription>Please configure your API credentials first</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    // Only allow going back to completed steps or staying on current step
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleStep1Complete = (promiseId: string, pickupTime: string | null, dropoffTime: string | null) => {
    setShipmentPromiseId(promiseId);
    if (pickupTime) setScheduledPickupTime(pickupTime);
    if (dropoffTime) setScheduledDropoffTime(dropoffTime);
    handleNextStep();
  };

  const handleStep2Complete = (venue: AvailableVenue) => {
    setSelectedVenue(venue);
    setSelectedVenueId(venue.pickup.venue_id);
    handleNextStep();
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shipmentPromiseId) {
      alert('Please complete Step 1 (Get Quote) first!');
      return;
    }

    if (!selectedVenue) {
      alert('Please complete Step 2 (Select Venue) first!');
      return;
    }

    const request: CreateDeliveryRequest & { venue_id?: string } = {
      pickup: {
        options: {
          min_preparation_time_minutes: parseInt(formData.minPrepTime),
          ...(scheduledPickupTime && { scheduled_time: scheduledPickupTime }),
        },
        comment: formData.pickupComment,
      },
      dropoff: {
        location: {
          coordinates: {
            lat: parseFloat(formData.dropoffLat),
            lon: parseFloat(formData.dropoffLon),
          },
        },
        comment: formData.dropoffComment,
        options: {
          is_no_contact: formData.noContact,
          ...(scheduledDropoffTime && { scheduled_time: scheduledDropoffTime }),
        },
      },
      price: {
        amount: parseInt(formData.orderPrice),
        currency: formData.currency,
      },
      recipient: {
        name: formData.dropoffName,
        phone_number: formData.dropoffPhone,
        email: formData.dropoffEmail,
      },
      parcels: [
        {
          count: parseInt(formData.parcelCount),
          dimensions: {
            weight_gram: parseInt(formData.parcelWeight),
            width_cm: parseInt(formData.parcelWidth),
            height_cm: parseInt(formData.parcelHeight),
            depth_cm: parseInt(formData.parcelDepth),
          },
          price: {
            amount: parseInt(formData.parcelPrice),
            currency: formData.currency,
          },
          description: formData.parcelDescription,
          identifier: formData.parcelIdentifier,
          dropoff_restrictions: {
            id_check_required: false,
          },
        },
      ],
      shipment_promise_id: shipmentPromiseId!,
      customer_support: {
        url: formData.supportUrl,
        email: formData.supportEmail,
        phone_number: formData.supportPhone,
      },
      merchant_order_reference_id: formData.orderReference,
      sms_notifications: {
        received: formData.receivedSms,
        picked_up: formData.pickedUpSms,
      },
      tips: [
        {
          type: 'pre_delivery_courier_tip',
          price: {
            amount: parseInt(formData.tipAmount),
            currency: formData.currency,
          },
        },
      ],
      order_number: formData.orderReference,
      handshake_delivery: {
        is_required: false,
        should_send_sms_to_dropoff_contact: true,
      },
      venue_id: selectedVenueId || undefined,
    };

    try {
      await createDelivery.mutateAsync(request);
      alert('Delivery created successfully!');
      // Reset form and go back to step 1
      resetForm();
      setSelectedVenue(null);
      generateNewOrderRef();
      setCurrentStep(1);
    } catch (error) {
      alert(`Failed to create delivery: ${error}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Delivery</CardTitle>
        <CardDescription>Follow the steps to create a delivery order</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Indicator */}
        <StepIndicator steps={steps} currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <Step1Promise
              formData={formData}
              updateFormData={updateFormData}
              shipmentPromiseMutation={shipmentPromiseMutation}
              onPromiseComplete={handleStep1Complete}
            />
          )}

          {currentStep === 2 && (
            <Step2SelectVenue
              formData={formData}
              availableVenuesMutation={availableVenuesMutation}
              selectedVenue={selectedVenue}
              onVenueSelect={handleStep2Complete}
            />
          )}

          {currentStep === 3 && (
            <Step3CreateDelivery
              formData={formData}
              updateFormData={updateFormData}
              selectedVenue={selectedVenue}
              shipmentPromiseId={shipmentPromiseId}
              onSubmit={handleCreateDelivery}
              isSubmitting={createDelivery.isPending}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={handleNextStep}
              disabled={
                (currentStep === 1 && !shipmentPromiseId) ||
                (currentStep === 2 && !selectedVenue)
              }
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateDelivery}
              disabled={createDelivery.isPending || !selectedVenue}
              className="flex items-center gap-2"
            >
              {createDelivery.isPending ? 'Creating...' : 'Create Delivery'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
