import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Shield, Edit2, Save, X, Lock, CheckCircle2 } from 'lucide-react';
const profileSchema = z.object({
    full_name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
});
const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});
export default function Profile() {
    const { profile, roles, loading, fetchProfile, updateProfile, changePassword } = useProfile();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const profileForm = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            email: '',
        },
    });
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });
    useEffect(() => {
        fetchProfile();
    }, []);
    useEffect(() => {
        if (profile) {
            profileForm.reset({
                full_name: profile.full_name || '',
                email: profile.email || '',
            });
        }
    }, [profile]);
    const onProfileSubmit = async (data) => {
        try {
            await updateProfile(data);
            toast({
                title: "Success",
                description: "Profile updated successfully",
            });
            setIsEditing(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: "Failed to update profile",
                variant: "destructive",
            });
        }
    };
    const onPasswordSubmit = async (data) => {
        try {
            await changePassword(data.currentPassword, data.newPassword);
            toast({
                title: "Success",
                description: "Password changed successfully",
            });
            passwordForm.reset();
            setIsChangingPassword(false);
        }
        catch (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to change password",
                variant: "destructive",
            });
        }
    };
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };
    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-400 border-red-500/30';
            case 'manager':
                return 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30';
            case 'cashier':
                return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-400 border-green-500/30';
            default:
                return 'bg-muted';
        }
    };
    if (loading) {
        return (<div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"/>
      </div>);
    }
    return (<div className="space-y-4 sm:space-y-6 max-w-4xl pb-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">
          Profile Settings
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Manage your account information and security settings
        </p>
      </div>

      {/* Profile Header Card */}
      <Card className="p-4 sm:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md shrink-0">
            {profile?.full_name ? getInitials(profile.full_name) : <User className="w-10 h-10 sm:w-12 sm:h-12"/>}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold">{profile?.full_name || 'User'}</h2>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center justify-center sm:justify-start gap-2 mt-1">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
              <span className="truncate">{profile?.email}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
              {roles.map((role) => (<Badge key={role} className={`font-semibold text-xs ${getRoleBadgeColor(role)}`}>
                  <Shield className="w-3 h-3 mr-1"/>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>))}
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary"/>
              Personal Information
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Update your personal details
            </p>
          </div>
          {!isEditing && (<Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2 w-full sm:w-auto" size="sm">
              <Edit2 className="w-4 h-4"/>
              Edit
            </Button>)}
        </div>

        <Separator className="mb-6"/>

        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <FormField control={profileForm.control} name="full_name" render={({ field }) => (<FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing} className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>

            <FormField control={profileForm.control} name="email" render={({ field }) => (<FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled={!isEditing} className={!isEditing ? 'bg-muted cursor-not-allowed' : ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>)}/>

            {isEditing && (<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                setIsEditing(false);
                profileForm.reset();
            }} className="gap-2 w-full sm:w-auto">
                  <X className="w-4 h-4"/>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 w-full sm:w-auto">
                  <Save className="w-4 h-4"/>
                  Save Changes
                </Button>
              </div>)}
          </form>
        </Form>
      </Card>

      {/* Security Card */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-primary"/>
              Security
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage your password and security settings
            </p>
          </div>
          {!isChangingPassword && (<Button variant="outline" onClick={() => setIsChangingPassword(true)} className="gap-2 w-full sm:w-auto" size="sm">
              <Edit2 className="w-4 h-4"/>
              Change Password
            </Button>)}
        </div>

        <Separator className="mb-6"/>

        {isChangingPassword ? (<Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (<FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter current password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (<FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Enter new password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (<FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="Confirm new password"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>)}/>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                setIsChangingPassword(false);
                passwordForm.reset();
            }} className="gap-2 w-full sm:w-auto">
                  <X className="w-4 h-4"/>
                  Cancel
                </Button>
                <Button type="submit" className="gap-2 w-full sm:w-auto">
                  <CheckCircle2 className="w-4 h-4"/>
                  Update Password
                </Button>
              </div>
            </form>
          </Form>) : (<div className="text-sm text-muted-foreground">
            <p>••••••••••••</p>
            <p className="mt-2">Last changed: Never</p>
          </div>)}
      </Card>
    </div>);
}
