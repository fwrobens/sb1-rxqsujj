import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, MoreVertical, Phone, Video, UserPlus, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';

interface Message {
  id: string;
  text: string;
  createdAt: any;
  uid: string;
  photoURL?: string;
  displayName?: string;
}

interface User {
  uid: string;
  email: string;
  photoURL?: string;
  displayName?: string;
}

export default function ChatApp() {
  const [user] = useAuthState(auth);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query messages between current user and selected user
  const messagesRef = collection(db, 'messages');
  const messagesQuery = query(
    messagesRef,
    where('participants', 'array-contains', user?.uid || ''),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  const [messagesSnapshot] = useCollection(messagesQuery);
  const messages = messagesSnapshot?.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Message[];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      await addDoc(messagesRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        uid: user?.uid,
        recipientUid: selectedUser.uid,
        participants: [user?.uid, selectedUser.uid],
      });

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white overflow-hidden">
      {/* Left sidebar - User list */}
      <motion.div 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col"
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-purple-400">{user?.email}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="flex space-x-2">
            <Input
              className="flex-1 bg-gray-700 border-none text-white placeholder-gray-400"
              placeholder="Search users"
              type="search"
            />
            <Button 
              variant="ghost" 
              size="icon"
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-900"
              onClick={() => setIsAddUserOpen(true)}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-grow">
          {/* User list will be populated here */}
        </ScrollArea>
      </motion.div>

      {/* Right side - Chat window */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex flex-col"
      >
        {selectedUser ? (
          <>
            {/* Chat header */}
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.photoURL || ''} />
                  <AvatarFallback>{selectedUser.email[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="font-semibold text-purple-300">{selectedUser.email}</h2>
                  <p className="text-sm text-gray-400">Online</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-purple-400 hover:text-purple-300">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages?.map((msg: Message) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.uid === user?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.uid === user?.uid
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="text-xs opacity-75 mt-1 block">
                        {msg.createdAt?.toDate().toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="bg-gray-800 p-4 border-t border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-gray-700 border-none text-white placeholder-gray-400" 
                  placeholder="Type a message..." 
                />
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <p>Select a user to start chatting</p>
          </div>
        )}
      </motion.div>

      {/* Add New User Modal */}
      <AnimatePresence>
        {isAddUserOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-gray-800 p-6 rounded-lg shadow-lg w-96"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-purple-300">Add New User</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAddUserOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <Input 
                className="w-full mb-4 bg-gray-700 border-none text-white placeholder-gray-400" 
                placeholder="Enter email address" 
              />
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Add User
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}