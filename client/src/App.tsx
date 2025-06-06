
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Plane, MapPin, Users, FileText, Plus, Send } from 'lucide-react';
import type { 
  User, 
  TravelPlan, 
  Post, 
  Message, 
  TravelDocument,
  CreateTravelPlanInput,
  CreatePostInput,
  CreateMessageInput,
  UpdateUserInput
} from '../../server/src/schema';

// Current user ID - in a real app this would come from authentication
const CURRENT_USER_ID = "user_123";

function App() {
  // State management
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [discoveredTravelers, setDiscoveredTravelers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [travelPlanForm, setTravelPlanForm] = useState<CreateTravelPlanInput>({
    user_id: CURRENT_USER_ID,
    mode: 'flight',
    departure_time: new Date(),
    arrival_time: new Date(),
    departure_location: '',
    arrival_location: '',
    booking_reference: null,
    duration_minutes: null,
    travel_provider: null,
    additional_info: null
  });

  const [postForm, setPostForm] = useState<CreatePostInput>({
    user_id: CURRENT_USER_ID,
    content: '',
    image_urls: [],
    location: null
  });

  const [messageForm, setMessageForm] = useState<CreateMessageInput>({
    sender_id: CURRENT_USER_ID,
    recipient_id: '',
    content: ''
  });

  const [profileForm, setProfileForm] = useState<UpdateUserInput>({
    id: CURRENT_USER_ID,
    name: null,
    bio: null,
    location: null,
    interests: [],
    is_discoverable: true
  });

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const user = await trpc.getUser.query(CURRENT_USER_ID);
      setCurrentUser(user);
      
      if (user) {
        setProfileForm({
          id: user.id,
          name: user.name,
          bio: user.bio,
          location: user.location,
          interests: user.interests,
          is_discoverable: user.is_discoverable
        });
      }

      // Load travel plans
      const plans = await trpc.getUserTravelPlans.query({ user_id: CURRENT_USER_ID });
      setTravelPlans(plans);

      // Load posts
      const allPosts = await trpc.getPosts.query({ limit: 20 });
      setPosts(allPosts);

      // Load messages
      const userMessages = await trpc.getMessages.query({ user_id: CURRENT_USER_ID, limit: 50 });
      setMessages(userMessages);

      // Load documents
      const userDocs = await trpc.getUserDocuments.query({ user_id: CURRENT_USER_ID });
      setDocuments(userDocs);

      // Find other travelers
      const travelers = await trpc.findTravelers.query({ 
        user_id: CURRENT_USER_ID,
        limit: 10
      });
      setDiscoveredTravelers(travelers);

    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handler functions
  const handleCreateTravelPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPlan = await trpc.createTravelPlan.mutate(travelPlanForm);
      setTravelPlans((prev: TravelPlan[]) => [...prev, newPlan]);
      setTravelPlanForm({
        user_id: CURRENT_USER_ID,
        mode: 'flight',
        departure_time: new Date(),
        arrival_time: new Date(),
        departure_location: '',
        arrival_location: '',
        booking_reference: null,
        duration_minutes: null,
        travel_provider: null,
        additional_info: null
      });
    } catch (error) {
      console.error('Failed to create travel plan:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPost = await trpc.createPost.mutate(postForm);
      setPosts((prev: Post[]) => [newPost, ...prev]);
      setPostForm({
        user_id: CURRENT_USER_ID,
        content: '',
        image_urls: [],
        location: null
      });
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageForm.recipient_id || !messageForm.content.trim()) return;
    
    try {
      const newMessage = await trpc.createMessage.mutate(messageForm);
      setMessages((prev: Message[]) => [newMessage, ...prev]);
      setMessageForm({
        sender_id: CURRENT_USER_ID,
        recipient_id: messageForm.recipient_id,
        content: ''
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await trpc.updateUser.mutate(profileForm);
      setCurrentUser(updatedUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'flight': return '✈️';
      case 'boat': return '⛵';
      case 'taxi': return '🚕';
      case 'bus': return '🚌';
      case 'train': return '🚆';
      default: return '🚗';
    }
  };

  const handleTravelModeChange = (value: string) => {
    setTravelPlanForm((prev: CreateTravelPlanInput) => ({ 
      ...prev, 
      mode: value as 'flight' | 'boat' | 'taxi' | 'bus' | 'train'
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your travel companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌍 Travel Companion
          </h1>
          <p className="text-gray-600">Your all-in-one travel management platform</p>
        </div>

        {/* Welcome message */}
        {currentUser && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertDescription>
              Welcome back, {currentUser.name || 'Traveler'}! ✈️ Ready for your next adventure?
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="travel-plans" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="travel-plans" className="flex items-center gap-2">
              <Plane className="h-4 w-4" />
              Travel Plans
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Social Feed
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Avatar className="h-4 w-4">
                <AvatarFallback>👤</AvatarFallback>
              </Avatar>
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Travel Plans Tab */}
          <TabsContent value="travel-plans" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Travel Plan Form */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Add New Travel Plan
                  </CardTitle>
                  <CardDescription>Plan your next journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTravelPlan} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Travel Mode</label>
                        <Select 
                          value={travelPlanForm.mode || 'flight'} 
                          onValueChange={handleTravelModeChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flight">✈️ Flight</SelectItem>
                            <SelectItem value="boat">⛵ Boat</SelectItem>
                            <SelectItem value="taxi">🚕 Taxi</SelectItem>
                            <SelectItem value="bus">🚌 Bus</SelectItem>
                            <SelectItem value="train">🚆 Train</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Travel Provider</label>
                        <Input
                          value={travelPlanForm.travel_provider || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                              ...prev,
                              travel_provider: e.target.value || null
                            }))
                          }
                          placeholder="e.g., Delta Airlines"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">From</label>
                        <Input
                          value={travelPlanForm.departure_location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                              ...prev,
                              departure_location: e.target.value
                            }))
                          }
                          placeholder="Departure location"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">To</label>
                        <Input
                          value={travelPlanForm.arrival_location}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                              ...prev,
                              arrival_location: e.target.value
                            }))
                          }
                          placeholder="Arrival location"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Departure</label>
                        <Input
                          type="datetime-local"
                          value={travelPlanForm.departure_time.toISOString().slice(0, 16)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                              ...prev,
                              departure_time: new Date(e.target.value)
                            }))
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Arrival</label>
                        <Input
                          type="datetime-local"
                          value={travelPlanForm.arrival_time.toISOString().slice(0, 16)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                              ...prev,
                              arrival_time: new Date(e.target.value)
                            }))
                          }
                          required
                        />
                      </div>
                    </div>

                    <Input
                      value={travelPlanForm.booking_reference || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                          ...prev,
                          booking_reference: e.target.value || null
                        }))
                      }
                      placeholder="Booking reference (optional)"
                    />

                    <Textarea
                      value={travelPlanForm.additional_info || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setTravelPlanForm((prev: CreateTravelPlanInput) => ({
                          ...prev,
                          additional_info: e.target.value || null
                        }))
                      }
                      placeholder="Additional information (optional)"
                    />

                    <Button type="submit" className="w-full">
                      Add Travel Plan
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Travel Plans List */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Your Travel Plans</CardTitle>
                  <CardDescription>Upcoming and past journeys</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {travelPlans.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No travel plans yet. Add your first journey! ✈️
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {travelPlans.map((plan: TravelPlan) => (
                          <div key={plan.id} className="border rounded-lg p-4 bg-white/50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{getTravelModeIcon(plan.mode)}</span>
                                <div>
                                  <p className="font-semibold">
                                    {plan.departure_location} → {plan.arrival_location}
                                  </p>
                                  {plan.travel_provider && (
                                    <p className="text-sm text-gray-600">{plan.travel_provider}</p>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline">{plan.mode}</Badge>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>🛫 Departure: {plan.departure_time.toLocaleString()}</p>
                              <p>🛬 Arrival: {plan.arrival_time.toLocaleString()}</p>
                              {plan.booking_reference && (
                                <p>📄 Reference: {plan.booking_reference}</p>
                              )}
                              {plan.additional_info && (
                                <p>📝 Note: {plan.additional_info}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Travel Documents
                </CardTitle>
                <CardDescription>
                  Securely store your important travel documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No documents uploaded yet</p>
                    <p className="text-sm text-gray-400">
                      Upload your passport, visa, and other travel documents for secure storage
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc: TravelDocument) => (
                      <div key={doc.id} className="border rounded-lg p-4 bg-white/50">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{doc.type}</Badge>
                          <span className="text-sm text-gray-500">
                            {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                          </span>
                        </div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Uploaded: {doc.created_at.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Feed Tab */}
          <TabsContent value="social" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Post Form */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Share Your Experience
                  </CardTitle>
                  <CardDescription>Tell other travelers about your journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePost} className="space-y-4">
                    <Textarea
                      value={postForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setPostForm((prev: CreatePostInput) => ({
                          ...prev,
                          content: e.target.value
                        }))
                      }
                      placeholder="Share your travel experience... 🌍"
                      className="min-h-[100px]"
                      required
                    />
                    <Input
                      value={postForm.location || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPostForm((prev: CreatePostInput) => ({
                          ...prev,
                          location: e.target.value || null
                        }))
                      }
                      placeholder="📍 Location (optional)"
                    />
                    <Button type="submit" className="w-full">
                      Share Post
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Posts Feed */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Travel Stories</CardTitle>
                  <CardDescription>See what other travelers are sharing</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {posts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No posts yet. Be the first to share! 📸
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {posts.map((post: Post) => (
                          <div key={post.id} className="border rounded-lg p-4 bg-white/50">
                            <div className="flex items-center gap-3 mb-3">
                              <Avatar>
                                <AvatarFallback>👤</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">Traveler</p>
                                <p className="text-xs text-gray-500">
                                  {post.created_at.toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <p className="mb-2">{post.content}</p>
                            {post.location && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {post.location}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Message Form */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Message
                  </CardTitle>
                  <CardDescription>Connect with other travelers</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendMessage} className="space-y-4">
                    <Input
                      value={messageForm.recipient_id}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setMessageForm((prev: CreateMessageInput) => ({
                          ...prev,
                          recipient_id: e.target.value
                        }))
                      }
                      placeholder="Recipient ID"
                      required
                    />
                    <Textarea
                      value={messageForm.content}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setMessageForm((prev: CreateMessageInput) => ({
                          ...prev,
                          content: e.target.value
                        }))
                      }
                      placeholder="Type your message..."
                      className="min-h-[100px]"
                      required
                    />
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Messages List */}
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Your Conversations</CardTitle>
                  <CardDescription>Recent messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">
                        No messages yet. Start a conversation! 💬
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message: Message) => (
                          <div key={message.id} className="border rounded-lg p-4 bg-white/50">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm">
                                {message.sender_id === CURRENT_USER_ID ? 'You' : `From: ${message.sender_id}`}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant={message.is_read ? 'secondary' : 'default'}>
                                  {message.is_read ? 'Read' : 'Unread'}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {message.created_at.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Discover Fellow Travelers
                </CardTitle>
                <CardDescription>
                  Connect with travelers who share your interests and destinations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {discoveredTravelers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No travelers found</p>
                    <p className="text-sm text-gray-400">
                      Make sure your profile is discoverable to connect with others
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {discoveredTravelers.map((traveler: User) => (
                      <div key={traveler.id} className="border rounded-lg p-4 bg-white/50">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarImage src={traveler.image || undefined} />
                            <AvatarFallback>
                              {traveler.name ? traveler.name.charAt(0).toUpperCase() : '👤'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{traveler.name || 'Anonymous Traveler'}</p>
                            {traveler.location && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {traveler.location}
                              </p>
                            )}
                          </div>
                        </div>
                        {traveler.bio && (
                          <p className="text-sm text-gray-600 mb-3">{traveler.bio}</p>
                        )}
                        {traveler.interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {traveler.interests.slice(0, 3).map((interest: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => setMessageForm((prev: CreateMessageInput) => ({
                            ...prev,
                            recipient_id: traveler.id
                          }))}
                        >
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>👤</AvatarFallback>
                  </Avatar>
                  Your Travel Profile
                </CardTitle>
                <CardDescription>
                  Customize your profile to connect with fellow travelers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Display Name</label>
                      <Input
                        value={profileForm.name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProfileForm((prev: UpdateUserInput) => ({
                            ...prev,
                            name: e.target.value || null
                          }))
                        }
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={profileForm.location || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProfileForm((prev: UpdateUserInput) => ({
                            ...prev,
                            location: e.target.value || null
                          }))
                        }
                        placeholder="Where are you based?"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea
                      value={profileForm.bio || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setProfileForm((prev: UpdateUserInput) => ({
                          ...prev,
                          bio: e.target.value || null
                        }))
                      }
                      placeholder="Tell others about yourself and your travel style..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Interests</label>
                    <Input
                      value={profileForm.interests?.join(', ') || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileForm((prev: UpdateUserInput) => ({
                          ...prev,
                          interests: e.target.value ? e.target.value.split(',').map(s => s.trim()) : []
                        }))
                      }
                      placeholder="e.g., hiking, photography, food, culture (comma-separated)"
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Discoverable Profile</p>
                      <p className="text-xs text-gray-500">
                        Allow other travelers to find and connect with you
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={profileForm.is_discoverable ? "default" : "outline"}
                      onClick={() =>
                        setProfileForm((prev: UpdateUserInput) => ({
                          ...prev,
                          is_discoverable: !prev.is_discoverable
                        }))
                      }
                    >
                      {profileForm.is_discoverable ? 'Discoverable' : 'Private'}
                    </Button>
                  </div>

                  <Button type="submit" className="w-full">
                    Update Profile
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
