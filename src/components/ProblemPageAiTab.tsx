"use client";
import { History, Loader2, Plus, SendHorizontal, Sparkles } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from "@/components/ui/scroll-area"
import ProblemPageInputOutputMessage from './ProblemPageInputOutputMessage';
import { chatOutputValidation } from '@/schemas/chatOutputSchema';
import { toast } from 'sonner';
import axios from 'axios';
import { ApiResponse } from '@/types/ApiResponse';

export default function ProblemPageAiTab({ sourceCode, theme }: { sourceCode: string, theme: string | undefined }) {
    const [chats, setChats] = useState<{ input: string; output: string }[]>([]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [message, setMessage] = useState<{ input: string, output: string }>({
        input: "",
        output: ""
    });
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage({
            input: e.target.value,
            output: ""
        })
    }


    const handleChatOutput = async () => {
        const data = {
            inputMessage: message.input,
            ...(sourceCode.trim() ? { sourceCode } : {})
        }

        const parsedData = chatOutputValidation.safeParse(data);
        if (!parsedData.success) {
            toast.error(parsedData.error.issues[0].message);
            return;
        }
        const chatRequest = parsedData.data;

        setMessage({
            input: "",
            output: ""
        });
        setChats(prev => [...prev, { input: chatRequest.inputMessage, output: "" }]);

        setIsSubmitting(true);
        try {
            const result = await axios.post<ApiResponse>("/api/code/chat-output", chatRequest);

            setChats(prev => {
                const newChats = [...prev];
                newChats[newChats.length - 1].output = result.data.output || "";
                return newChats;
            });

        } catch (error) {
            setChats(prev => prev.slice(0, -1));
            setMessage(current => current.input
                ? current
                : { input: chatRequest.inputMessage, output: "" });
            if (axios.isAxiosError(error) && error.response) {
                const errorMessage = error.response.data?.message || "The AI assistant request failed.";
                toast.error(errorMessage);
                console.error("Chat output route error:", errorMessage);
            } else {
                toast.error("Could not reach the AI assistant. Check your connection and try again.");
                console.error("Error in chat output route:", error);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    // since scrollArea is a shadcn element we have to change the scroll bottom code
    useEffect(() => {
        const scroll = scrollRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]"
        ) as HTMLElement | null;

        if (scroll) {
            scroll.scrollTop = scroll.scrollHeight;
        }
    }, [chats]);

    return (
        <div style={{ background: "var(--card)" }} className='w-full min-h-[calc(100vh-6.5rem)] flex flex-col'>
            <div className="w-full flex justify-between items-center border-b py-3 px-4">
                <h1 className='flex items-center gap-3 font-semibold '><Sparkles className='resize-custom w-5 text-primary' /> CodeArena AI</h1>
                <div className="flex gap-4 items-center">
                    <Plus className={`resize-custom w-5 ${theme === "dark" ? 'text-neutral-400' : ''}`} />
                    <History className={`resize-custom w-5 ${theme === "dark" ? 'text-neutral-400' : ''}`} />
                </div>
            </div>
            <div className="w-full h-[calc(100vh-10rem)] pt-4 pb-8 px-2">
                <ScrollArea ref={scrollRef} className="w-full h-[70%] pb-1 px-6">
                    {chats.length === 0 &&
                        <div className="w-full h-[21rem] flex flex-col justify-center items-center">
                            <img src="/emoji.png" alt="" className="w-20 mb-4" />
                            <h2 className="text-gray-500">Stuck? CodeArena AI can help you think it through.</h2>
                            <h2 className="text-gray-500">Ask questions about the problem or your code.</h2>
                            <h2 className="text-gray-500">Start a conversation with CodeArena AI.</h2>
                            <h2 className="text-primary-bright">Subscribe to primium</h2>
                        </div>
                    }
                    <ProblemPageInputOutputMessage chats={chats} isSubmitting={isSubmitting} />
                </ScrollArea>
                <div className="w-full h-[30%] flex justify-center">
                    <div className="w-[42rem] h-full flex justify-center items-start relative border-2 border-primary rounded-lg py-3">
                        <textarea onChange={handleTextAreaChange} maxLength={4000} className='w-[40rem] h-20 resize-none outline-none' placeholder='Ask CodeArena for guidance… no need to send your code.' value={message.input}></textarea>
                        <div className="w-full absolute bottom-0 left-0  flex justify-between items-center px-4 py-1">
                            <div className="w-30 border flex items-center justify-between py-1.5 px-3 rounded-full">
                                <img src="/gemini logo.png" alt="" className="w-7 h-7 bg-white rounded-full p-0.5" />
                                <h3 className="">Gemini</h3>
                            </div>
                            <Button onClick={handleChatOutput} disabled={isSubmitting} variant="outline" className='w-9 h-9 rounded-full p-1 cursor-pointer'>{!isSubmitting ? <SendHorizontal className='resize-custom w-6 -rotate-90 text-gray-500' /> :
                                <Loader2 className='resize-custom w-6 -rotate-90 animate-spin text-gray-500' />}</Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
