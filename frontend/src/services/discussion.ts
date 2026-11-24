import { apiClient } from './api';
import type { 
  Post, 
  PostListResponse, 
  PostCreateInput, 
  Comment, 
  CommentCreateInput, 
  ReactionType, 
  ReactionToggleResponse 
} from '../types/discussion';

export const discussionService = {
  async getPosts(params?: {
    search?: string;
    category?: string;
    community_id?: string;
    community_slug?: string;
    author_id?: string;
    sort?: 'newest' | 'popular' | 'most_discussed';
    skip?: number;
    limit?: number;
  }): Promise<PostListResponse> {
    const res = await apiClient.get<PostListResponse>('/posts', { params });
    return res.data;
  },

  async getPost(id: string): Promise<Post> {
    const res = await apiClient.get<Post>(`/posts/${id}`);
    return res.data;
  },

  async createPost(data: PostCreateInput): Promise<Post> {
    const res = await apiClient.post<Post>('/posts', data);
    return res.data;
  },

  async updatePost(id: string, data: Partial<PostCreateInput>): Promise<Post> {
    const res = await apiClient.put<Post>(`/posts/${id}`, data);
    return res.data;
  },

  async deletePost(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/posts/${id}`);
    return res.data;
  },

  async togglePin(id: string): Promise<{ message: string; is_pinned: boolean }> {
    const res = await apiClient.post<{ message: string; is_pinned: boolean }>(`/posts/${id}/pin`);
    return res.data;
  },

  async getComments(postId: string): Promise<Comment[]> {
    const res = await apiClient.get<Comment[]>(`/posts/${postId}/comments`);
    return res.data;
  },

  async addComment(postId: string, data: CommentCreateInput): Promise<Comment> {
    const res = await apiClient.post<Comment>(`/posts/${postId}/comments`, data);
    return res.data;
  },

  async deleteComment(commentId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/posts/comments/${commentId}`);
    return res.data;
  },

  async toggleReaction(postId: string, reactionType: ReactionType): Promise<ReactionToggleResponse> {
    const res = await apiClient.post<ReactionToggleResponse>(`/posts/${postId}/reactions`, {
      reaction_type: reactionType,
    });
    return res.data;
  },

  async toggleBookmark(postId: string): Promise<{ message: string; is_bookmarked: boolean }> {
    const res = await apiClient.post<{ message: string; is_bookmarked: boolean }>(`/posts/${postId}/bookmark`);
    return res.data;
  },

  async getSavedBookmarks(skip = 0, limit = 20): Promise<PostListResponse> {
    const res = await apiClient.get<PostListResponse>('/posts/bookmarks/saved', {
      params: { skip, limit },
    });
    return res.data;
  },
};
