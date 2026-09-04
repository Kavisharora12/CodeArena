"use client";

import Link from "next/link";
import { problems } from "@/mockProblems/problem";

type ProblemsTableProps = {
	setLoadingProblems: (loading: boolean) => void;
};

export default function ProblemsTable({
	setLoadingProblems,
}: ProblemsTableProps) {
	return (
		<tbody>
			{problems.map((problem) => (
				<tr
					key={problem.id}
					className="hover:bg-gray-800 transition-colors"
				>
					{/* STATUS */}
					<td className="px-1 py-4 w-[60px]">
						<div className="flex items-center justify-center">
							<div className="w-4 h-4 rounded-full border border-green-500 flex items-center justify-center">
								<span className="text-green-500 text-xs">
									✓
								</span>
							</div>
						</div>
					</td>

					{/* TITLE */}
					<td className="px-6 py-4 w-[300px]">
						<Link
							href={`/problems/${problem.id}`}
							className="text-gray-300 hover:text-white"
						>
							{problem.order}. {problem.title}
						</Link>
					</td>

					{/* DIFFICULTY */}
					<td className="px-6 py-4 w-[150px]">
						<span
							className={
								problem.difficulty === "Easy"
									? "text-green-500"
									: problem.difficulty === "Medium"
									? "text-yellow-500"
									: "text-red-500"
							}
						>
							{problem.difficulty}
						</span>
					</td>

					{/* CATEGORY */}
					<td className="px-6 py-4 w-[200px] text-gray-300">
						{problem.category}
					</td>

					{/* SOLUTION */}
					<td className="px-6 py-4 w-[150px]">
						{problem.videoId ? (
							<span className="text-white">
								▶
							</span>
						) : (
							<span className="text-gray-500">
								Coming soon
							</span>
						)}
					</td>
				</tr>
			))}
		</tbody>
	);
}