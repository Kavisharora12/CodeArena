"use client";

import { useParams } from "next/navigation";
import Topbar from "@/components/Topbar/Topbar";
import Workspace from "@/components/Workspace/Workspace";
import { problems } from "@/mockProblems/problem";

export default function ProblemPage() {
	const params = useParams();

	const pid = params.pid as string;

	const problem = problems.find((problem) => problem.id === pid);

	if (!problem) {
		return (
			<div className="bg-dark-layer-2 min-h-screen text-white">
				<Topbar problemPage />
				<div className="flex items-center justify-center h-[calc(100vh-50px)]">
					<h1 className="text-xl">Problem not found</h1>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-dark-layer-2">
			<Topbar problemPage />
			<Workspace problem={problem} />
		</div>
	);
}