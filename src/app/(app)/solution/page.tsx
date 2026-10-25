"use client";
import DiscussPageSideBox from '@/components/DiscussPageSideBox';
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/helpers/formatDate';
import { ISolution } from '@/models/Solution';
import { ApiResponse } from '@/types/ApiResponse';
import axios from 'axios';
import { SquarePen } from 'lucide-react'
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner';

export default function SolutionPage() {
  const [allSolutions, setAllSolutions] = useState<ISolution[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAllSolutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get<ApiResponse>("/api/solution/all-solutions");

      setAllSolutions(res.data.solutions as ISolution[] || [])
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Problem occur while fetching all solutoins")
        console.log("Problem occur while fetching all solutions: ", error.response.data.message);
      } else {
        toast.error("Error while fetching all solutions")
        console.log("Error while fetching all solutions: ", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setAllSolutions])

  useEffect(() => {
    fetchAllSolutions()
  }, [fetchAllSolutions])

  return (
    <div className='w-full h-[150vh] flex'>
      <div className="w-[80%] h-full flex justify-center pt-8">
        <div className="w-[80%] h-full">
          <div className="w-full h-44 flex gap-4">
            <div className="w-[33%] h-full rounded overflow-hidden">
              <img src="/codearena-interview-dsa.png" alt="CodeArena interview crash course: data structures and algorithms" className="w-full h-full object-cover" />
            </div>
            <div className="w-[33%] h-full rounded overflow-hidden">
              <img src="/codearena-system-design.png" alt="CodeArena interview crash course: system design" className="w-full h-full object-cover" />
            </div>
            <div className="w-[33%] h-full rounded overflow-hidden">
              <img src="/discuss2.png" alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="w-full h-12 mt-4 flex justify-between">
            <div className="flex w-[70%] justify-between">
              <h1 className='px-4 py-1.5 h-10 customBackground rounded-md'>For You</h1>
              <h1 className='px-4 py-1.5 h-10 transition-all duration-300 cursor-pointer hover:bg-[var(--card)] rounded-md'>Career</h1>
              <h1 className='px-4 py-1.5 h-10 transition-all duration-300 cursor-pointer hover:bg-[var(--card)] rounded-md'>Contest</h1>
              <h1 className='px-4 py-1.5 h-10 transition-all duration-300 cursor-pointer hover:bg-[var(--card)] rounded-md'>Compensation</h1>
              <h1 className='px-4 py-1.5 h-10 transition-all duration-300 cursor-pointer hover:bg-[var(--card)] rounded-md'>Feedback</h1>
              <h1 className='px-4 py-1.5 h-10 transition-all duration-300 cursor-pointer hover:bg-[var(--card)] rounded-md'>Interview</h1>
            </div>
            <Button className='bg-primary text-primary-foreground font-semibold cursor-pointer hover:bg-primary-hover duration-300'><SquarePen className='resize-custom w-4 h-4' /> Create</Button>
          </div>

          <ScrollArea className="w-full mt-4 py-2 h-[calc(100%-16.5rem)]">
            {isLoading &&
              <>
                <div className="w-full flex gap-4 cursor-pointer">
                  <Skeleton className="w-10 h-10 rounded-full"></Skeleton>
                  <div className="w-[90%] border-b-2 pb-4">
                    <Skeleton className='w-36 h-6'></Skeleton>
                    <Skeleton className='w-full h-10 my-4'></Skeleton>
                    <Skeleton className='w-[95%] h-12'></Skeleton>
                    <Skeleton className='w-40 h-8 my-4'></Skeleton>
                  </div>
                </div>
                <div className="w-full flex gap-4 cursor-pointer mt-3">
                  <Skeleton className="w-10 h-10 rounded-full"></Skeleton>
                  <div className="w-[90%] border-b-2 pb-4">
                    <Skeleton className='w-36 h-6'></Skeleton>
                    <Skeleton className='w-full h-10 my-4'></Skeleton>
                    <Skeleton className='w-[95%] h-12'></Skeleton>
                    <Skeleton className='w-40 h-8 my-4'></Skeleton>
                  </div>
                </div>
              </>
            }
            {!isLoading && allSolutions.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No community solutions yet. Be the first to share a solution.
              </p>
            )}

            {(allSolutions.length > 0 && !isLoading) && allSolutions.map((ele, index) =>
              <div key={index} className="w-full flex gap-4 mt-6 cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-white overflow-hidden border">
                  <Link href={`/dashboard/${typeof ele.userId === "string" ? ele.userId : ele.userId.uid ?? ele.userId._id ?? ""}`}>
                    <img src={typeof ele.userId === "string" ? "" : ele.userId.avatar} alt="" className="w-full h-full object-cover" />
                  </Link>
                </div>
                <div className="w-[90%] border-b-2 pb-4">
                  <Link href={`/solution-post/${ele._id}`} key={index}>
                    <p className="text-sm dark:text-gray-400">CodeArena · {formatDate(ele.createdAt as Date)}</p>
                    <h2 className="font-semibold text-xl my-2">{ele.title}</h2>
                    <p className="text-sm dark:text-gray-400 line-clamp-2">{(ele.explanation ?? "").split("Explanation:\n\n")[1] ?? ele.explanation}</p>
                  </Link>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
      <DiscussPageSideBox />
    </div>
  )
}
