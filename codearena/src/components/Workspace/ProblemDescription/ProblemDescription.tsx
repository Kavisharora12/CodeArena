"use client";

import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, firestore } from "@/firebase/firebase";
import {
	doc,
	getDoc,
	runTransaction,
	arrayUnion,
	arrayRemove,
	updateDoc,
} from "firebase/firestore";

import { Problem } from "@/mockProblems/problem";

import {
	AiFillLike,
	AiFillDislike,
	AiFillStar,
} from "react-icons/ai";

import { BsCheck2Circle } from "react-icons/bs";
import { TiStarOutline } from "react-icons/ti";
import { toast } from "react-toastify";

type ProblemDescriptionProps = {
	problem: Problem;
};

const ProblemDescription: React.FC<ProblemDescriptionProps> = ({
	problem,
}) => {
	const [user] = useAuthState(auth);

	const [likes, setLikes] = useState(0);
	const [dislikes, setDislikes] = useState(0);

	const [liked, setLiked] = useState(false);
	const [disliked, setDisliked] = useState(false);
	const [starred, setStarred] = useState(false);

	const [updating, setUpdating] = useState(false);

	// Load problem and user data
	useEffect(() => {
		const loadData = async () => {
			try {
				const problemRef = doc(
					firestore,
					"problems",
					problem.id
				);

				const problemSnap = await getDoc(problemRef);

				if (problemSnap.exists()) {
					const data = problemSnap.data();

					setLikes(data.likes || 0);
					setDislikes(data.dislikes || 0);
				}

				if (user) {
					const userRef = doc(
						firestore,
						"users",
						user.uid
					);

					const userSnap = await getDoc(userRef);

					if (userSnap.exists()) {
						const userData = userSnap.data();

						setLiked(
							userData.likedProblems?.includes(
								problem.id
							) || false
						);

						setDisliked(
							userData.dislikedProblems?.includes(
								problem.id
							) || false
						);

						setStarred(
							userData.starredProblems?.includes(
								problem.id
							) || false
						);
					}
				}
			} catch (error) {
				console.error("Error loading problem data:", error);
			}
		};

		loadData();
	}, [problem.id, user]);

	// LIKE
	const handleLike = async () => {
		if (!user) {
			toast.error(
				"You must be logged in to like a problem",
				{
					position: "top-left",
					theme: "dark",
				}
			);
			return;
		}

		if (updating) return;

		setUpdating(true);

		try {
			const userRef = doc(
				firestore,
				"users",
				user.uid
			);

			const problemRef = doc(
				firestore,
				"problems",
				problem.id
			);

			await runTransaction(
				firestore,
				async (transaction) => {
					const userDoc =
						await transaction.get(userRef);

					const problemDoc =
						await transaction.get(problemRef);

					const userData = userDoc.exists()
						? userDoc.data()
						: {};

					const problemData =
						problemDoc.exists()
							? problemDoc.data()
							: {};

					const currentLikes =
						problemData.likes || 0;

					const currentDislikes =
						problemData.dislikes || 0;

					const likedProblems =
						userData.likedProblems || [];

					const dislikedProblems =
						userData.dislikedProblems || [];

					if (liked) {
						// REMOVE LIKE
						transaction.set(
							userRef,
							{
								likedProblems:
									likedProblems.filter(
										(id: string) =>
											id !== problem.id
									),
							},
							{ merge: true }
						);

						transaction.set(
							problemRef,
							{
								likes: Math.max(
									0,
									currentLikes - 1
								),
								dislikes:
									currentDislikes,
							},
							{ merge: true }
						);

						setLiked(false);
						setLikes(
							Math.max(0, currentLikes - 1)
						);
					} else {
						// ADD LIKE
						const newLikedProblems =
							[
								...likedProblems,
								problem.id,
							];

						const newDislikedProblems =
							dislikedProblems.filter(
								(id: string) =>
									id !== problem.id
							);

						transaction.set(
							userRef,
							{
								likedProblems:
									newLikedProblems,
								dislikedProblems:
									newDislikedProblems,
							},
							{ merge: true }
						);

						transaction.set(
							problemRef,
							{
								likes:
									currentLikes + 1,
								dislikes: disliked
									? Math.max(
											0,
											currentDislikes -
												1
										)
									: currentDislikes,
							},
							{ merge: true }
						);

						setLiked(true);
						setDisliked(false);
						setLikes(
							currentLikes + 1
						);

						if (disliked) {
							setDislikes(
								Math.max(
									0,
									currentDislikes -
										1
								)
							);
						}
					}
				}
			);
		} catch (error) {
			console.error(error);

			toast.error(
				"Something went wrong. Please try again.",
				{
					position: "top-left",
					theme: "dark",
				}
			);
		}

		setUpdating(false);
	};

	// DISLIKE
	const handleDislike = async () => {
		if (!user) {
			toast.error(
				"You must be logged in to dislike a problem",
				{
					position: "top-left",
					theme: "dark",
				}
			);
			return;
		}

		if (updating) return;

		setUpdating(true);

		try {
			const userRef = doc(
				firestore,
				"users",
				user.uid
			);

			const problemRef = doc(
				firestore,
				"problems",
				problem.id
			);

			await runTransaction(
				firestore,
				async (transaction) => {
					const userDoc =
						await transaction.get(userRef);

					const problemDoc =
						await transaction.get(problemRef);

					const userData = userDoc.exists()
						? userDoc.data()
						: {};

					const problemData =
						problemDoc.exists()
							? problemDoc.data()
							: {};

					const currentLikes =
						problemData.likes || 0;

					const currentDislikes =
						problemData.dislikes || 0;

					const likedProblems =
						userData.likedProblems || [];

					const dislikedProblems =
						userData.dislikedProblems || [];

					if (disliked) {
						// REMOVE DISLIKE
						transaction.set(
							userRef,
							{
								dislikedProblems:
									dislikedProblems.filter(
										(id: string) =>
											id !== problem.id
									),
							},
							{ merge: true }
						);

						transaction.set(
							problemRef,
							{
								likes:
									currentLikes,
								dislikes:
									Math.max(
										0,
										currentDislikes -
											1
									),
							},
							{ merge: true }
						);

						setDisliked(false);
						setDislikes(
							Math.max(
								0,
								currentDislikes - 1
							)
						);
					} else {
						// ADD DISLIKE
						const newDislikedProblems =
							[
								...dislikedProblems,
								problem.id,
							];

						const newLikedProblems =
							likedProblems.filter(
								(id: string) =>
									id !== problem.id
							);

						transaction.set(
							userRef,
							{
								dislikedProblems:
									newDislikedProblems,
								likedProblems:
									newLikedProblems,
							},
							{ merge: true }
						);

						transaction.set(
							problemRef,
							{
								likes: liked
									? Math.max(
											0,
											currentLikes -
												1
										)
									: currentLikes,
								dislikes:
									currentDislikes + 1,
							},
							{ merge: true }
						);

						setDisliked(true);
						setLiked(false);
						setDislikes(
							currentDislikes + 1
						);

						if (liked) {
							setLikes(
								Math.max(
									0,
									currentLikes - 1
								)
							);
						}
					}
				}
			);
		} catch (error) {
			console.error(error);

			toast.error(
				"Something went wrong. Please try again.",
				{
					position: "top-left",
					theme: "dark",
				}
			);
		}

		setUpdating(false);
	};

	// STAR
	const handleStar = async () => {
		if (!user) {
			toast.error(
				"You must be logged in to star a problem",
				{
					position: "top-left",
					theme: "dark",
				}
			);
			return;
		}

		if (updating) return;

		setUpdating(true);

		try {
			const userRef = doc(
				firestore,
				"users",
				user.uid
			);

			if (!starred) {
				await updateDoc(userRef, {
					starredProblems: arrayUnion(
						problem.id
					),
				});

				setStarred(true);
			} else {
				await updateDoc(userRef, {
					starredProblems: arrayRemove(
						problem.id
					),
				});

				setStarred(false);
			}
		} catch (error) {
			console.error(error);

			toast.error(
				"Could not update star. Make sure your user document exists.",
				{
					position: "top-left",
					theme: "dark",
				}
			);
		}

		setUpdating(false);
	};

	const getDescription = () => {
		switch (problem.id) {
			case "two-sum":
				return (
					<>
						<p>
							Given an array of integers{" "}
							<span className="text-white font-medium">
								nums
							</span>{" "}
							and an integer{" "}
							<span className="text-white font-medium">
								target
							</span>
							, return the indices of the two
							numbers such that they add up to
							target.
						</p>

						<p className="mt-4">
							You may assume that each input would
							have exactly one solution, and you may
							not use the same element twice.
						</p>

						<p className="mt-4">
							You can return the answer in any order.
						</p>
					</>
				);

			default:
				return (
					<p>
						Solve the given programming problem using
						an efficient algorithm.
					</p>
				);
		}
	};

	return (
		<div className="bg-dark-layer-1 h-full text-white overflow-y-auto">
			{/* TAB */}
			<div className="flex h-11 w-full items-center pt-2 bg-dark-layer-2">
				<div className="bg-dark-layer-1 rounded-t-[5px] px-5 py-[10px] text-xs cursor-pointer">
					Description
				</div>
			</div>

			<div className="px-6 py-6">
				{/* TITLE */}
				<h1 className="text-2xl font-medium text-white mb-4">
					{problem.order}. {problem.title}
				</h1>

				{/* DIFFICULTY + CATEGORY */}
				<div className="flex items-center gap-3 mb-5">
					<span
						className={
							problem.difficulty === "Easy"
								? "text-green-500 bg-green-500/10 px-3 py-1 rounded-full text-sm"
								: problem.difficulty === "Medium"
								? "text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm"
								: "text-red-500 bg-red-500/10 px-3 py-1 rounded-full text-sm"
						}
					>
						{problem.difficulty}
					</span>

					<span className="text-gray-400 bg-dark-layer-2 px-3 py-1 rounded-full text-sm">
						{problem.category}
					</span>
				</div>

				{/* LIKE / DISLIKE / STAR */}
				<div className="flex items-center gap-3 mb-7">
					<button
						type="button"
						onClick={handleLike}
						disabled={updating}
						className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
							liked
								? "bg-green-500/20 text-green-400"
								: "bg-dark-layer-2 text-gray-400 hover:text-green-400"
						}`}
						title="Like"
					>
						<AiFillLike className="text-lg" />

						<span className="text-sm">
							{likes}
						</span>
					</button>

					<button
						type="button"
						onClick={handleDislike}
						disabled={updating}
						className={`flex items-center gap-2 px-3 py-2 rounded-md transition ${
							disliked
								? "bg-red-500/20 text-red-400"
								: "bg-dark-layer-2 text-gray-400 hover:text-red-400"
						}`}
						title="Dislike"
					>
						<AiFillDislike className="text-lg" />

						<span className="text-sm">
							{dislikes}
						</span>
					</button>

					<button
						type="button"
						onClick={handleStar}
						disabled={updating}
						className={`flex items-center justify-center p-2 rounded-md transition ${
							starred
								? "bg-yellow-500/20 text-yellow-400"
								: "bg-dark-layer-2 text-gray-400 hover:text-yellow-400"
						}`}
						title="Star"
					>
						{starred ? (
							<AiFillStar className="text-xl" />
						) : (
							<TiStarOutline className="text-xl" />
						)}
					</button>
				</div>

				{/* DESCRIPTION */}
				<div className="text-gray-300 text-[15px] leading-7">
					{getDescription()}
				</div>

				{/* EXAMPLES */}
				<div className="mt-8">
					<h2 className="text-lg font-medium text-white mb-4">
						Examples
					</h2>

					<div className="mb-5">
						<p className="text-gray-300 mb-2">
							<strong className="text-white">
								Example 1:
							</strong>
						</p>

						<div className="bg-dark-layer-2 rounded-lg p-4 font-mono text-sm text-gray-300">
							{problem.id === "two-sum" ? (
								<>
									<p>
										Input: nums = [2,7,11,15],
										target = 9
									</p>

									<p>
										Output: [0,1]
									</p>

									<p className="mt-2 text-gray-500">
										Explanation: nums[0] +
										nums[1] = 2 + 7 = 9.
									</p>
								</>
							) : (
								<>
									<p>Input: Example input</p>
									<p>Output: Example output</p>
								</>
							)}
						</div>
					</div>
				</div>

				{/* CONSTRAINTS */}
				<div className="mt-8 pb-8">
					<h2 className="text-lg font-medium text-white mb-4">
						Constraints
					</h2>

					<ul className="space-y-3 text-gray-300 text-sm">
						<li className="flex items-start gap-3">
							<BsCheck2Circle className="text-gray-500 mt-1 shrink-0" />

							<span>
								The input must satisfy the given
								problem conditions.
							</span>
						</li>

						<li className="flex items-start gap-3">
							<BsCheck2Circle className="text-gray-500 mt-1 shrink-0" />

							<span>
								Your solution should handle valid
								inputs efficiently.
							</span>
						</li>

						<li className="flex items-start gap-3">
							<BsCheck2Circle className="text-gray-500 mt-1 shrink-0" />

							<span>
								Avoid unnecessary use of extra
								memory.
							</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default ProblemDescription;