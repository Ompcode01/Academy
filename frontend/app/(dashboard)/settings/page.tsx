"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, Lock, Settings as SettingsIcon, ShieldCheck, Shield, Globe, Key } from "lucide-react";
import RoleGate from "@/components/auth/RoleGate";
import { ROLES } from "@/lib/rbac";
import { getRoles, Role } from "@/services/api/org.service";

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("profile");
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  // Role Management state
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin && activeTab === "roles") {
      loadRoles();
    }
  }, [activeTab, isSuperAdmin]);

  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const res = await getRoles();
      setRoles(res?.data || []);
    } catch (err) {
      console.error("Failed to load roles:", err);
    } finally {
      setRolesLoading(false);
    }
  };

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

  // Security policy toggles (mock state)
  const [policies, setPolicies] = useState({
    enforceStrongPasswords: true,
    requireMFA: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    ssoEnabled: false,
  });

  const ROLE_DESCRIPTIONS: Record<string, string> = {
    SUPER_ADMIN: "Full platform access. Can manage all users, admins, settings, billing, and security policies.",
    ADMIN: "Day-to-day operations. Can manage users, groups, and generate reports within assigned scope.",
    TEACHER: "Can create and manage courses, view enrollments, and track learner progress.",
    LEARNER: "Can enroll in courses, complete assignments, and view their own progress.",
    GUEST: "Read-only access to published courses. Cannot enroll or track progress.",
  };

  const ROLE_COLORS: Record<string, string> = {
    SUPER_ADMIN: "bg-red-100 text-red-700 border-red-200",
    ADMIN: "bg-purple-100 text-purple-700 border-purple-200",
    TEACHER: "bg-blue-100 text-blue-700 border-blue-200",
    LEARNER: "bg-emerald-100 text-emerald-700 border-emerald-200",
    GUEST: "bg-slate-100 text-slate-500 border-slate-200",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isSuperAdmin
              ? "Manage platform settings, security policies, roles, and your personal profile."
              : "Manage your personal account profile, password, and preferences."}
          </p>
        </div>
        {isSuperAdmin && (
          <Badge variant="outline" className="gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border-red-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Super Admin
          </Badge>
        )}
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
          {isSuperAdmin && (
            <>
              <TabsTrigger value="platform" className="gap-2">
                <Globe className="h-4 w-4" />
                Platform Admin
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <Key className="h-4 w-4" />
                Role Management
              </TabsTrigger>
            </>
          )}
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

        {/* Platform Administration Tab (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <TabsContent value="platform">
            <div className="space-y-6 max-w-3xl">
              {/* Security Policies */}
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Security Policies
                  </CardTitle>
                  <CardDescription>
                    Configure organization-wide security policies and authentication settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div>
                      <span className="text-sm font-medium">Enforce Strong Passwords</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Require minimum 8 chars with uppercase, number, and special character</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={policies.enforceStrongPasswords}
                      onChange={(e) => setPolicies({ ...policies, enforceStrongPasswords: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div>
                      <span className="text-sm font-medium">Require Multi-Factor Authentication</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Enable MFA for all admin-level users at login</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={policies.requireMFA}
                      onChange={(e) => setPolicies({ ...policies, requireMFA: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>

                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">Session Timeout (minutes)</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Auto-logout after inactivity period</p>
                    </div>
                    <Input
                      type="number"
                      value={policies.sessionTimeout}
                      onChange={(e) => setPolicies({ ...policies, sessionTimeout: Number(e.target.value) })}
                      className="w-20 h-8 text-center text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">Max Login Attempts Before Lockout</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Account locks after N failed attempts</p>
                    </div>
                    <Input
                      type="number"
                      value={policies.maxLoginAttempts}
                      onChange={(e) => setPolicies({ ...policies, maxLoginAttempts: Number(e.target.value) })}
                      className="w-20 h-8 text-center text-sm"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div>
                      <span className="text-sm font-medium">Lockout Duration (minutes)</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Time before locked account is automatically unlocked</p>
                    </div>
                    <Input
                      type="number"
                      value={policies.lockoutDuration}
                      onChange={(e) => setPolicies({ ...policies, lockoutDuration: Number(e.target.value) })}
                      className="w-20 h-8 text-center text-sm"
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t border-border pt-4">
                  <Button onClick={() => alert("Security policies saved (mock).")}>
                    Save Security Policies
                  </Button>
                </CardFooter>
              </Card>

              {/* Authentication Settings */}
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Authentication Settings
                  </CardTitle>
                  <CardDescription>
                    Configure SSO, identity provider integrations, and authentication methods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center justify-between rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                    <div>
                      <span className="text-sm font-medium">Enable SSO (SAML 2.0)</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow single sign-on via corporate identity provider</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={policies.ssoEnabled}
                      onChange={(e) => setPolicies({ ...policies, ssoEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </label>
                </CardContent>
              </Card>

              {/* Platform Info */}
              <Card className="border border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Platform Information
                  </CardTitle>
                  <CardDescription>
                    System version, license, and tenant configuration details.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Platform Version</Label>
                      <Input value="Academy LMS v2.1.0" readOnly className="bg-muted/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">Tenant ID</Label>
                      <Input value="harbinger-group-prod" readOnly className="bg-muted/40 font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">License Type</Label>
                      <Input value="Enterprise (Unlimited)" readOnly className="bg-muted/40" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium text-muted-foreground">License Expiry</Label>
                      <Input value="2027-12-31" readOnly className="bg-muted/40 font-mono" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Role Management Tab (SUPER_ADMIN only) */}
        {isSuperAdmin && (
          <TabsContent value="roles">
            <Card className="border border-border bg-card max-w-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  System Roles
                </CardTitle>
                <CardDescription>
                  View all roles configured in the platform and their access levels. Role permissions are managed through the permission system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rolesLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Loading roles...</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-4">Role Code</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role Name</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roles.map((role) => (
                          <TableRow key={role.id} className="border-border hover:bg-muted/20">
                            <TableCell className="pl-4">
                              <Badge variant="outline" className={`text-xs font-semibold ${ROLE_COLORS[role.roleCode] || "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                {role.roleCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">{role.roleName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-xs">
                              {ROLE_DESCRIPTIONS[role.roleCode] || role.description || "No description available"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={role.isActive ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>
                                {role.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
