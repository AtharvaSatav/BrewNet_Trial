export interface Message {
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  _id?: string;
} 