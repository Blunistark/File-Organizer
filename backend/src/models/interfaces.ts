// Define system interfaces

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface File {
  id: string;
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  path: string;
  folderId: string | null;
  content: string | null;
  contentVector: any | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileTag {
  fileId: string;
  tagId: string;
}

export interface OrganizationSuggestion {
  fileId: string;
  suggestedFolderId: string;
  confidence: number;
  reason: string;
  createdAt: Date;
  accepted: boolean | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 