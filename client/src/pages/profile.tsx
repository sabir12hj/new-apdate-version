import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, Edit, Save } from "lucide-react";
import { FaTelegram } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const profileSchema = z.object({
  fullName: z.string().nullable().optional(),
  mobileNumber: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  accountIfsc: z.string().nullable().optional(),
  upiId: z.string().nullable().optional(),
  telegramId: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, requireAuth } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Make sure user is authenticated
  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      mobileNumber: user?.mobileNumber || "",
      accountNumber: user?.accountNumber || "",
      accountIfsc: user?.accountIfsc || "",
      upiId: user?.upiId || "",
      telegramId: user?.telegramId || "",
    },
  });

  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        mobileNumber: user.mobileNumber || "",
        accountNumber: user.accountNumber || "",
        accountIfsc: user.accountIfsc || "",
        upiId: user.upiId || "",
        telegramId: user.telegramId || "",
      });
      setImagePreview(user.profilePhoto || null);
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormValues & { profilePhoto?: string }) => {
      const res = await apiRequest("PUT", "/api/profile", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedImage(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert the file to base64
      return new Promise<{photo: string}>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve({ photo: reader.result });
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (data) => {
      // Send the base64 data to the profile photo API
      const sendPhoto = async () => {
        try {
          const res = await apiRequest("POST", "/api/profile/photo", { photo: data.photo });
          if (!res.ok) throw new Error('Failed to upload image');
          
          // Refresh user data to get the updated profile photo
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          
          toast({
            title: "Profile photo updated",
            description: "Your profile photo has been updated successfully",
          });
        } catch (error) {
          toast({
            title: "Upload failed",
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: "destructive",
          });
        }
      };
      sendPhoto();
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      // Convert empty strings to null for the API
      const cleanValues = Object.entries(values).reduce((acc, [key, value]) => {
        acc[key as keyof ProfileFormValues] = value === "" ? null : value;
        return acc;
      }, {} as ProfileFormValues);

      // First update profile information
      await updateProfileMutation.mutateAsync(cleanValues);
      
      // Then upload image if selected
      if (selectedImage) {
        await uploadImageMutation.mutateAsync(selectedImage);
      }
      
      // Reset state
      setSelectedImage(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const openTelegram = () => {
    window.open("https://t.me/quiztournament_bot", "_blank");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Profile Picture</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="h-32 w-32">
                  {imagePreview ? (
                    <AvatarImage src={imagePreview} alt={user.username} />
                  ) : (
                    <AvatarFallback className="text-4xl">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <label htmlFor="profile-photo" className="absolute bottom-0 right-0 p-1 bg-primary text-white rounded-full cursor-pointer">
                    <Camera className="h-5 w-5" />
                    <input 
                      id="profile-photo" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <h2 className="text-xl font-semibold mt-2">{user.username}</h2>
              <p className="text-gray-500">{user.email}</p>
              <div className="mt-4 flex flex-col gap-2 w-full">
                <Button
                  variant={isEditing ? "default" : "outline"}
                  className="w-full"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save Profile
                    </>
                  ) : (
                    <>
                      <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200"
                  onClick={openTelegram}
                >
                  <FaTelegram className="mr-2 h-5 w-5" /> Connect Telegram
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="col-span-1 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal information and payment details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="payment">Payment Details</TabsTrigger>
                </TabsList>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    <TabsContent value="personal" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your full name" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="mobileNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mobile Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your mobile number" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="telegramId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telegram ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your Telegram ID" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    <TabsContent value="payment" className="space-y-4">
                      <FormField
                        control={form.control}
                        name="accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank Account Number</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your bank account number" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="accountIfsc"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bank IFSC Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Bank IFSC code" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="upiId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UPI ID</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your UPI ID" 
                                {...field} 
                                value={field.value || ""}
                                disabled={!isEditing} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                    
                    {isEditing && (
                      <div className="flex justify-end pt-2">
                        <Button 
                          type="submit"
                          disabled={updateProfileMutation.isPending || uploadImageMutation.isPending}
                        >
                          {(updateProfileMutation.isPending || uploadImageMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </form>
                </Form>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
