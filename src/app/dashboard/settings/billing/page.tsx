"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PLANS, getPlanById, formatPrice } from "@/lib/razorpay/plans";
import { Loader2, CheckCircle } from "lucide-react";

interface RazorpayWindow {
  Razorpay: new (o: Record<string, unknown>) => { open: () => void };
}

interface SubscriptionInfo {
  id: string;
  plan: string;
  planName: string;
  status: string;
  razorpayStatus: string | null;
  currentPeriodEnd: string | null;
  createdAt: string;
}

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const json = await res.json();
        setSubscription(json.subscription);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        alert(err.error || "Failed to create subscription");
        return;
      }

      const data = await res.json();

      const razorpayKey = data.keyId;
      const subscriptionId = data.subscriptionId;

      await loadRazorpayScript();

      const options = {
        key: razorpayKey,
        subscription_id: subscriptionId,
        name: "AI Admission Counselor",
        description: `Upgrade to ${getPlanById(planId)?.name} plan`,
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_subscription_id: string;
          razorpay_signature: string;
        }) {
          const verifyRes = await fetch("/api/razorpay/verify-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          if (verifyRes.ok) {
            fetchSubscription();
          } else {
            alert("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: function () {
            setUpgrading(null);
          },
        },
      };

      const RazorpayCtor = (window as unknown as { Razorpay: new (o: Record<string, unknown>) => { open: () => void } }).Razorpay;
      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = subscription ? getPlanById(subscription.plan) : null;

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case "PAST_DUE":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Past Due</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing & Plan</h2>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {subscription && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Current Plan</CardTitle>
                    <CardDescription>
                      {subscription.planName} plan
                    </CardDescription>
                  </div>
                  {statusBadge(subscription.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  {currentPlan && (
                    <span className="text-2xl font-bold">
                      {currentPlan.price === 0 ? "Free" : formatPrice(currentPlan.price)}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </span>
                  )}
                  {subscription.currentPeriodEnd && (
                    <span className="text-muted-foreground">
                      Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Available Plans
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const isCurrent = subscription?.plan === plan.id;
                return (
                  <Card
                    key={plan.id}
                    className={isCurrent ? "border-primary" : ""}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        {isCurrent && <Badge>Current</Badge>}
                      </div>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-3xl font-bold">
                        {plan.price === 0 ? "Free" : formatPrice(plan.price)}
                        {plan.price > 0 && (
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        )}
                      </div>
                      <ul className="space-y-2">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={isCurrent ? "outline" : "default"}
                        disabled={isCurrent || upgrading === plan.id}
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        {upgrading === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrent ? (
                          "Current Plan"
                        ) : plan.price === 0 ? (
                          "Downgrade"
                        ) : (
                          "Upgrade"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as unknown as RazorpayWindow;
    if (w.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    document.body.appendChild(script);
  });
}
