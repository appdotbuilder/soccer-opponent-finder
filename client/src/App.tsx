
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { 
  MatchPost, 
  CreateMatchPostInput, 
  RegisterUserInput, 
  LoginUserInput, 
  AuthResponse, 
  MatchPostFilters,
  SkillLevel 
} from '../../server/src/schema';

interface AuthState {
  isAuthenticated: boolean;
  user: AuthResponse['user'] | null;
  token: string | null;
}

function App() {
  // Authentication state
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null
  });

  // App state
  const [currentView, setCurrentView] = useState<'posts' | 'create' | 'myPosts'>('posts');
  const [matchPosts, setMatchPosts] = useState<MatchPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Authentication forms
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: ''
  });

  // Match post form
  const [postForm, setPostForm] = useState<Omit<CreateMatchPostInput, 'user_id'>>({
    team_name: '',
    skill_level: 'Beginner' as SkillLevel,
    match_date: new Date(),
    location: '',
    field_name: null,
    contact_info: '',
    description: null
  });

  // Filters
  const [filters, setFilters] = useState<MatchPostFilters>({});

  // Load match posts
  const loadMatchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      if (currentView === 'myPosts' && auth.user) {
        const result = await trpc.getUserMatchPosts.query(auth.user.id);
        setMatchPosts(result);
      } else {
        const result = await trpc.getMatchPosts.query(filters);
        setMatchPosts(result);
      }
    } catch (error) {
      console.error('Failed to load match posts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentView, auth.user, filters]);

  useEffect(() => {
    loadMatchPosts();
  }, [loadMatchPosts]);

  // Authentication handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const loginData: LoginUserInput = {
          email: authForm.email,
          password: authForm.password
        };
        const response = await trpc.loginUser.mutate(loginData);
        setAuth({
          isAuthenticated: true,
          user: response.user,
          token: response.token
        });
      } else {
        const registerData: RegisterUserInput = {
          email: authForm.email,
          password: authForm.password,
          name: authForm.name,
          phone: authForm.phone || null
        };
        await trpc.registerUser.mutate(registerData);
        // Auto-login after registration
        const loginResponse = await trpc.loginUser.mutate({
          email: authForm.email,
          password: authForm.password
        });
        setAuth({
          isAuthenticated: true,
          user: loginResponse.user,
          token: loginResponse.token
        });
      }
      setShowAuth(false);
      setAuthForm({ email: '', password: '', name: '', phone: '' });
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null
    });
    setCurrentView('posts');
  };

  // Match post creation
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.user) return;
    
    setIsLoading(true);
    try {
      const createData: CreateMatchPostInput = {
        ...postForm,
        user_id: auth.user.id
      };
      const newPost = await trpc.createMatchPost.mutate(createData);
      setMatchPosts((prev: MatchPost[]) => [newPost, ...prev]);
      setPostForm({
        team_name: '',
        skill_level: 'Beginner',
        match_date: new Date(),
        location: '',
        field_name: null,
        contact_info: '',
        description: null
      });
      setCurrentView('posts');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId: number) => {
    try {
      await trpc.deleteMatchPost.mutate(postId);
      setMatchPosts((prev: MatchPost[]) => prev.filter((post: MatchPost) => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof MatchPostFilters, value: string | Date | null) => {
    setFilters((prev: MatchPostFilters) => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">⚽</span>
              <h1 className="text-2xl font-bold text-green-700">SoccerMatch</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {auth.isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">Welcome, {auth.user?.name}!</span>
                  <Button
                    variant={currentView === 'posts' ? 'default' : 'outline'}
                    onClick={() => setCurrentView('posts')}
                    size="sm"
                  >
                    All Matches
                  </Button>
                  <Button
                    variant={currentView === 'create' ? 'default' : 'outline'}
                    onClick={() => setCurrentView('create')}
                    size="sm"
                  >
                    Create Post
                  </Button>
                  <Button
                    variant={currentView === 'myPosts' ? 'default' : 'outline'}
                    onClick={() => setCurrentView('myPosts')}
                    size="sm"
                  >
                    My Posts
                  </Button>
                  <Button variant="ghost" onClick={handleLogout} size="sm">
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowAuth(true)}>
                  Login / Register
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Authentication Dialog */}
        <AlertDialog open={showAuth} onOpenChange={setShowAuth}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {authMode === 'login' ? 'Login' : 'Register'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {authMode === 'login' 
                  ? 'Enter your credentials to access your account'
                  : 'Create a new account to start posting matches'
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <form onSubmit={handleAuth}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAuthForm((prev) => ({ ...prev, password: e.target.value }))
                    }
                    required
                  />
                </div>
                
                {authMode === 'register' && (
                  <>
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={authForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={authForm.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </>
                )}
              </div>
              
              <AlertDialogFooter className="mt-6">
                <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                <AlertDialogAction type="submit" disabled={isLoading}>
                  {isLoading ? 'Processing...' : (authMode === 'login' ? 'Login' : 'Register')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
            
            <div className="text-center mt-4">
              <Button
                variant="link"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              >
                {authMode === 'login' 
                  ? "Don't have an account? Register" 
                  : "Already have an account? Login"
                }
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Post Form */}
        {currentView === 'create' && auth.isAuthenticated && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>⚽</span>
                <span>Create Match Post</span>
              </CardTitle>
              <CardDescription>
                Post your team's availability for a match
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <Label htmlFor="team_name">Team Name</Label>
                  <Input
                    id="team_name"
                    value={postForm.team_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev) => ({ ...prev, team_name: e.target.value }))
                    }
                    placeholder="e.g., Lightning Bolts FC"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="skill_level">Skill Level</Label>
                  <Select
                    value={postForm.skill_level}
                    onValueChange={(value: SkillLevel) =>
                      setPostForm((prev) => ({ ...prev, skill_level: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select skill level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">🌱 Beginner</SelectItem>
                      <SelectItem value="Intermediate">⚡ Intermediate</SelectItem>
                      <SelectItem value="Advanced">🏆 Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="match_date">Match Date & Time</Label>
                  <Input
                    id="match_date"
                    type="datetime-local"
                    value={postForm.match_date.toISOString().slice(0, 16)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev) => ({ ...prev, match_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={postForm.location}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g., Central Park, New York"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="field_name">Field Name (Optional)</Label>
                  <Input
                    id="field_name"
                    value={postForm.field_name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev) => ({ ...prev, field_name: e.target.value || null }))
                    }
                    placeholder="e.g., Field #3, East Soccer Complex"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_info">Contact Information</Label>
                  <Input
                    id="contact_info"
                    value={postForm.contact_info}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPostForm((prev) => ({ ...prev, contact_info: e.target.value }))
                    }
                    placeholder="e.g., john@email.com or (555) 123-4567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Additional Notes (Optional)</Label>
                  <Textarea
                    id="description"
                    value={postForm.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setPostForm((prev) => ({ ...prev, description: e.target.value || null }))
                    }
                    placeholder="Any additional details about the match..."
                    rows={3}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Post...' : '🚀 Post Match Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Match Posts List */}
        {(currentView === 'posts' || currentView === 'myPosts') && (
          <div className="space-y-6">
            {/* Filters (only for all posts view) */}
            {currentView === 'posts' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>🔍</span>
                    <span>Filter Matches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Skill Level</Label>
                      <Select
                        value={filters.skill_level || 'all'}
                        onValueChange={(value: string) =>
                          handleFilterChange('skill_level', value === 'all' ? null : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any level</SelectItem>
                          <SelectItem value="Beginner">🌱 Beginner</SelectItem>
                          <SelectItem value="Intermediate">⚡ Intermediate</SelectItem>
                          <SelectItem value="Advanced">🏆 Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Location</Label>
                      <Input
                        value={filters.location || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange('location', e.target.value)
                        }
                        placeholder="Filter by location"
                      />
                    </div>

                    <div>
                      <Label>From Date</Label>
                      <Input
                        type="date"
                        value={filters.date_from?.toISOString().split('T')[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange('date_from', e.target.value ? new Date(e.target.value) : null)
                        }
                      />
                    </div>

                    <div>
                      <Label>To Date</Label>
                      <Input
                        type="date"
                        value={filters.date_to?.toISOString().split('T')[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleFilterChange('date_to', e.target.value ? new Date(e.target.value) : null)
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    {Object.keys(filters).length > 0 && (
                      <div className="text-sm text-gray-600">
                        {Object.keys(filters).length} filter(s) applied
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Posts Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {currentView === 'myPosts' ? '⚽ Your Match Posts' : '🏟️ Available Matches'}
              </h2>
              <div className="text-sm text-gray-600">
                {matchPosts.length} {matchPosts.length === 1 ? 'match' : 'matches'} found
              </div>
            </div>

            {/* Posts List */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="text-lg">Loading matches...</div>
              </div>
            ) : matchPosts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-4xl mb-4">⚽</div>
                  <div className="text-lg font-medium mb-2">
                    {currentView === 'myPosts' ? 'No posts yet' : 'No matches found'}
                  </div>
                  <div className="text-gray-600">
                    {currentView === 'myPosts' 
                      ? 'Create your first match post to find opponents!'
                      : 'Try adjusting your filters or check back later.'
                    }
                  </div>
                  {currentView === 'myPosts' && auth.isAuthenticated && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setCurrentView('create')}
                    >
                      Create First Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {matchPosts.map((post: MatchPost) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-green-700 mb-1">
                            {post.team_name}
                          </h3>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant={
                              post.skill_level === 'Beginner' ? 'secondary' :
                              post.skill_level === 'Intermediate' ? 'default' : 'destructive'
                            }>
                              {post.skill_level === 'Beginner' && '🌱'}
                              {post.skill_level === 'Intermediate' && '⚡'}
                              {post.skill_level === 'Advanced' && '🏆'}
                              {' '}{post.skill_level}
                            </Badge>
                            {!post.is_active && (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        
                        {currentView === 'myPosts' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Match Post</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this match post? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePost(post.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                            <span>📅</span>
                            <span>
                              {post.match_date.toLocaleDateString()} at{' '}
                              {post.match_date.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📍</span>
                            <span>{post.location}</span>
                          </div>
                          {post.field_name && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                              <span>🏟️</span>
                              <span>{post.field_name}</span>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>📞</span>
                            <span>{post.contact_info}</span>
                          </div>
                        </div>
                      </div>

                      {post.description && (
                        <>
                          <Separator className="my-3" />
                          <p className="text-sm text-gray-700">{post.description}</p>
                        </>
                      )}

                      <div className="mt-4 pt-3 border-t text-xs text-gray-500">
                        Posted on {post.created_at.toLocaleDateString()}
                        {post.updated_at.getTime() !== post.created_at.getTime() && (
                          <span> • Updated {post.updated_at.toLocaleDateString()}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unauthenticated state */}
        {!auth.isAuthenticated && (
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="py-12">
              <div className="text-6xl mb-6">⚽</div>
              <h2 className="text-2xl font-bold mb-4">Welcome to SoccerMatch!</h2>
              <p className="text-gray-600 mb-6">
                Connect with other soccer teams in your area. Find opponents, organize matches, 
                and grow your local soccer community.
              </p>
              <Button onClick={() => setShowAuth(true)} size="lg">
                Get Started
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

export default App;
