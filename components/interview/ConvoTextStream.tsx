/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  X,
  ChevronsUpDown, // Changed icon
  ArrowDownToLine, // Changed icon
  Expand, // Added icon for expand
  Shrink, // Added icon for shrink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMessageStatus, IMessageListItem } from '@/lib/message';

interface ConvoTextStreamProps {
  messageList: IMessageListItem[];
  currentInProgressMessage?: IMessageListItem | null;
  agentUID: string | number | undefined; // Allow number or string
}

export default function ConvoTextStream({
  messageList,
  currentInProgressMessage = null,
  agentUID,
}: ConvoTextStreamProps) {
  const [isOpen, setIsOpen] = useState(false);
  console.log('ConvoTextStream Render:', { 
    msgCount: messageList.length, 
    inProgress: currentInProgressMessage ? { txt: currentInProgressMessage.text, status: currentInProgressMessage.status } : 'null', 
    agentUID,
    isOpen 
  });
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageLengthRef = useRef(messageList.length);
  const prevMessageTextRef = useRef('');
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const hasSeenFirstMessageRef = useRef(false);
  const significantChangeScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // --- Scrolling Logic ---

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150; // Increased threshold slightly
    if (isNearBottom !== shouldAutoScroll) {
      setShouldAutoScroll(isNearBottom);
    }
  }, [shouldAutoScroll]);

  const hasContentChangedSignificantly = useCallback(
    (threshold = 20): boolean => {
      if (!currentInProgressMessage) return false;
      const currentText = currentInProgressMessage.text || '';
      // Only compare if the message is actually in progress
      const baseText =
        currentInProgressMessage.status === EMessageStatus.IN_PROGRESS
          ? prevMessageTextRef.current
          : currentText;
      const textLengthDiff = currentText.length - baseText.length;
      const hasSignificantChange = textLengthDiff >= threshold;

      // Update ref immediately if it's a significant change or message finished/interrupted
      if (
        hasSignificantChange ||
        currentInProgressMessage.status !== EMessageStatus.IN_PROGRESS
      ) {
        prevMessageTextRef.current = currentText;
      }
      return hasSignificantChange;
    },
    [currentInProgressMessage]
  );

  useEffect(() => {
    const hasNewCompleteMessage =
      messageList.length > prevMessageLengthRef.current;
    // Check significance *only* if we should be auto-scrolling
    const streamingContentChanged =
      shouldAutoScroll && hasContentChangedSignificantly();

    if (significantChangeScrollTimer.current) {
      clearTimeout(significantChangeScrollTimer.current);
      significantChangeScrollTimer.current = null;
    }

    if (
      (hasNewCompleteMessage || streamingContentChanged) &&
      scrollRef.current
    ) {
      // Debounce scrolling slightly
      significantChangeScrollTimer.current = setTimeout(() => {
        scrollToBottom();
        significantChangeScrollTimer.current = null;
      }, 50);
    }

    prevMessageLengthRef.current = messageList.length;

    return () => {
      if (significantChangeScrollTimer.current) {
        clearTimeout(significantChangeScrollTimer.current);
      }
    };
  }, [
    messageList,
    currentInProgressMessage?.text,
    shouldAutoScroll,
    scrollToBottom,
    hasContentChangedSignificantly,
  ]);

  // --- Component Logic ---

  const shouldShowStreamingMessage = useCallback((): boolean => {
    return (
      currentInProgressMessage !== null &&
      currentInProgressMessage.status === EMessageStatus.IN_PROGRESS &&
      currentInProgressMessage.text.trim().length > 0
    );
  }, [currentInProgressMessage]);

  const toggleChat = useCallback(() => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState) {
      hasSeenFirstMessageRef.current = true; // Mark as seen if manually opened
    }
  }, [isOpen]);

  const toggleChatExpanded = useCallback(() => {
    setIsChatExpanded(!isChatExpanded);
    // Attempt to scroll to bottom after expanding/shrinking
    setTimeout(scrollToBottom, 50);
  }, [isChatExpanded, scrollToBottom]);

  // Auto-open logic
  useEffect(() => {
    const hasAnyMessage =
      messageList.length > 0 || shouldShowStreamingMessage();
    if (hasAnyMessage && !hasSeenFirstMessageRef.current && !isOpen) {
      setIsOpen(true);
      hasSeenFirstMessageRef.current = true;
    }
  }, [
    messageList,
    currentInProgressMessage,
    isOpen,
    shouldShowStreamingMessage,
  ]);

  // Combine messages for rendering
  const allMessagesToRender = [...messageList];
  if (shouldShowStreamingMessage() && currentInProgressMessage) {
    allMessagesToRender.push(currentInProgressMessage);
  }
  
  console.log('ConvoTextStream: allMessagesToRender', allMessagesToRender.length);

  // --- JSX ---
  return (
    // Use a more descriptive ID if needed, ensure z-index is appropriate
    <div
      id="agora-text-stream-chatbox"
      className="fixed bottom-24 right-4 md:right-8 z-50"
    >
      {isOpen ? (
        <div
          className={cn(
            'bg-white rounded-lg shadow-xl w-80 md:w-96 flex flex-col text-black transition-all duration-300 ease-in-out', // Adjusted width and added transition
            // Dynamic height based on expanded state
            isChatExpanded ? 'h-[60vh] max-h-[500px]' : 'h-80'
          )}
        >
          {/* Header */}
          <div className="p-2 border-b flex justify-between items-center shrink-0 bg-gray-50 rounded-t-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChatExpanded}
              aria-label={isChatExpanded ? 'Shrink chat' : 'Expand chat'}
            >
              {isChatExpanded ? (
                <Shrink className="h-4 w-4" />
              ) : (
                <Expand className="h-4 w-4" />
              )}
            </Button>
            <h3 className="font-semibold text-sm md:text-base">Conversation</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleChat}
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message Area */}
          <div
            className="flex-1 overflow-y-auto scroll-smooth" // Use overflow-y-auto
            ref={scrollRef}
            onScroll={handleScroll}
          >
            <div className="p-3 md:p-4 space-y-3">
              {allMessagesToRender.map((message, index) => {
                const isAgent =
                  message.uid === 0 ||
                  message.uid?.toString() === agentUID?.toString();
                return (
                  <div
                    key={`${message.turn_id}-${message.uid}-${index}`} // Use index as last resort for key part
                    className={cn(
                      'flex items-start gap-2 w-full',
                      isAgent ? 'justify-start' : 'justify-end'
                    )}
                  >
                    {/* Optional: Render avatar only for AI or based on settings */}
                    {/* {isAgent && <Avatar ... />} */}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3 py-2 text-sm md:text-base shadow-sm', // Slightly softer corners, shadow
                        isAgent
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-500 text-white'
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })}
              {/* Add a small spacer at the bottom */}
              <div className="h-2"></div>
            </div>
          </div>
          {/* Optional Footer Area (e.g., for input later) */}
          {/* <div className="p-2 border-t shrink-0">...</div> */}
        </div>
      ) : (
        // Floating Action Button (FAB) to open chat
        <Button
          onClick={toggleChat}
          className="rounded-full w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-105 transition-all duration-200"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}