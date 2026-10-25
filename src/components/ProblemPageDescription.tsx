"use client";
import React, { useEffect, useState } from 'react'
import { IProblem } from '@/models/Problem'
import MDEditor from '@uiw/react-md-editor';
import { CircleCheckBig, Lock, Tag } from 'lucide-react';
import ProblemPageCollapseButton from './ProblemPageCollapseButton';
import { IUser } from '@/models/User';
import type { CodeArenaSession } from "@/context/AuthProvider";
import axios from 'axios';
import { toast } from 'sonner';
import { ApiResponse } from '@/types/ApiResponse';

export default function ProblemPageDescription({ problemInfo, session }: { problemInfo: IProblem, session: CodeArenaSession | null }) {
    const [fullUserInfo, setFullUserInfo] = useState<IUser | null>(null);
    const [isSolved, setIsSolved] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!session) return;

            try {
                const res = await axios.get<ApiResponse>(`/api/user/get-user?userId=${session?.user._id}`);

                setFullUserInfo(res.data.user || null);

            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    console.log("Problem while fetching user info: ", error.response.data.message);
                    toast.error(error.response.data.message);
                } else {
                    console.error("Error while fetching user info: ", error);
                    toast.error("Error while fetching user info");
                }
            }
        }

        fetchUserInfo();
    }, [session]);

    const checkIsProblemSolvedOrnot = (problemId: string): boolean => {
        if (!fullUserInfo) return false;
        for (let i = 0; i < fullUserInfo.solvedQuestions.length; i++) {
            if (fullUserInfo.solvedQuestions[i]._id === problemId) return true;
        }
        return false;
    }

    const problemColors = {
        "Easy": "text-green-500",
        "Medium": "text-yellow-400",
        "Hard": "text-red-500"
    }

    // this is the type of problemColors object
    type problemColorsType = keyof typeof problemColors;

    return (
        <div style={{ background: "var(--card)" }} className="w-full h-full flex flex-col p-4 pb-12">
            <div className="w-full flex justify-between items-center">
                <h1 className="text-2xl font-bold w-[90%] truncate">{problemInfo.title}</h1>
                {checkIsProblemSolvedOrnot(String(problemInfo._id)) &&
                    <h1 className="w-[10%] flex items-center gap-1 text-gray-400 text-sm">Solved <CircleCheckBig className='resize-custom w-4 text-yellow-500' /></h1>
                }
            </div>
            <div className="w-full flex gap-2 mt-10">
                <div className={`text-sm px-2.5 py-1 rounded-full bg-[var(--sidebar-accent)] ${problemColors[problemInfo.level as problemColorsType]}`}>{problemInfo.level}</div>
                <div className="flex gap-1 items-center text-sm px-2.5 py-1 rounded-full bg-[var(--sidebar-accent)]"><Tag className='resize-custom w-4' /> Topics</div>
                <div className="flex gap-1 items-center text-sm px-2.5 py-1 rounded-full bg-[var(--sidebar-accent)] text-primary"><Lock className='resize-custom w-4' /> Companies</div>
            </div>
            <div className="text w-full mt-4 ">
                <MDEditor.Markdown source={(problemInfo.description + problemInfo.examples + problemInfo.constraints)} className="markdown-body customTextWhite w-full" style={{ background: "var(--card)" }} />
            </div>

            <ProblemPageCollapseButton problemInfo={problemInfo} />
        </div>
    )
}
