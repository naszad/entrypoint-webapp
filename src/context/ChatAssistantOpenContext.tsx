import React, { createContext, useContext, useState } from "react";

type ChatAssistantOpenContextType = {
  isChatAssistantOpen: boolean;
  setIsChatAssistantOpen: (open: boolean) => void;
};

const ChatAssistantOpenContext = createContext<ChatAssistantOpenContextType>({
  isChatAssistantOpen: false,
  setIsChatAssistantOpen: () => {},
});

export const ChatAssistantOpenProvider = ({ children }: { children: React.ReactNode }) => {
  const [isChatAssistantOpen, setIsChatAssistantOpen] = useState(false);
  return (
    <ChatAssistantOpenContext.Provider value={{ isChatAssistantOpen, setIsChatAssistantOpen }}>
      {children}
    </ChatAssistantOpenContext.Provider>
  );
};

export const useChatAssistantOpen = () => useContext(ChatAssistantOpenContext); 