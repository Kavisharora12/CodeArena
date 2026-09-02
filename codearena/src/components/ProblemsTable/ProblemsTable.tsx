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
					{/* Problem */}
					<td className="px-6 py-4">
						<Link
							href={`/problems/${problem.id}`}
							className="text-white hover:text-brand-orange"
						>
							{problem.title}
						</Link>
					</td>

					{/* Difficulty */}
					<td className="px-6 py-4">
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

					{/* Category */}
					<td className="px-6 py-4 text-gray-300">
						{problem.category}
					</td>

					{/* Order */}
					<td className="px-6 py-4 text-gray-300">
						{problem.order}
					</td>

					{/* Video */}
					<td className="px-6 py-4">
						{problem.videoId ? (
							<span className="text-green-400">
								Available
							</span>
						) : (
							<span className="text-gray-500">
								coming soon
							</span>
						)}
					</td>
				</tr>
			))}
		</tbody>
	);
}