"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { User, Lock, Settings as SettingsIcon, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("profile");

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation password do not match.");
      return;
    }

    setUpdating(true);
    setTimeout(() => {
      setUpdating(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully!");
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your personal account profile, password, and preferences.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/40 border border-border">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile Info
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security &amp; Password
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="profile">
          <Card className="border border-border bg-card max-w-2xl">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>
                Your enterprise directory employee profile. Values are synchronized from Darwinbox ERP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                  <Input value={user?.username || "Priyanka Davhare"} readOnly className="bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-muted-foreground">User ID / Code</Label>
                  <Input value={`#${user?.id || 1}`} readOnly className="bg-muted/40 font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-muted-foreground">Assigned Role</Label>
                <div className="flex items-center gap-2">
                  <Input value={user?.role || "SUPER_ADMIN"} readOnly className="bg-muted/40 font-semibold" />
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0 h-9 px-3 gap-1">
                    <ShieldCheck className="h-4 w-4" /> Verified
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security / Password Tab */}
        <TabsContent value="security">
          <Card className="border border-border bg-card max-w-2xl">
            <form onSubmit={handlePasswordChange}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Modify the authentication password for your LMS portal access account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currPass" className="text-sm font-medium">Current Password *</Label>
                  <Input
                    id="currPass"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPass" className="text-sm font-medium">New Password *</Label>
                    <Input
                      id="newPass"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confPass" className="text-sm font-medium">Confirm New Password *</Label>
                    <Input
                      id="confPass"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4">
                <Button type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update Password"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Preferences / System Tab */}
        <TabsContent value="system">
          <Card className="border border-border bg-card max-w-2xl">
            <CardHeader>
              <CardTitle>Portal Preferences</CardTitle>
              <CardDescription>
                Customize layout preferences for email notifications and design theme options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Enable Email Course Reminders", checked: true },
                { label: "Receive Weekly Summary Reports", checked: false },
                { label: "Compact Layout Density", checked: false },
              ].map((pref, idx) => (
                <label
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium">{pref.label}</span>
                  <input
                    type="checkbox"
                    defaultChecked={pref.checked}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
