"use client";

type ProblemsTableProps = {
	setLoadingProblems: (loading: boolean) => void;
};

export default function ProblemsTable({
	setLoadingProblems,
}: ProblemsTableProps) {
	return (
		<tbody>
			<tr>
				<td colSpan={5} className="px-6 py-4">
					Loading problems...
				</td>
			</tr>
		</tbody>
	);
}